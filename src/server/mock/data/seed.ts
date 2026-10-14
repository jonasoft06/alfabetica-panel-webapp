import "server-only";
import type { PermissionKey } from "@/contracts/auth";
import type { PublicationType } from "@/contracts/publication";
import type { MediaRecord, MockDb, PortfolioRecord, ProductionRecord, ProjectRecord, PublicationRecord, SectionRecord, StageRecord, UserRecord } from "../db";
import { slugify } from "../db";

const DAY = 24 * 3600 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const id = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const ALL: PermissionKey[] = ["users", "projects", "portfolio", "production", "publication", "settings"];

const ROLES = [
  { id: id("00000001", 1), name: "Admin", description: "Acceso completo al panel" },
  { id: id("00000001", 2), name: "Editorial", description: "Contenido y tienda" },
  { id: id("00000001", 3), name: "Diseño", description: "Proyectos y portafolio" },
  { id: id("00000001", 4), name: "Ventas", description: "Tienda" },
];

const USERS: Omit<UserRecord, "createdAt">[] = [
  {
    id: id("00000002", 1),
    name: "Jona Martínez",
    email: "jona@alfabetica.com.mx",
    mockProfile: "admin",
    status: "ACTIVE",
    roleId: ROLES[0].id,
    permissions: ALL,
    lastLogin: ago(0.01),
    invitedAt: ago(60),
    invitationExpiresAt: null,
  },
  {
    id: id("00000002", 2),
    name: "Sofía Ramírez",
    email: "sofia.ramirez@alfabetica.com.mx",
    mockProfile: "editorial",
    status: "ACTIVE",
    roleId: ROLES[1].id,
    permissions: ["projects", "publication"],
    lastLogin: ago(2),
    invitedAt: ago(30),
    invitationExpiresAt: null,
  },
  {
    id: id("00000002", 3),
    name: "Carlos Mendoza",
    email: "carlos.mendoza@alfabetica.com.mx",
    mockProfile: null,
    status: "ACTIVE",
    roleId: ROLES[2].id,
    permissions: ["projects", "portfolio"],
    lastLogin: ago(1),
    invitedAt: ago(40),
    invitationExpiresAt: null,
  },
  {
    id: id("00000002", 4),
    name: "Ana Torres",
    email: "ana.torres@alfabetica.com.mx",
    mockProfile: null,
    status: "ACTIVE",
    roleId: ROLES[3].id,
    permissions: ["publication"],
    lastLogin: ago(3),
    invitedAt: ago(20),
    invitationExpiresAt: null,
  },
  {
    id: id("00000002", 5),
    name: "Luis Herrera",
    email: "luis.herrera@alfabetica.com.mx",
    mockProfile: "readonly",
    status: "ACTIVE",
    roleId: null,
    permissions: [],
    lastLogin: ago(6),
    invitedAt: ago(15),
    invitationExpiresAt: null,
  },
  {
    id: id("00000002", 6),
    name: null,
    email: "mariana.ruiz@alfabetica.com.mx",
    mockProfile: null,
    status: "INVITED",
    roleId: ROLES[1].id,
    permissions: ["projects"],
    lastLogin: null,
    invitedAt: ago(2),
    invitationExpiresAt: ahead(5),
  },
];

const STAGES: StageRecord[] = [
  ["manuscript", "Manuscrito", "Recibimos y revisamos el texto original.", ["por recibir", "manuscrito"]],
  ["editing", "Edición", "Corrección de estilo y revisión editorial.", ["edición", "corrección de estilo"]],
  ["layout", "Diseño y maquetación", "Diseño de portada e interiores.", ["diseño", "maquetación"]],
  ["proofs", "Pruebas", "Revisión de pruebas finales con el autor.", ["pruebas", "revisión final"]],
  ["printing", "Imprenta", "El título está en producción en imprenta.", ["imprenta", "impresión"]],
  ["delivered", "Entregado", "Ejemplares entregados al cliente.", ["entregado", "complete"]],
].map(([key, clientLabel, clientDescription, match], i) => ({
  id: id("00000003", i + 1),
  key: key as string,
  clientLabel: clientLabel as string,
  clientDescription: clientDescription as string,
  sortOrder: i + 1,
  clickupStatusMatch: match as string[],
}));

interface ProjectSeed {
  title: string;
  subtitle: string;
  description: string;
  client: string | null;
  year: number;
  tags: string[];
  updatedDaysAgo: number;
  portfolio?: { published: boolean; order?: number; cover: boolean; gallery?: number };
  publication?: { type: PublicationType; published: boolean; price?: number; quantity?: number; url?: string; sections?: number; cover: boolean };
  production?: { code: string; clickup: string | null; stage: number };
}

const PROJECTS: ProjectSeed[] = [
  {
    title: "Lengua y Comunicación 3",
    subtitle: "Serie secundaria · 3.º grado",
    description: "Libro de texto con cuadernillo de actividades y guía para el docente.",
    client: "SEP Jalisco",
    year: 2026,
    tags: ["Secundaria", "Lengua"],
    updatedDaysAgo: 2,
    portfolio: { published: true, order: 1, cover: true, gallery: 4 },
    publication: { type: "SALE", published: true, price: 420, quantity: 120, sections: 6, cover: true },
    production: { code: "ALF-LC3-2026", clickup: "86a1kx9", stage: 3 },
  },
  {
    title: "Manual de Ortografía Avanzada",
    subtitle: "Colección docente",
    description: "Reglas, ejercicios y evaluaciones para formación continua de maestros.",
    client: null,
    year: 2025,
    tags: ["Docentes", "Ortografía"],
    updatedDaysAgo: 3,
    portfolio: { published: true, order: 2, cover: true, gallery: 2 },
    production: { code: "ALF-ORT-2025", clickup: null, stage: 5 },
  },
  {
    title: "Antología de Cuentos Breves",
    subtitle: "Lectura complementaria",
    description: "Selección de 24 relatos de autores mexicanos contemporáneos.",
    client: "Fondo Editorial Tlaquepaque",
    year: 2026,
    tags: ["Lectura", "Cuento"],
    updatedDaysAgo: 5,
    portfolio: { published: true, order: 3, cover: true, gallery: 3 },
    publication: { type: "LINK", published: true, url: "https://www.amazon.com.mx/", cover: true },
  },
  {
    title: "Guía del Docente — Matemáticas",
    subtitle: "Serie primaria · 4.º a 6.º",
    description: "Planeaciones, rúbricas y soluciones para el bloque de aritmética.",
    client: "Colegio Cervantes",
    year: 2025,
    tags: ["Primaria", "Matemáticas"],
    updatedDaysAgo: 8,
    publication: { type: "SALE", published: false, price: 285, quantity: 40, sections: 4, cover: false },
    production: { code: "ALF-GDM-2025", clickup: "86a0zzq", stage: 6 },
  },
  {
    title: "Cuadernillo de Comprensión Lectora",
    subtitle: "Material fotocopiable",
    description: "Fichas de trabajo por nivel con textos informativos y narrativos.",
    client: null,
    year: 2026,
    tags: ["Lectura"],
    updatedDaysAgo: 9,
    portfolio: { published: false, cover: false },
    production: { code: "ALF-CCL-2026", clickup: null, stage: 2 },
  },
  {
    title: "Historia de México — Vol. II",
    subtitle: "Serie secundaria · 2.º grado",
    description: "Del porfiriato al México contemporáneo, con línea del tiempo desplegable y fichas de trabajo por bloque.",
    client: "SEP Jalisco",
    year: 2026,
    tags: ["Secundaria", "Historia", "Serie"],
    updatedDaysAgo: 14,
    portfolio: { published: true, order: 4, cover: true, gallery: 5 },
    publication: { type: "SALE", published: true, price: 385, quantity: 48, sections: 15, cover: true },
    production: { code: "ALF-HM2-2026", clickup: "86a1m4t", stage: 4 },
  },
  {
    title: "Matemáticas Aplicadas I",
    subtitle: "Bachillerato · primer semestre",
    description: "Borrador del primer módulo con problemas contextualizados.",
    client: "Preparatoria Regional",
    year: 2026,
    tags: ["Bachillerato"],
    updatedDaysAgo: 21,
  },
  {
    title: "Ciencias Naturales 5",
    subtitle: "Serie primaria · 5.º grado",
    description: "Experimentos guiados y fichas de observación para el aula.",
    client: "SEP Jalisco",
    year: 2025,
    tags: ["Primaria", "Ciencias"],
    updatedDaysAgo: 24,
    portfolio: { published: true, order: 5, cover: true, gallery: 2 },
  },
  {
    title: "Atlas de Geografía de Jalisco",
    subtitle: "Edición ilustrada",
    description: "Mapas temáticos, regiones naturales y datos actualizados del estado.",
    client: "Gobierno de Jalisco",
    year: 2024,
    tags: ["Geografía", "Atlas"],
    updatedDaysAgo: 30,
    portfolio: { published: true, order: 6, cover: true, gallery: 6 },
    publication: { type: "LINK", published: true, url: "https://alfabetica.com.mx/atlas", cover: true },
  },
  {
    title: "Formación Cívica y Ética 1",
    subtitle: "Serie secundaria · 1.er grado",
    description: "Proyectos comunitarios y dilemas éticos para la convivencia escolar.",
    client: null,
    year: 2026,
    tags: ["Secundaria", "Civismo"],
    updatedDaysAgo: 34,
    portfolio: { published: false, cover: true, gallery: 1 },
  },
  {
    title: "Inglés Comunicativo A2",
    subtitle: "Cuaderno de práctica",
    description: "Actividades de comprensión auditiva con audios descargables.",
    client: "Instituto Bilingüe Occidente",
    year: 2025,
    tags: ["Inglés"],
    updatedDaysAgo: 40,
    publication: { type: "DOI", published: false, sections: 3, cover: true },
  },
  {
    title: "Revista Académica Alfabética No. 4",
    subtitle: "Publicación arbitrada",
    description: "Artículos de investigación educativa con identificador DOI por capítulo.",
    client: null,
    year: 2026,
    tags: ["Investigación", "Revista"],
    updatedDaysAgo: 45,
    portfolio: { published: true, order: 7, cover: true, gallery: 1 },
    publication: { type: "DOI", published: true, sections: 8, cover: true },
  },
  {
    title: "Cuaderno de Caligrafía",
    subtitle: "Preescolar y primaria baja",
    description: "Trazos guiados, letra script y cursiva con ejercicios de motricidad.",
    client: "Colegio Cervantes",
    year: 2024,
    tags: ["Preescolar"],
    updatedDaysAgo: 52,
    portfolio: { published: true, order: 8, cover: true, gallery: 2 },
  },
  {
    title: "Química en tu Entorno",
    subtitle: "Bachillerato · tercer semestre",
    description: "Prácticas de laboratorio con materiales cotidianos.",
    client: "Preparatoria Regional",
    year: 2026,
    tags: ["Bachillerato", "Química"],
    updatedDaysAgo: 60,
    portfolio: { published: false, cover: false },
    production: { code: "ALF-QTE-2026", clickup: "86a2b7c", stage: 1 },
  },
];

const SECTION_LABELS = [
  "Bloque 1",
  "Bloque 2",
  "Bloque 3",
  "Bloque 4",
  "Bloque 5",
  "Bloque 6",
  "Bloque 7",
  "Bloque 8",
  "Bloque 9",
  "Bloque 10",
  "Bloque 11",
  "Bloque 12",
  "Bloque 13",
  "Bloque 14",
  "Bloque 15",
];

export function seed(): MockDb {
  const users: UserRecord[] = USERS.map((u) => ({ ...u, createdAt: u.invitedAt ?? ago(90) }));
  const projects: ProjectRecord[] = [];
  const portfolios: PortfolioRecord[] = [];
  const publications: PublicationRecord[] = [];
  const sections: SectionRecord[] = [];
  const media: MediaRecord[] = [];
  const productions: ProductionRecord[] = [];

  const addImage = (projectId: string, scope: MediaRecord["scope"], displayOrder: number | null, title: string, created: string) => {
    const record: MediaRecord = {
      id: crypto.randomUUID(),
      projectId,
      scope,
      type: "IMAGE",
      status: "CONFIRMED",
      originalName: `${slugify(title)}.webp`,
      alt: title,
      caption: null,
      displayOrder,
      mimeType: "image/webp",
      sizeBytes: 180_000 + Math.round(Math.random() * 220_000),
      width: 1200,
      height: 1600,
      createdAt: created,
      confirmedAt: created,
    };
    media.push(record);
    return record.id;
  };

  PROJECTS.forEach((p, index) => {
    const projectId = id("00000004", index + 1);
    const updatedAt = ago(p.updatedDaysAgo);
    const createdAt = ago(p.updatedDaysAgo + 20 + index * 3);
    const slug = slugify(p.title);
    projects.push({
      id: projectId,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      client: p.client,
      issueYear: p.year,
      tags: p.tags,
      deletedAt: null,
      createdAt,
      updatedAt,
    });

    if (p.portfolio) {
      const coverMediaId = p.portfolio.cover ? addImage(projectId, "PORTFOLIO", null, p.title, createdAt) : null;
      for (let g = 1; g <= (p.portfolio.gallery ?? 0); g++) addImage(projectId, "PORTFOLIO", g, `${p.title} · interior ${g}`, createdAt);
      portfolios.push({
        id: crypto.randomUUID(),
        projectId,
        slug,
        coverMediaId,
        isPublished: p.portfolio.published,
        displayOrder: p.portfolio.order ?? null,
        publishedAt: p.portfolio.published ? updatedAt : null,
        createdAt,
        updatedAt,
      });
    }

    if (p.publication) {
      const pub = p.publication;
      const publicationId = crypto.randomUUID();
      const coverMediaId = pub.cover ? addImage(projectId, "PUBLICATION", null, p.title, createdAt) : null;
      publications.push({
        id: publicationId,
        projectId,
        slug,
        coverMediaId,
        type: pub.type,
        authors: ["Equipo editorial Alfabética"],
        editionNumber: "1.ª",
        format: pub.type === "DOI" ? "Digital" : "Impreso",
        collection: p.subtitle.split(" · ")[0],
        measures: pub.type === "DOI" ? null : "21 × 27 cm",
        presentation: pub.type === "DOI" ? null : "Rústica",
        audience: p.tags[0] ?? null,
        language: "Español",
        isbn: pub.type === "SALE" ? `978-607-${String(1000 + index)}-${String(10 + index)}-${index % 10}` : null,
        sku: pub.type === "SALE" ? `ALF-${String(index + 1).padStart(3, "0")}` : null,
        price: pub.type === "SALE" ? (pub.price ?? 0).toFixed(2) : null,
        compareAtPrice: null,
        quantity: pub.type === "SALE" ? (pub.quantity ?? 0) : null,
        pages: 96 + index * 8,
        currency: "MXN",
        externalUrl: pub.type === "LINK" ? (pub.url ?? null) : null,
        isPublished: pub.published,
        publishedAt: pub.published ? updatedAt : null,
        createdAt,
        updatedAt,
      });
      for (let s = 1; s <= (pub.sections ?? 0); s++) {
        sections.push({
          id: crypto.randomUUID(),
          publicationId,
          label: pub.type === "DOI" ? `Capítulo ${s}` : SECTION_LABELS[s - 1],
          description: s % 3 === 0 ? null : "Contenidos, actividades y evaluación del bloque.",
          sortOrder: s,
          pdfMediaId: null,
          createdAt,
          updatedAt,
        });
      }
    }

    if (p.production) {
      productions.push({
        id: crypto.randomUUID(),
        projectId,
        publicCode: p.production.code,
        clickupListId: p.production.clickup,
        startDate: createdAt.slice(0, 10),
        estimatedTotalDays: 90,
        currentStageId: STAGES[p.production.stage - 1].id,
        estimatedEndDate: ahead(10 + index * 4),
        lastSyncedAt: p.production.clickup ? ago(0.1) : null,
        createdAt,
        updatedAt,
      });
    }
  });

  return {
    users,
    roles: ROLES,
    projects,
    portfolios,
    publications,
    sections,
    media,
    stages: STAGES,
    productions,
    settings: { portfolioMaxItems: 10, lastClickupSyncAt: ago(0.1) },
    accessTokens: new Map(),
    refreshTokens: new Map(),
    files: new Map(),
  };
}
