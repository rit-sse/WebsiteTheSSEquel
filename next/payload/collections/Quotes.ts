import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const Quotes: CollectionConfig = {
  slug: "quotes",
  admin: {
    useAsTitle: "quote",
    group: "Community",
    description: "Fun quotes from the SSE community, shown on the website.",
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    { name: "quote", type: "text", required: true, maxLength: 255 },
    { name: "author", type: "text", defaultValue: "Anonymous" },
    { name: "dateAdded", type: "date", required: true },
    { name: "userId", type: "number", required: true, min: 1 },
  ],
};
