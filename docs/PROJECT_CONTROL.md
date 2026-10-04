# Project control

Status: active

This page routes work to its authority. It is intentionally smaller than the
system it borrows from.

| Subject | Authority |
|---|---|
| Product purpose and learning contract | `docs/PRODUCT_SPEC.md` |
| Architecture and boundaries | `docs/ARCHITECTURE.md` |
| Product and technical decisions | `docs/DECISIONS.md` |
| Delivery order and acceptance | `docs/DELIVERY_PLAN.md` |
| Reuse provenance | `docs/REUSE_REGISTER.md` |
| Listening-source provenance | `docs/SOURCE_REGISTER.md` |
| Design language and bilingual UX | `docs/DESIGN_SYSTEM.md` |
| Work status and verification | `docs/CHANGE_LEDGER.md` |

## Precedence

Safety, privacy, source integrity, the no-score invariant, and access control
win conflicts. A newer decision wins only when it explicitly supersedes an
older one. Code demonstrates current behaviour but does not silently authorize
a changed product rule.

## Completion language

- **Planned:** accepted in the repository plan.
- **Source-complete:** implemented and locally verified at a named commit.
- **Container-verified:** the production-shaped Compose path passed locally.
- **Deployed:** a named artifact is running in a named environment.
- **Classroom-verified:** the actual teacher/learner journey was observed.

These states are never interchangeable.
