import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Uploads",
    description: "Images and PDFs used across the site. Upload here to reference from any page.",
  },
  upload: {
    disableLocalStorage: true,
    adminThumbnail: "thumbnail",
    imageSizes: [
      {
        name: "thumbnail",
        width: 320,
        height: 240,
        position: "center",
      },
    ],
    mimeTypes: ["image/*", "application/pdf"],
  },
  access: {
    read: () => true,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
    },
  ],
};
