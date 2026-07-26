# Cadence Deploy Runbook

AWS account: `459100131283` / Region: `ap-northeast-1`
Public URL: https://d22r3g893vf4i5.cloudfront.net

---

## Backend redeploy (code change)

Run from the `backend/` directory.

```bash
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
  --force-new-deployment \
  --region ap-northeast-1 \
  --query 'service.{Name:serviceName,TaskDef:taskDefinition}' --output table
```

Only when the task definition itself changed (env vars, cpu/memory, secrets):

```bash
aws ecs register-task-definition \
  --cli-input-json file://infra/cadence-backend-taskdef.json \
  --region ap-northeast-1 \
  --query 'taskDefinition.{Family:family,Rev:revision}' --output table

aws ecs update-service \
  --cluster cadence-cluster --service cadence-backend-svc \
  --task-definition cadence-backend --force-new-deployment \
  --region ap-northeast-1
```

---

## Frontend redeploy (code change)

Run from the `frontend/` directory.
`NEXT_PUBLIC_API_BASE_URL` stays empty so the bundle uses relative URLs.

```bash
docker build --platform=linux/amd64 \
  $(grep '^NEXT_PUBLIC' .env.local | grep -v API_BASE_URL | sed 's/^/--build-arg /' | tr '\n' ' ') \
  --build-arg NEXT_PUBLIC_API_BASE_URL= \
  -t cadence-frontend:local .

docker tag cadence-frontend:local \
  459100131283.dkr.ecr.ap-northeast-1.amazonaws.com/cadence-frontend:latest

docker push 459100131283.dkr.ecr.ap-northeast-1.amazonaws.com/cadence-frontend:latest

aws ecs update-service \
  --cluster cadence-cluster \
  --service cadence-frontend-svc \
  --force-new-deployment \
  --region ap-northeast-1

# Clear cached HTML if the old page keeps showing
aws cloudfront create-invalidation \
  --distribution-id E2X7DMO9FGPFKC --paths "/*"
```

---

## Verify

### 1. Wait for the rollout to finish

```bash
# Backend
aws ecs describe-services --cluster cadence-cluster --services cadence-backend-svc \
  --region ap-northeast-1 \
  --query 'services[0].deployments[].{Status:status,TaskDef:taskDefinition,Running:runningCount,Rollout:rolloutState}' --output table

#Frontend
aws ecs describe-services --cluster cadence-cluster --services cadence-frontend-svc \
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

Same command for the frontend, with `--services cadence-frontend-svc`.

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

aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-1:459100131283:targetgroup/cadence-frontend-tg/574f7ed07581264e \
  --region ap-northeast-1 \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}' --output table
```

If targets stay `draining`, check the logs above. The app takes about 50 seconds
to start, which is why the health check grace period is set to 120 seconds.

---

## Cost control

Stop billing while not job-hunting (ALB and CloudFront remain, tasks stop):

```bash
aws ecs update-service --cluster cadence-cluster --service cadence-backend-svc \
  --desired-count 0 --region ap-northeast-1
aws ecs update-service --cluster cadence-cluster --service cadence-frontend-svc \
  --desired-count 0 --region ap-northeast-1
```

Restart with `--desired-count 1`.

Rough monthly cost: ALB ~$18, Fargate tasks ~$36, CloudFront ~$0 (free tier).

---

## Resource reference

| Resource       | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Cluster        | `cadence-cluster`                                           |
| Services       | `cadence-backend-svc` / `cadence-frontend-svc`              |
| ALB DNS        | `cadence-alb-1420556356.ap-northeast-1.elb.amazonaws.com`   |
| CloudFront     | `d22r3g893vf4i5.cloudfront.net` (ID `E2X7DMO9FGPFKC`)       |
| Listener rule  | `/api/*` → backend, default → frontend                      |
| Secrets        | `cadence/backend`, `cadence/firebase-service-account`       |
| Task exec role | `cadenceTaskExecutionRole`                                  |
| Task SG        | `sg-039ae41d9dd7d9d27` (inbound 8080/3000 from ALB SG only) |
| ALB SG         | `sg-0a10729408a8be243` (inbound 80 from internet)           |
