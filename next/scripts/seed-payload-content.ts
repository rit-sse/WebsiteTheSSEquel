import fs from "fs/promises";
import path from "path";

import { defaultRichTextValue } from "@payloadcms/richtext-lexical";
import { getPayload } from "payload";

import HomepageContent, { UpcomingEvents } from "../app/HomepageContent";
import AboutUsSlotContent from "../app/(main)/about/AboutUsSlotContent";
import CommitteeSlotData from "../app/(main)/about/committees/CommitteeSlotData";
import InvolvementSlotData from "../app/(main)/about/get-involved/InvolvementSlotData";
import prisma from "../lib/prisma";
import configPromise from "../payload.config";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function upsertMedia({
  payload,
  imageSrc,
  alt,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>;
  imageSrc: string;
  alt: string;
}) {
  if (!imageSrc || !imageSrc.startsWith("/images/")) {
    return null;
  }

  const filePath = path.join(process.cwd(), "public", imageSrc.replace(/^\/+/, ""));

  if (!(await fileExists(filePath))) {
    return null;
  }

  const filename = path.basename(filePath);
  const existing = await payload.find({
    collection: "media",
    where: {
      filename: { equals: filename },
    },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs[0]) {
    return existing.docs[0].id;
  }

  const created = await payload.create({
    collection: "media",
    data: { alt },
    filePath,
    overrideAccess: true,
  });

  return created.id;
}

async function main() {
  const payload = await getPayload({ config: configPromise });

  console.log("Seeding Payload globals...");

  const homepageUpcomingEvents = await Promise.all(
    UpcomingEvents.map(async (event) => {
      const mediaId = await upsertMedia({
        payload,
        imageSrc: `/images/${event.image}`,
        alt: event.title,
      });

      return {
        title: event.title,
        date: event.date,
        location: event.location,
        description: event.description,
        image: mediaId,
      };
    })
  );

  await payload.updateGlobal({
    slug: "homepage-content",
    data: {
      ...HomepageContent,
      upcomingEvents: homepageUpcomingEvents,
    },
    overrideAccess: true,
  });

  const aboutSlots = await Promise.all(
    AboutUsSlotContent.map(async (slot) => ({
      image: await upsertMedia({
        payload,
        imageSrc: slot.imageSrc,
        alt: slot.alt,
      }),
      imageSrc: slot.imageSrc,
      name: slot.name,
      description: slot.description,
      alt: slot.alt,
    }))
  );

  await payload.updateGlobal({
    slug: "about-page",
    data: { slots: aboutSlots },
    overrideAccess: true,
  });

  const committees = await Promise.all(
    CommitteeSlotData.map(async (committee) => ({
      image: await upsertMedia({
        payload,
        imageSrc: committee.imageSrc,
        alt: committee.name,
      }),
      imageSrc: committee.imageSrc,
      name: committee.name,
      description: committee.description,
    }))
  );

  await payload.updateGlobal({
    slug: "committees-page",
    data: { committees },
    overrideAccess: true,
  });

  const involvementSlots = await Promise.all(
    InvolvementSlotData.map(async (slot) => ({
      image: await upsertMedia({
        payload,
        imageSrc: slot.imageSrc,
        alt: slot.title,
      }),
      imageSrc: slot.imageSrc,
      title: slot.title,
      body: slot.body,
    }))
  );

  await payload.updateGlobal({
    slug: "get-involved-page",
    data: { slots: involvementSlots },
    overrideAccess: true,
  });

  console.log("Seeding project content placeholders...");

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  for (const project of projects) {
    const existing = await payload.find({
      collection: "project-content",
      where: {
        projectId: {
          equals: project.id,
        },
      },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.docs.length > 0) {
      continue;
    }

    const slug = slugify(project.title || `project-${project.id}`);

    await payload.create({
      collection: "project-content",
      data: {
        title: project.title,
        slug,
        projectId: project.id,
        content: {
          ...defaultRichTextValue,
        },
      },
      overrideAccess: true,
    });
  }

  console.log("Payload content seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
