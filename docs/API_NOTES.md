---
tipo: anotaciones
proyecto: alfabetica-panel-api
origen: alfabetica-panel-webapp
---

# Anotaciones para panel-api (desde panel-webapp)

> El panel-webapp **no modificó** el panel-api. Esta nota reúne lo que el front necesita o detectó, para revisarlo y decidir. Cada punto indica prioridad: 🔴 bloquea una función en `real` · 🟡 recomendado · 🟢 opcional.
>
> Estado (2026-10-20): auth, usuarios, proyectos, media (scope PORTFOLIO), portafolio y producción corren contra el panel-api local. Tienda y Resumen siguen en mock.

## 1. Infraestructura y seguridad

| # | Punto | Prioridad | Detalle |
|---|---|---|---|
| 1.1 | **CORS de Spaces** | 🔴 (subidas) | Verificado el 2026-10-20: el preflight `OPTIONS` a `alfabetica-media.sfo3.digitaloceanspaces.com` responde **403 sin `Access-Control-Allow-Origin`** para `http://localhost:3000` (PUT y GET). El bucket no tiene reglas CORS. El navegador hace `PUT` directo a la URL prefirmada con `Content-Type`, así que hoy **ninguna subida funciona** desde el panel. Agregar una regla: origen `http://localhost:3000` (y el dominio del panel), métodos `PUT`, `GET`, header `Content-Type`. |
| 1.2 | **CORS del API** | 🟢 | `main.ts` no llama `enableCors`. El panel no lo necesita (BFF, mismo origen). Solo hará falta si otro front llama directo. |
| 1.3 | **Dominio de la cookie** | 🟡 | `refreshToken` sin `domain`/`path`; vía BFF queda en el dominio del panel (correcto). En producción va con `secure`. |
| 1.4 | **Rate limit en `/auth/login` y `/auth/refresh`** | 🟡 | Sin throttling. Sugerencia: `@nestjs/throttler`. El BFF reenvía `x-forwarded-for`; activar `trust proxy` detrás de Dokku/Cloudflare. |
| 1.5 | **Headers de seguridad** | 🟢 | `helmet()` en `main.ts`. |
| 1.6 | **Rotación de refresh token** | 🟢 | No rota (decisión documentada). El front ya renueva el access token (15 min) con un solo refresh compartido y reintenta una vez. |
| 1.7 | **Break-glass superadmin** | 🟡 | Sin implementar. `POST /media/cleanup-pending` usa `settings` temporalmente. |
| 1.8 | **Seed de `SiteSettings`** | 🔴 (prod) | Pendiente antes del deploy; Portafolio lee `maxItems`. |

## 2. Forma de errores

| # | Punto | Prioridad | Detalle |
|---|---|---|---|
| 2.1 | **`reason` vs `code`** | 🟡 | Producción y auth responden `{ statusCode, code, message }`; portafolio, portadas, media, secciones y usuarios responden `new ConflictException({ reason })`, cuyo cuerpo es **solo** `{ reason }` (sin `statusCode` ni `message`). El front acepta ambos (`ApiError.code = code ?? reason`), pero conviene migrar todo a `code` con el cuerpo completo. |
| 2.2 | **`POST /users/invitations` sin código** | 🟡 | Dominio no permitido (400 `Email domain is not allowed`), rol inexistente (400 `Role not found`) y correo repetido (409 `A user with this email already exists`) no traen `code`. El front los distingue por estado y texto del mensaje (frágil). Sugerencia: `EMAIL_DOMAIN_NOT_ALLOWED`, `ROLE_NOT_FOUND`, `USER_EMAIL_EXISTS`. |

## 3. Endpoints existentes — ajustes

| # | Endpoint | Prioridad | Qué falta |
|---|---|---|---|
| 3.1 | `GET /projects` (`ProjectListItemDto`) | 🟡 | Agregar `subtitle`, `description`, `updatedAt`. El front los trata como opcionales (sin ellos muestra menos y ordena por `createdAt`). |
| 3.2 | `GET /projects` | 🟢 | Sin búsqueda ni paginación; el front filtra y pagina en cliente. Si crece: `?q=&page=&pageSize=`. |
| 3.3 | **Reemplazar portada** | 🟡 | `POST /projects/:id/portfolio/cover` responde 409 `COVER_ALREADY_EXISTS` mientras haya portada. Para "Cambiar portada" el front borra la actual (`DELETE /media/:id`) y luego sube la nueva: si la subida falla (p. ej. CORS 1.1), el título se queda sin portada. Sugerencia: permitir crear la nueva mientras exista la anterior y que `cover/confirm` haga el cambio y borre la vieja en la misma transacción. |
| 3.4 | Tamaño exacto de portada | 🟢 | El API exige exactamente 1200 × 1600 (`COVER_INVALID_DIMENSIONS`). El front recorta al centro a ese tamaño antes de subir. Si cambia, actualizar `PORTFOLIO_COVER_SIZE` en `contracts/portfolio.ts`. |
| 3.5 | `PUT /projects/:id/publication` | 🟡 | Limpiar un texto opcional o `compareAtPrice`: `PublicationFieldsDto` no admite `null`. El front envía `""`. (Tienda sigue en mock.) |
| 3.6 | Reordenar portafolio | 🟢 | Un `PUT displayOrder` por título cambiado. Si se vuelve lento: `PUT /portfolios/order { projectIds }`. |
| 3.7 | `GET /productions` | 🟢 | Arreglo plano sin `id`, `clickupListId` ni `createdAt` (el front usa `source` para el indicador Manual/ClickUp y carga el detalle al abrir). Agregar `clickupListId` permitiría buscar por lista sin abrir cada producción. |

## 4. Colaboradores

| # | Punto | Prioridad | Detalle |
|---|---|---|---|
| 4.1 | `PUT /users/:id/permissions` | 🟡 | No existe. El front muestra "Editar permisos" deshabilitado ("Próximamente"). Contrato propuesto en `contracts/users.ts` y mock en `server/mock/handlers/collaborators.ts` (protecciones: nadie se quita `users` a sí mismo ni al último activo que lo tenga). |
| 4.2 | Reenviar invitación | 🟡 | No existe. Propuesta: `POST /users/:id/invitation/resend` (renueva expiración; 409 si no está INVITED). Deshabilitado en el front. |
| 4.3 | **Invitación cancelada sin salida** | 🟡 | Cancelar una invitación = `PATCH status INACTIVE`. Esa persona nunca entró, así que reactivarla da 409 `USER_NOT_LINKED`, reinvitarla da 409 (el correo existe) y no hay reenvío: queda bloqueada para siempre. Hace falta reinvitar a un usuario INACTIVE sin `firebaseUid` (o que 4.2 lo cubra). |
| 4.4 | `roleId` opcional | 🟢 | `InviteUserDto.roleId` es opcional; el panel lo exige (decisión de producto). Decidir si el API también lo exige. |
| 4.5 | Cambio de permisos propios | 🟢 | Con 4.1: el access token conserva los permisos anteriores hasta 15 min. Considerar incrementar `tokenVersion`. |

## 5. Endpoints que aún no existen (el front los usa solo en mock)

- `GET /dashboard/summary` (Resumen): conteos por módulo, actividad semanal (8 semanas) y "Necesita tu atención". Fuera de demo el panel muestra "Próximamente" y entra a Proyectos.
- Tienda completa en `real` (`GET /publications` ya existe; falta migrar el front: `GET /projects/:id/media?scope=PUBLICATION` cambió a `{ scope, items }` + `GET /projects/:id/publication/cover`).

## 6. Resuelto (2026-10-20)

- `CreateProjectDto` acepta `production: {}`: el front crea proyecto y relaciones en una sola llamada.
- `DELETE /media/:id` desvincula `coverMediaId` de portafolio y publicación.
- Media: `GET /projects/:id/portfolio/cover` → `{ cover }` y `GET /projects/:id/media?scope=` → `{ scope, items }` (sin portada; cualquier otro query param → 400).
- `GET /portfolios?status=published|unpublished` con `counts` que ignoran el filtro.
- Producción: `GET /production-phases`, `PUT { authorName?, clickupListId?, bookType?, status?, currentPhaseCode?, currentStageDueDate?, estimatedEndDate? }` (lista solo dígitos; `null` desvincula y conserva los datos; vincular valida y sincroniza), `POST /projects/:id/production/sync`, `publicCode` `XXXX-XXXX` generado por el API, fechas de calendario `yyyy-mm-dd`.
- Modo manual: `source` `MANUAL`/`CLICKUP` en detalle y listado; estados `NOT_STARTED | IN_PRODUCTION | FINISHED`. Los campos manuales solo se aceptan sin lista vinculada (409 `PRODUCTION_MANAGED_BY_CLICKUP`); el front aplica las mismas reglas de estado/fase que `manual-state.ts` (PUBLISHED ⇔ FINISHED, NOT_STARTED sin fase) y siempre manda estado y fase juntos; 400 `PRODUCTION_PHASE_NOT_FOUND` / `PRODUCTION_INCONSISTENT_STATE` tienen mensaje propio. Vincular y editar a mano en la misma llamada lo rechaza el API, así que el panel manda la vinculación sola (tras confirmar).
- Usuarios: `GET /users`, `/roles`, `/permissions` (cualquier sesión), `POST /users/invitations`, `PATCH /users/:id/status`.
