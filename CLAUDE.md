# CLAUDE.md — alfabetica-panel-webapp

Frontend del panel administrativo de Alfabética. Lee primero `docs/ARCHITECTURE.md` (estructura y patrones) y `AGENTS.md` (Next.js 16: consultar `node_modules/next/dist/docs/` antes de usar APIs de Next).

## Reglas
- Código, identificadores y nombres de archivo en inglés; textos de UI y rutas en español.
- El navegador solo habla con `/api/*` (BFF). Rutas del API centralizadas en `src/core/http/endpoints.ts`; tipos en `src/contracts/`.
- Nueva pantalla = nueva carpeta en `src/features/<module>` siguiendo `features/projects` como referencia; reutilizar `src/shared/*` antes de crear componentes.
- No modificar `alfabetica-panel-api` desde aquí: lo que haga falta allá va a `docs/API_NOTES.md`.
- Commits en inglés, conventional commits, una unidad de trabajo por commit.
- Verificar con `pnpm typecheck && pnpm lint && pnpm build`.
