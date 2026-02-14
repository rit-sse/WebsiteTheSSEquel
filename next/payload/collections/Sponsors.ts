import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const Sponsors: CollectionConfig = {
  slug: "sponsors",
  admin: {
    useAsTitle: "name",
    group: "Community",
    description: "Company sponsors shown on the homepage. Toggle 'Active' to show/hide.",
  },
  access: {
    read: () => true,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
    },
    { name: "websiteUrl", type: "text", required: true },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
