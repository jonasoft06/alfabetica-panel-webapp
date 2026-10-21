/**
 * Single source of truth for panel-api routes (relative to the BFF prefix `/api`).
 * Paths match the NestJS controllers 1:1. Routes the API does not have yet are flagged with `// TODO(api)`
 * (served only by the mock server; see docs/API_NOTES.md).
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
    list: () => "/users",
    invite: () => "/users/invitations",
    permissions: (id: string) => `/users/${enc(id)}/permissions`, // TODO(api)
    status: (id: string) => `/users/${enc(id)}/status`,
    roles: () => "/roles",
    permissionCatalog: () => "/permissions",
  },
  projects: {
    list: () => "/projects",
    detail: (id: string) => `/projects/${enc(id)}`,
    media: (id: string) => `/projects/${enc(id)}/media`,
  },
  portfolio: {
    list: () => "/portfolios",
    root: (projectId: string) => `/projects/${enc(projectId)}/portfolio`,
    cover: (projectId: string) => `/projects/${enc(projectId)}/portfolio/cover`,
    coverConfirm: (projectId: string) => `/projects/${enc(projectId)}/portfolio/cover/confirm`,
    publish: (projectId: string) => `/projects/${enc(projectId)}/portfolio/publish`,
    unpublish: (projectId: string) => `/projects/${enc(projectId)}/portfolio/unpublish`,
  },
  publication: {
    list: () => "/publications",
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
    list: () => "/productions",
    phases: () => "/production-phases",
    root: (projectId: string) => `/projects/${enc(projectId)}/production`,
    sync: (projectId: string) => `/projects/${enc(projectId)}/production/sync`,
  },
  dashboard: {
    summary: () => "/dashboard/summary", // TODO(api)
  },
} as const;
