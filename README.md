# nets-monorepo

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To run the docker images:
docker-compose up

nats:
cd cloud-runs/dispatcher-service/nats
docker-compose up

To run cloud-runs services:
bun run cloud-runs/alerts-service/src/index.ts
bun run cloud-runs/dispatcher-service/alerts-consumer/src/index.ts

to run the web app:
cd web/alerts-web
bun run dev

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
