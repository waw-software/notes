---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: operations
summary: "In the context of a server that one user deploys on their own machine, facing the effort of running and updating it, we decided on one Docker image with Postgres as the only other service and rejected a separate queue service and separate images, to achieve simple deployment and updates, accepting that Postgres also carries the job queue and the API, Worker and web client ship together."
supersedes: []
---

# Server delivery and storage

## Context and Problem Statement

How is the server packaged, and where does it keep its data and its jobs? The user deploys and
updates it alone. See [SPEC sections 3 and 3.1](../SPEC.md#3-architecture) and the
[requirements](../requirements.md).

## Considered Options

* One Docker image with the API, the Worker and the web client, and a compose file with two
  services, the server and Postgres
* A separate Redis (or similar) queue service
* Separate images for the API, the Worker and the web client

## Decision Outcome

Chosen option: "One Docker image with the API, the Worker and the web client, and a compose
file with two services, the server and Postgres", because it leaves the user the least to
deploy and keep in step.

* `docker-compose.yml` has two services: the server and Postgres.
* Postgres holds the notes, the search index and the job queue. There is no Redis.
* Image files live on a volume on the server; Postgres holds their metadata.
* Database migrations run automatically on start.
* Updating is `docker compose pull && docker compose up -d`.

Rejected: a separate Redis (or similar) queue service, because it is one more service for a
single-user self-hosted server; separate images for the API, the Worker and the web client,
because there is more to deploy and keep in step.

### Consequences

* Good, because deploying and updating take one compose file and one command
* Good, because there is no queue service to run
* Bad, because the job queue shares Postgres with the notes and the search index
* Bad, because the API, the Worker and the web client cannot be released separately

### Confirmation

Not checked yet: the server-skeleton slice ([SPEC section 8](../SPEC.md#8-build-order-proposed),
slice 2) starts the stack from the compose file.
