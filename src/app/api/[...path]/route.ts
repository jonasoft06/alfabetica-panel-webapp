import { handleBff } from "@/server/bff/handle";

type Context = { params: Promise<{ path: string[] }> };

async function handler(request: Request, { params }: Context) {
  const { path } = await params;
  return handleBff(request, path);
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
