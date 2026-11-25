---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: architecture
summary: "In the context of self-hosted servers updated on the user's schedule, facing clients and servers of different versions, we decided on capability flags with additive-only changes and rejected version-number comparison and lockstep updates, to achieve clients that keep working with other server versions, accepting that old fields cannot be removed or renamed within a major version."
supersedes: []
---

# API versioning by capabilities

## Context and Problem Statement

How do a client and a server of different versions work together, when each user updates their
own server whenever they choose? See [SPEC section 3.2](../SPEC.md#32-versioning-between-client-and-server)
and the [requirements](../requirements.md).

## Considered Options

* Capability flags, with additive-only changes within a major API version
* Clients compare semantic version numbers
* No compatibility rule: client and server are always updated together

## Decision Outcome

Chosen option: "Capability flags, with additive-only changes within a major API version",
because a client then depends on what a server can do, not on which release it is.

* `GET /health` returns `apiVersion` and `capabilities`.
* A client turns a feature on when its capability is listed, not by comparing version numbers.
* Within one major API version, change only by adding; never remove or rename fields.
* With a too-old server, the client says the server needs an update and continues in a limited
  mode.
* Deprecation is soft: warn first, block later.

Rejected: comparing semantic version numbers, because it couples client releases to server
versions; no compatibility rule, because self-hosted servers update on the user's schedule.

### Consequences

* Good, because a client keeps working with older and newer servers of the same major version
* Good, because a new feature appears only where the server supports it
* Bad, because fields cannot be removed or renamed within a major version
* Bad, because the client has to handle a missing capability

### Confirmation

Not checked yet: a contract test in `packages/api-contract` once the server skeleton exists.
