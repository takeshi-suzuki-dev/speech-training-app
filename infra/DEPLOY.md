# Cadence Deploy Runbook

AWS account: `459100131283` / Region: `ap-northeast-1`

| What           | Where                                          |
| -------------- | ---------------------------------------------- |
| App (frontend) | `https://speech-training-app-2f3r.vercel.app`  |
| API endpoint   | `https://d22r3g893vf4i5.cloudfront.net`        |

The Vercel URL above is the stable production domain. Per-deployment URLs
(the ones with a build hash, e.g. `...-b4eok0oer-...vercel.app`) change on
every push — never put those in `CORS_ALLOWED_ORIGINS` or Firebase's
authorized domains.

CloudFront still fronts the ALB, but now serves only the API. It provides the
HTTPS termination the ALB itself doesn't have, so it stays in place even
though the frontend has moved off AWS.

---

## Backend redeploy (code change)

Run from the `backend/` directory.

```bash
# 0. Start Docker Desktop if it is not already running
docker info > /dev/null 2>&1 || open -a Docker

# 1. Build (amd64 is required for Fargate)
docker build --platform=linux/amd64 -t cadence-backend:local .

# 2. Log in to ECR (token expires after 12 hours)
aws ecr get-login-password --region ap-northeast-1 \
  | docker login --username AWS --password-stdin 459100131283.dkr.ecr.ap-northeast-1.amazonaws.com

# 3. Tag and push
docker tag cadence-backend:local \
  459100131283.dkr.ecr.ap-northeast-1.amazonaws.com/cadence-backend:latest

docker push 459100131283.dkr.ecr.ap-northeast-1.amazonaws.com/cadence-backend:latest

# 4. Force ECS to pull the new image
aws ecs update-service \
  --cluster cadence-cluster \
  --service cadence-backend-svc \
  --task-definition cadence-backend --desired-count 1 \
  --force-new-deployment \
  --region ap-northeast-1 \
  --query 'service.{Name:serviceName,TaskDef:taskDefinition}' --output table
```

Only when the task definition itself changed (env vars, cpu/memory, secrets).
Run these from the repository root:

```bash
aws ecs register-task-definition \
  --cli-input-json file://infra/cadence-backend-taskdef.json \
  --region ap-northeast-1 \
  --query 'taskDefinition.{Family:family,Rev:revision}' --output table

aws ecs update-service \
  --cluster cadence-cluster --service cadence-backend-svc \
  --task-definition cadence-backend \
  --desired-count 1　--force-new-deployment \
  --region ap-northeast-1
```

---

## Frontend redeploy (code change)

The frontend is hosted on Vercel, connected to the GitHub repository. Pushing
to the default branch deploys automatically — there is no manual build or
push step. Pull requests get their own preview deployment.

Vercel project settings:

| Setting        | Value      |
| -------------- | ---------- |
| Root directory | `frontend` |
| Framework      | Next.js    |
| Build command  | (default)  |

`NEXT_PUBLIC_*` values are inlined at build time, so changing one in the
Vercel dashboard requires a redeploy before it takes effect.

| Environment variable                       | Value                                     |
| ------------------------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                 | `https://d22r3g893vf4i5.cloudfront.net`   |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | (from Firebase console)                   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | (from Firebase console)                   |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | (from Firebase console)                   |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | (from Firebase console)                   |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (from Firebase console)                   |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | (from Firebase console)                   |

Unlike the previous ECS setup, the frontend is now on a different origin from
the API, so it calls the backend by absolute URL and depends on CORS. Two
places must list the Vercel domain:

- `CORS_ALLOWED_ORIGINS` in `infra/cadence-backend-taskdef.json` (redeploy the
  backend after changing it)
- Firebase Console → Authentication → Settings → Authorized domains

---

## Verify

### 1. Wait for the rollout to finish

```bash
aws ecs describe-services --cluster cadence-cluster --services cadence-backend-svc \
  --region ap-northeast-1 \
  --query 'services[0].deployments[].{Status:status,TaskDef:taskDefinition,Running:runningCount,Rollout:rolloutState}' --output table
```

Repeat until a single row remains: `PRIMARY` / `COMPLETED` / `Running 1`.

| What is shown                      | Meaning                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `PRIMARY IN_PROGRESS` + `ACTIVE`   | Still switching over. The old task is still serving traffic.         |
| `PRIMARY IN_PROGRESS`, Running 0   | New task is failing to start — check the logs below.                 |
| `PRIMARY IN_PROGRESS` + `DRAINING` | Old task stopped, waiting on two consecutive health checks (~1 min). |
| `PRIMARY COMPLETED`, Running 1     | Done. The new image is live.                                         |

Takes 2-4 minutes normally. If it loops for more than ~10 minutes, the task is
crash-looping; go to the logs.

Frontend rollouts are visible in the Vercel dashboard instead.

### 2. Logs and target health

```bash
# Backend logs (stack trace lines removed)
aws logs tail /ecs/cadence-backend --since 10m --region ap-northeast-1 \
  | grep -vE "^\s+at " | tail -40

# Target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-1:459100131283:targetgroup/cadence-backend-tg/dfb688ff8e874a18 \
  --region ap-northeast-1 \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}' --output table
```

If targets stay `draining`, check the logs above. The app takes about 50 seconds
to start, which is why the health check grace period is set to 120 seconds.

---

## Cost control

Stop billing while not job-hunting (ALB and CloudFront remain, task stops):

```bash
aws ecs update-service --cluster cadence-cluster --service cadence-backend-svc \
  --desired-count 0 --region ap-northeast-1
```

Restart with `--desired-count 1`. Note that the Vercel-hosted frontend stays
up either way — it will show upstream errors while the backend is stopped.

Rough monthly cost: ALB ~$18, Fargate task ~$18, CloudFront ~$0 (free tier),
Vercel ~$0 (hobby tier).

---

## Resource reference

| Resource       | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Cluster        | `cadence-cluster`                                         |
| Service        | `cadence-backend-svc`                                     |
| ALB DNS        | `cadence-alb-1420556356.ap-northeast-1.elb.amazonaws.com` |
| CloudFront     | `d22r3g893vf4i5.cloudfront.net` (ID `E2X7DMO9FGPFKC`)     |
| Listener rule  | `/api/*` and `/public/*` → backend                        |
| Secrets        | `cadence/backend`, `cadence/firebase-service-account`     |
| Task exec role | `cadenceTaskExecutionRole`                                |
| Task SG        | `sg-039ae41d9dd7d9d27` (inbound 8080 from ALB SG only)    |
| ALB SG         | `sg-0a10729408a8be243` (inbound 80 from internet)         |
| Frontend       | Vercel (GitHub-connected, root directory `frontend`)      |
