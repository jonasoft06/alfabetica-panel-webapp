/**
 * In-memory access token holder.
 * The access token is never persisted (no localStorage, no readable cookie): a page
 * reload recovers it through POST /auth/refresh using the httpOnly refresh cookie.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};
