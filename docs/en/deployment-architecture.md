# Deployment Architecture

The frontend is hosted on Vercel. The backend runs as a container on AWS
ECS/Fargate behind an Application Load Balancer, with CloudFront in front for
HTTPS.

API endpoint: https://d22r3g893vf4i5.cloudfront.net

---

## Request flow

```
Browser
  │ HTTPS                          │ HTTPS (cross-origin, CORS)
  ▼                                ▼
Vercel (Next.js)             CloudFront  (TLS termination)
                                   │ HTTP
                                   ▼
                             Application Load Balancer
                                   │ /api/*, /public/*
                                   ▼
                             Fargate task: Spring Boot (port 8080)
                                   │
                                   ▼
                   Supabase PostgreSQL / Supabase Storage
                   Azure AI Speech / ElevenLabs
```

---

## Resources

| Layer          | Resource                                                               |
| -------------- | ---------------------------------------------------------------------- |
| Frontend       | Vercel project, GitHub-connected, root directory `frontend`            |
| Registry       | ECR: `cadence-backend`                                                 |
| Orchestration  | ECS cluster `cadence-cluster`, service `cadence-backend-svc`           |
| Load balancing | ALB `cadence-alb`, target group `cadence-backend-tg` (8080)            |
| CDN / TLS      | CloudFront distribution fronting the ALB                               |
| Secrets        | Secrets Manager: `cadence/backend`, `cadence/firebase-service-account` |
| Logs           | CloudWatch Logs: `/ecs/cadence-backend`                                |
| IAM            | Task execution role `cadenceTaskExecutionRole`                         |

Region: `ap-northeast-1`. Operational procedures are in
[`infra/DEPLOY.md`](../../infra/DEPLOY.md).

---

## Network

Two security groups, referencing each other rather than IP ranges:

- ALB security group: inbound 80 from the internet
- Task security group: inbound 8080 and 3000 **from the ALB security group only**

Fargate task IPs change on every deployment, so an IP-based rule would be both
unstable and too permissive. Referencing the ALB's security group means only
traffic that passed through the load balancer can reach a task.

Tasks run in public subnets with `assignPublicIp=ENABLED`. The textbook layout
is private subnets plus a NAT Gateway, but a NAT Gateway costs more per month
than the rest of this stack combined, and the tasks need outbound access only to
pull images and call third-party APIs.

---

## Secrets handling

Seven values are injected at task start through the task definition's `secrets`
block, not `environment`, so they never appear in the console's task definition
view.

`cadence/backend` holds six application values as a JSON document, and
individual keys are referenced with the `:KEY::` ARN suffix. The Firebase service
account JSON is stored as a separate secret and injected whole, because nesting
JSON inside JSON invites escaping mistakes.

ECS can only inject secrets as environment variables, while the Firebase Admin
SDK's `GoogleCredentials.getApplicationDefault()` expects a file path. To bridge
that, `FirebaseConfig` reads the service account from
`FIREBASE_CREDENTIALS_JSON` when it is present and falls back to Application
Default Credentials when it is blank, which keeps local development on the
existing file-based setup.

---

## Design decisions

**ECS/Fargate rather than App Runner.** App Runner would have been faster to set
up, but it hides the load balancer, networking, and task lifecycle — the parts
worth understanding and worth being able to discuss.

**Vercel for the frontend.** The frontend was originally a second Fargate task
behind the same ALB, which kept everything on one origin but cost roughly the
same as the backend to run and needed a Docker build and ECS rollout for every
change. Vercel serves the same Next.js app on its free tier with a git push,
which removes about a third of the monthly cost and most of the frontend
deployment steps. The trade-off is accepting a cross-origin setup — see below.

**CloudFront kept, now for the API only.** Firebase Authentication requires
HTTPS, and a browser on an HTTPS page blocks requests to an HTTP API. The ALB
has no certificate of its own and an ACM certificate would need a domain, so
CloudFront still supplies a trusted certificate at no cost. It fronts only
`/api/*` and `/public/*` now that the frontend has moved.

**Absolute API base URL and CORS.** With the frontend on a different origin,
relative `/api/...` paths no longer reach the backend, so
`NEXT_PUBLIC_API_BASE_URL` points at the CloudFront distribution and the Vercel
domain is listed in `CORS_ALLOWED_ORIGINS`. `NEXT_PUBLIC_*` values are inlined
at build time, so changing the API URL requires a redeploy rather than a
restart.

**HikariCP pool capped at 5.** Supabase's free-tier pooler allows 15 session-mode
clients. HikariCP defaults to 10, and a rolling deployment runs the old and new
task simultaneously, so the default configuration exceeded the limit and new
tasks failed to start mid-deployment.

---

## Problems encountered

**Same-origin POST requests still trigger CORS.** Browsers attach an `Origin`
header to every non-GET request, including same-origin ones, and CloudFront
forwards it. Spring saw an `Origin` it did not recognise and rejected the request
with `403 Invalid CORS request`. GET requests were unaffected, so category lists
loaded while sample-audio generation and scoring failed. Allowed origins are now
supplied through `CORS_ALLOWED_ORIGINS`.

**History was device-bound and unauthorized.** `training_attempts` was keyed by a
`client_id` UUID generated in the browser and stored in `localStorage`, then sent
as a request parameter and used without checking it belonged to the caller. Any
authenticated user could read another user's history by supplying their id, and
the same user saw no history on a different device. The column is now `user_id`,
derived server-side from the authenticated Firebase UID with
`UUID.nameUUIDFromBytes`, which produces the same UUID for the same user without
a schema change or session lookup.

**`latest` image tags hide stale deployments.** A code fix was verified locally
but the rebuilt image was never pushed, so ECS kept pulling the previous image
and the fix appeared not to work. Tagging by commit hash would make this
impossible; until then, push and `--force-new-deployment` are treated as a single
step.

---

## Cost

Roughly USD 36 per month: ALB about 18, one Fargate task about 18, CloudFront
within the free tier, Vercel on the hobby tier. Scaling the service to zero
stops the task charge while leaving the ALB and distribution in place; the
frontend stays up regardless, showing upstream errors until the backend
returns.
