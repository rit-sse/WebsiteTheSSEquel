import { getPayloadClient } from "@/lib/payload";
import { resolveMediaURL } from "@/lib/payloadCms";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: idParam } = await params;
	const id = parseInt(idParam);

	if (!Number.isFinite(id)) {
		return new Response("id must be an integer", { status: 402 });
	}

  const payload = await getPayloadClient();
  const project = await payload.findByID({
    collection: "projects",
    id,
    depth: 1,
  });

	if (project === null) {
		return new Response(`project of 'id' ${id} doesn't exist`);
	}

	return Response.json(
    {
      id: Number((project as Record<string, any>).id),
      title: (project as Record<string, any>).title ?? "",
      description: (project as Record<string, any>).description ?? "",
      leadid: Number((project as Record<string, any>).lead ?? 0),
      progress: (project as Record<string, any>).progress ?? "",
      repoLink: (project as Record<string, any>).repoLink ?? "",
      contentURL:
        (project as Record<string, any>).contentURL ??
        ((project as Record<string, any>).slug
          ? `/projects/${(project as Record<string, any>).slug}`
          : ""),
      projectImage: resolveMediaURL((project as Record<string, any>).projectImage),
      completed: Boolean((project as Record<string, any>).completed),
      slug: (project as Record<string, any>).slug ?? "",
      content: (project as Record<string, any>).content ?? null,
    },
    { status: 200 }
  );
}
