# alfabetica-panel-webapp

Panel administrativo de **Alfabética** (Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui).
Consume `alfabetica-panel-api` a través de un BFF propio y, mientras el API se completa, funciona con un **servidor simulado** que respeta el mismo contrato.

## Requisitos

- Node.js ≥ 20.9 (recomendado 22 o 24)
- pnpm 10

## Arranque

```bash
pnpm install
cp .env.example .env.local      # en Windows: copy .env.example .env.local
pnpm dev                         # http://localhost:3000
```

Entra con **Continuar con Google**. En modo simulado eliges el perfil:

| Perfil | Permisos | Para probar |
|---|---|---|
| Administrador | todos | flujo completo |
| Editorial | projects, publication | Portafolio y Producción en solo lectura |
| Solo lectura | ninguno | estados "solo lectura" en todos los módulos |
| No invitado | — | error `USER_NOT_INVITED` del login |

Los datos simulados viven en memoria y se reinician al detener el servidor.

## Scripts

| Script | Uso |
|---|---|
| `pnpm dev` | Desarrollo |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` | ESLint (reglas de Next + React Hooks) |
| `pnpm typecheck` | `tsc --noEmit` |

## Conectar con panel-api

Todo se controla con variables de entorno (`.env.example` está documentado):

- `PANEL_API_URL`: URL del panel-api (solo servidor).
- `API_MODE` y `API_MODE_<MÓDULO>` = `mock` | `real` (AUTH, USERS, PROJECTS, PORTFOLIO, PUBLICATION, MEDIA, PRODUCTION, DASHBOARD).
- `NEXT_PUBLIC_AUTH_PROVIDER` = `mock` | `firebase` y las `NEXT_PUBLIC_FIREBASE_*`.
- `NEXT_PUBLIC_FEATURE_STORE` = `false` muestra "Próximamente" en `/tienda`.

Pasos y pendientes del API: [`docs/API_NOTES.md`](docs/API_NOTES.md).

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): estructura, patrones, autenticación y seguridad.
- [`docs/API_NOTES.md`](docs/API_NOTES.md): anotaciones para revisar en panel-api.

## Recursos de marca pendientes

Los bloques marcados con `data-placeholder` (logo e ilustraciones) esperan los assets oficiales de Alfabética: `src/shared/components/layout/brand-mark.tsx`.
