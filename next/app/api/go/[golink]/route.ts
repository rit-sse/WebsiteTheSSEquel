import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to /api/go/[golink]
 *
 * used to get the redirect URL for a golink
 * @param request ...
 * @param golink the title of the golink
 * @returns the new URL in plain text
 */
export async function GET(
  request: Request,
  { params: { golink } }: { params: { golink: string } }
) {
  const redirect = await prisma.goLinks.findFirst({
    where: {
      golink,
      //isPublic: true,
    },
  });
  if (redirect == null) {
    return new Response(`Invalid golink ${golink}`);
  }
  return new Response(redirect.url);
}
