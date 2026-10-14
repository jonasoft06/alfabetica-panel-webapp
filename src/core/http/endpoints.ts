/**
 * Single source of truth for panel-api routes (relative to the BFF prefix `/api`).
 * Paths match the NestJS controllers 1:1. Proposed routes are flagged with `// TODO(api)`.
 */
const enc = encodeURIComponent;

export const endpoints = {
  auth: {
    login: () => "/auth/login",
    refresh: () => "/auth/refresh",
    logout: () => "/auth/logout",
  },
  users: {
    me: () => "/users/me",
    list: () => "/users", // TODO(api)
    invite: () => "/users/invitations", // TODO(api)
    permissions: (id: string) => `/users/${enc(id)}/permissions`, // TODO(api)
    status: (id: string) => `/users/${enc(id)}/status`, // TODO(api)
    roles: () => "/roles", // TODO(api)
    permissionCatalog: () => "/permissions", // TODO(api)
  },
  projects: {
    list: () => "/projects",
    detail: (id: string) => `/projects/${enc(id)}`,
    media: (id: string) => `/projects/${enc(id)}/media`, // GET is TODO(api); POST exists
  },
  portfolio: {
    list: () => "/portfolios", // TODO(api)
    root: (projectId: string) => `/projects/${enc(projectId)}/portfolio`,
    cover: (projectId: string) => `/projects/${enc(projectId)}/portfolio/cover`,
    coverConfirm: (projectId: string) => `/projects/${enc(projectId)}/portfolio/cover/confirm`,
    publish: (projectId: string) => `/projects/${enc(projectId)}/portfolio/publish`,
    unpublish: (projectId: string) => `/projects/${enc(projectId)}/portfolio/unpublish`,
  },
  publication: {
    list: () => "/publications", // TODO(api)
    root: (projectId: string) => `/projects/${enc(projectId)}/publication`,
    cover: (projectId: string) => `/projects/${enc(projectId)}/publication/cover`,
    coverConfirm: (projectId: string) => `/projects/${enc(projectId)}/publication/cover/confirm`,
    sections: (projectId: string) => `/projects/${enc(projectId)}/publication/sections`,
    sectionsOrder: (projectId: string) => `/projects/${enc(projectId)}/publication/sections/order`,
    section: (projectId: string, sectionId: string) => `/projects/${enc(projectId)}/publication/sections/${enc(sectionId)}`,
    sectionPdf: (projectId: string, sectionId: string) => `/projects/${enc(projectId)}/publication/sections/${enc(sectionId)}/pdf`,
    sectionPdfConfirm: (projectId: string, sectionId: string) => `/projects/${enc(projectId)}/publication/sections/${enc(sectionId)}/pdf/confirm`,
  },
  media: {
    confirm: (mediaId: string) => `/media/${enc(mediaId)}/confirm`,
    remove: (mediaId: string) => `/media/${enc(mediaId)}`,
  },
  production: {
    list: () => "/productions", // TODO(api)
    stages: () => "/production-stages", // TODO(api)
    sync: () => "/productions/sync", // TODO(api)
    root: (projectId: string) => `/projects/${enc(projectId)}/production`, // TODO(api)
  },
  dashboard: {
    summary: () => "/dashboard/summary", // TODO(api)
  },
} as const;
