import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
    group: "Content",
    description: "SSE events that show up on the events calendar and homepage.",
  },
  access: {
    read: () => true,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "date", type: "date", required: true },
    { name: "location", type: "text" },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    { name: "description", type: "textarea", required: true },
    { name: "attendanceEnabled", type: "checkbox", defaultValue: false },
    { name: "grantsMembership", type: "checkbox", defaultValue: false },
  ],
};
