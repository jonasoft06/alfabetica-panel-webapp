import "server-only";
import type { CreateCoverRequest } from "@/contracts/media";
import type { PortfolioDetail, PortfolioListItem, PortfolioListResponse, UpsertPortfolioRequest } from "@/contracts/portfolio";
import { db, nowIso, type PortfolioRecord } from "../db";
import { requirePermission, requireUser } from "../guards";
import { badRequest, conflict, json, notFound } from "../http";
import { findActiveProject, touchProject } from "../lookups";
import { mediaById } from "../mappers";
import type { MockRouter } from "../router";
import { confirmMediaRecord, createPendingMedia } from "./shared/media-records";

function toPortfolioDetail(p: PortfolioRecord): PortfolioDetail {
  const { projectId: _projectId, ...rest } = p;
  void _projectId;
  return rest;
}

function findPortfolio(projectId: string) {
  const portfolio = db().portfolios.find((p) => p.projectId === projectId);
  if (!portfolio) throw notFound("Portfolio not found");
  return portfolio;
}

function publishedCount() {
  const activeIds = new Set(
    db()
      .projects.filter((p) => !p.deletedAt)
      .map((p) => p.id),
  );
  return db().portfolios.filter((p) => p.isPublished && activeIds.has(p.projectId)).length;
}

function touch(portfolio: PortfolioRecord) {
  portfolio.updatedAt = nowIso();
  touchProject(portfolio.projectId);
}

/** Mirrors portfolio.controller.ts (+ the proposed GET /portfolios). */
export function registerPortfolio(router: MockRouter) {
  // TODO(api): proposed endpoint — list of every portfolio with cover, gallery count and the site limit.
  router.get("portfolios", (req) => {
    requireUser(req);
    const store = db();
    const items: PortfolioListItem[] = [];
    for (const portfolio of store.portfolios) {
      const project = store.projects.find((p) => p.id === portfolio.projectId && !p.deletedAt);
      if (!project) continue;
      items.push({
        id: portfolio.id,
        projectId: project.id,
        title: project.title,
        subtitle: project.subtitle,
        slug: portfolio.slug,
        isPublished: portfolio.isPublished,
        displayOrder: portfolio.displayOrder,
        publishedAt: portfolio.publishedAt,
        cover: mediaById(portfolio.coverMediaId),
        galleryCount: store.media.filter(
          (m) => m.projectId === project.id && m.scope === "PORTFOLIO" && m.status === "CONFIRMED" && m.type === "IMAGE" && m.displayOrder !== null,
        ).length,
        updatedAt: portfolio.updatedAt > project.updatedAt ? portfolio.updatedAt : project.updatedAt,
      });
    }
    const body: PortfolioListResponse = {
      items,
      counts: {
        total: items.length,
        published: items.filter((i) => i.isPublished).length,
        unpublished: items.filter((i) => !i.isPublished).length,
        withoutCover: items.filter((i) => !i.cover).length,
      },
      maxItems: store.settings.portfolioMaxItems,
    };
    return json(body);
  });

  router.get("projects/:id/portfolio", (req) => {
    requireUser(req);
    const project = findActiveProject(req.params.id);
    return json(toPortfolioDetail(findPortfolio(project.id)));
  });

  router.put("projects/:id/portfolio", (req) => {
    requirePermission(req, "portfolio");
    const project = findActiveProject(req.params.id);
    const portfolio = findPortfolio(project.id);
    const body = (req.body ?? {}) as UpsertPortfolioRequest;
    if (body.displayOrder !== undefined) {
      if (!Number.isInteger(body.displayOrder) || body.displayOrder < 1)
        throw badRequest(["displayOrder must not be less than 1", "displayOrder must be an integer number"]);
      portfolio.displayOrder = body.displayOrder;
    }
    touch(portfolio);
    return json(toPortfolioDetail(portfolio));
  });

  router.post("projects/:id/portfolio/cover", (req) => {
    requirePermission(req, "portfolio");
    const project = findActiveProject(req.params.id);
    findPortfolio(project.id);
    const body = (req.body ?? {}) as CreateCoverRequest;
    if (!Number.isInteger(body.width) || body.width <= 0 || !Number.isInteger(body.height) || body.height <= 0)
      throw badRequest(["width and height must be positive integers"]);
    const result = createPendingMedia({
      projectId: project.id,
      scope: "PORTFOLIO",
      type: "IMAGE",
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      width: body.width,
      height: body.height,
      alt: body.alt,
      caption: body.caption,
      displayOrder: null, // covers are not part of the gallery
    });
    return json(result, { status: 201 });
  });

  router.patch("projects/:id/portfolio/cover/confirm", (req) => {
    requirePermission(req, "portfolio");
    const project = findActiveProject(req.params.id);
    const portfolio = findPortfolio(project.id);
    const { mediaId } = (req.body ?? {}) as { mediaId?: string };
    if (typeof mediaId !== "string" || !mediaId) throw badRequest(["mediaId must be a string"]);
    const store = db();
    const media = store.media.find((m) => m.id === mediaId && m.projectId === project.id && m.scope === "PORTFOLIO");
    if (!media) throw notFound("Media not found");
    confirmMediaRecord(media.id);
    // The replaced cover is no longer referenced: drop its record and bytes.
    const previous = portfolio.coverMediaId;
    if (previous && previous !== media.id) {
      store.media = store.media.filter((m) => m.id !== previous);
      store.files.delete(previous);
    }
    portfolio.coverMediaId = media.id;
    touch(portfolio);
    return json(toPortfolioDetail(portfolio));
  });

  router.post("projects/:id/portfolio/publish", (req) => {
    requirePermission(req, "portfolio");
    const project = findActiveProject(req.params.id);
    const portfolio = findPortfolio(project.id);
    if (portfolio.isPublished) return json(toPortfolioDetail(portfolio));
    const maxItems = db().settings.portfolioMaxItems;
    const currentCount = publishedCount();
    if (currentCount >= maxItems) {
      throw conflict(`The home page already shows ${maxItems} published titles`, { code: "PORTFOLIO_LIMIT_REACHED", maxItems, currentCount });
    }
    const orders = db()
      .portfolios.filter((p) => p.isPublished && p.displayOrder !== null)
      .map((p) => p.displayOrder as number);
    portfolio.isPublished = true;
    portfolio.publishedAt = nowIso();
    portfolio.displayOrder = portfolio.displayOrder ?? (orders.length ? Math.max(...orders) + 1 : 1);
    touch(portfolio);
    return json(toPortfolioDetail(portfolio));
  });

  router.post("projects/:id/portfolio/unpublish", (req) => {
    requirePermission(req, "portfolio");
    const project = findActiveProject(req.params.id);
    const portfolio = findPortfolio(project.id);
    portfolio.isPublished = false;
    portfolio.publishedAt = null;
    touch(portfolio);
    return json(toPortfolioDetail(portfolio));
  });
}
