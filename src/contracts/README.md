# contracts

TypeScript mirror of the `alfabetica-panel-api` request/response DTOs.
Shared by the feature modules (client) and the mock server (`src/server/mock`), so both
always speak the exact same contract.

- Types marked `@api existing` mirror a DTO that exists today in panel-api.
- Types/fields marked `@api proposed` do not exist yet; they are the shape the panel expects
  and are listed in `docs/API_NOTES.md`. Proposed fields on existing DTOs are optional (`?`)
  so the UI degrades gracefully when the real API does not send them.
- Dates arrive as ISO strings; Prisma `Decimal` arrives as string.
