import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const ProjectContent: CollectionConfig = {
  slug: "project-content",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "projectId", "updatedAt"],
    group: "Content",
    description: "Rich-text content pages linked to individual projects.",
  },
  access: {
    read: () => true,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "projectId",
      type: "number",
      required: true,
      unique: true,
      min: 1,
      admin: {
        description:
          "Prisma Project ID that this rich content is attached to.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
  ],
};
