import "server-only";
import type { PermissionKey } from "@/contracts/auth";
import type { MediaScope, MediaStatus, MediaType } from "@/contracts/media";
import type { BookType, ProductionStatus } from "@/contracts/production";
import type { PublicationType } from "@/contracts/publication";
import type { UserStatus } from "@/contracts/users";
import { seed } from "./data/seed";

/* Records mirror the Prisma models of panel-api (prisma/*.prisma). Dates are ISO strings. */

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  /** Mock-only: key used by the simulated Google sign-in. */
  mockProfile: string | null;
  status: UserStatus;
  roleId: string | null;
  permissions: PermissionKey[];
  lastLogin: string | null;
  invitedAt: string | null;
  invitationExpiresAt: string | null;
  createdAt: string;
}
export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
}
export interface ProjectRecord {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  client: string | null;
  issueYear: number | null;
  tags: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PortfolioRecord {
  id: string;
  projectId: string;
  slug: string;
  coverMediaId: string | null;
  isPublished: boolean;
  displayOrder: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PublicationRecord {
  id: string;
  projectId: string;
  slug: string;
  coverMediaId: string | null;
  type: PublicationType;
  authors: string[];
  editionNumber: string | null;
  format: string | null;
  collection: string | null;
  measures: string | null;
  presentation: string | null;
  audience: string | null;
  language: string | null;
  isbn: string | null;
  sku: string | null;
  price: string | null;
  compareAtPrice: string | null;
  quantity: number | null;
  pages: number | null;
  currency: string | null;
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface SectionRecord {
  id: string;
  publicationId: string;
  label: string;
  description: string | null;
  sortOrder: number;
  pdfMediaId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface MediaRecord {
  id: string;
  projectId: string;
  scope: MediaScope;
  type: MediaType;
  status: MediaStatus;
  originalName: string | null;
  alt: string | null;
  caption: string | null;
  displayOrder: number | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  confirmedAt: string | null;
}
export interface PhaseRecord {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
}
/** Mirrors model Production: ClickUp-derived fields are written only by link/sync. */
export interface ProductionRecord {
  id: string;
  projectId: string;
  publicCode: string;
  authorName: string | null;
  clickupListId: string | null;
  bookType: BookType | null;
  status: ProductionStatus;
  currentPhaseCode: string | null;
  currentStageName: string | null;
  /** "yyyy-mm-dd" */
  currentStageDueDate: string | null;
  /** "yyyy-mm-dd" */
  estimatedEndDate: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface SessionRecord {
  userId: string;
  expiresAt: number;
}

export interface MockDb {
  users: UserRecord[];
  roles: RoleRecord[];
  projects: ProjectRecord[];
  portfolios: PortfolioRecord[];
  publications: PublicationRecord[];
  sections: SectionRecord[];
  media: MediaRecord[];
  phases: PhaseRecord[];
  productions: ProductionRecord[];
  settings: { portfolioMaxItems: number };
  accessTokens: Map<string, SessionRecord>;
  refreshTokens: Map<string, SessionRecord>;
  /** Bytes uploaded through the simulated presigned URLs. */
  files: Map<string, { bytes: ArrayBuffer; contentType: string }>;
}

const globalForDb = globalThis as unknown as { __alfMockDb?: MockDb };

/** In-memory database, kept on globalThis so it survives hot reloads. Resets on server restart. */
export function db(): MockDb {
  globalForDb.__alfMockDb ??= seed();
  return globalForDb.__alfMockDb;
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug unique within a collection, with numeric suffix on collision (same rule as panel-api). */
export function uniqueSlug(title: string, taken: { slug: string }[]): string {
  const base = slugify(title) || "proyecto";
  let slug = base;
  for (let i = 2; taken.some((t) => t.slug === slug); i++) slug = `${base}-${i}`;
  return slug;
}
