import "server-only";
import { registerAuth } from "./handlers/auth";
import { registerCollaborators } from "./handlers/collaborators";
import { registerDashboard } from "./handlers/dashboard";
import { registerFiles } from "./handlers/files";
import { registerMedia } from "./handlers/media";
import { registerPortfolio } from "./handlers/portfolio";
import { registerProduction } from "./handlers/production";
import { registerProductionRelation } from "./handlers/production-relation";
import { registerProjects } from "./handlers/projects";
import { registerPublication } from "./handlers/publication";
import { registerUsers } from "./handlers/users";
import { MockRouter } from "./router";

/**
 * Simulated panel-api. Each module registers the same routes as the NestJS controllers.
 * Only used for modules whose API_MODE_<MODULE> is `mock`.
 */
export const mockApi = new MockRouter();

registerAuth(mockApi);
registerUsers(mockApi);
registerCollaborators(mockApi);
registerProjects(mockApi);
registerPortfolio(mockApi);
registerPublication(mockApi);
registerProductionRelation(mockApi);
registerProduction(mockApi);
registerMedia(mockApi);
registerFiles(mockApi);
registerDashboard(mockApi);
