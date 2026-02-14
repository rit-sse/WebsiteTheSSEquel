import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "status", "updatedAt"],
    group: "Content",
    description: "Standalone CMS pages with rich text content.",
  },
  access: {
    read: ({ req }) => {
      if (req.user) {
        return true;
      }

      return {
        status: {
          equals: "published",
        },
      };
    },
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    { name: "excerpt", type: "textarea" },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "publishedDate",
      type: "date",
      admin: {
        condition: (_, siblingData) => siblingData?.status === "published",
      },
    },
  ],
};
