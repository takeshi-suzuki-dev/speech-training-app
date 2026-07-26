# Deployment Architecture

Both the frontend and the backend run as containers on AWS ECS/Fargate behind a
single Application Load Balancer, with CloudFront in front for HTTPS.

Live URL: https://d22r3g893vf4i5.cloudfront.net

---

## Request flow

```
Browser
  │ HTTPS
  ▼
CloudFront  (TLS termination, redirect-to-https)
  │ HTTP
  ▼
Application Load Balancer
  ├── /api/*  ──►  Fargate task: Spring Boot (port 8080)
  └── /*      ──►  Fargate task: Next.js standalone (port 3000)
                        │
                        ▼
        Supabase PostgreSQL / Supabase Storage
        Azure AI Speech / ElevenLabs
```

---

## Resources

| Layer          | Resource                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| Registry       | ECR: `cadence-backend`, `cadence-frontend`                                                 |
| Orchestration  | ECS cluster `cadence-cluster`, services `cadence-backend-svc`, `cadence-frontend-svc`      |
| Load balancing | ALB `cadence-alb`, target groups `cadence-backend-tg` (8080), `cadence-frontend-tg` (3000) |
| CDN / TLS      | CloudFront distribution fronting the ALB                                                   |
| Secrets        | Secrets Manager: `cadence/backend`, `cadence/firebase-service-account`                     |
| Logs           | CloudWatch Logs: `/ecs/cadence-backend`, `/ecs/cadence-frontend`                           |
| IAM            | Task execution role `cadenceTaskExecutionRole`                                             |

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

**One ALB with path-based routing, not separate hosts.** Serving the frontend
and the API from the same origin removes cross-origin requests from production
entirely, and keeps the whole stack behind a single load balancer.

**CloudFront for HTTPS instead of a custom domain.** Firebase Authentication
requires HTTPS, and a browser on an HTTPS page blocks requests to an HTTP API.
An ACM certificate on the ALB would need a domain; CloudFront supplies a
trusted certificate on its own domain at no cost.

**Relative API base URL.** `NEXT_PUBLIC_*` values are inlined into the bundle at
build time, so an absolute API URL would tie each image to one environment and
force a rebuild whenever the domain changed. Building with
`NEXT_PUBLIC_API_BASE_URL` empty produces relative `/api/...` paths, which
resolve against whatever origin serves the page.

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

Roughly USD 54 per month: ALB about 18, two Fargate tasks about 36, CloudFront
within the free tier. Scaling both services to zero stops the task charges while
leaving the ALB and distribution in place.
