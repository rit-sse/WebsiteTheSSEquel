import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "title",
    group: "Content",
    description: "SSE projects displayed on the projects page.",
  },
  access: {
    read: () => true,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) {
          return data;
        }

        if (typeof data.title === "string" && (!data.slug || data.slug === "")) {
          return {
            ...data,
            slug: slugify(data.title),
          };
        }

        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "description", type: "textarea", required: true },
    { name: "progress", type: "text" },
    { name: "repoLink", type: "text" },
    { name: "contentURL", type: "text" },
    {
      name: "projectImage",
      type: "upload",
      relationTo: "media",
    },
    { name: "completed", type: "checkbox", defaultValue: false },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "lead",
      type: "number",
      min: 1,
    },
  ],
};
