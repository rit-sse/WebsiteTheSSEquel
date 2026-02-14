import type { GlobalConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const CommitteesGlobal: GlobalConfig = {
  slug: "committees-page",
  label: "Committees Page",
  admin: {
    group: "Page Content",
    description:
      'Controls the intro paragraph and committee cards on the "/about/committees" page.',
  },
  access: {
    read: () => true,
    update: isOfficer,
  },
  fields: [
    {
      name: "introText",
      label: "Intro Paragraph",
      type: "textarea",
      admin: {
        description:
          "Shown below the page title. Explains how SSE committees work.",
      },
    },
    {
      name: "committees",
      label: "Committee Cards",
      type: "array",
      admin: {
        description:
          "One card per committee. Drag to reorder. Each card shows an image, the committee name, and a description.",
      },
      fields: [
        {
          name: "image",
          label: "Committee Image",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "Upload a photo. If empty, the fallback image path below is used.",
          },
        },
        {
          name: "imageSrc",
          label: "Fallback Image Path",
          type: "text",
          admin: {
            description:
              'Path to a static image in /public/images/, e.g. "/images/events1.jpg". Only used when no file is uploaded above.',
          },
        },
        {
          name: "name",
          label: "Committee Name",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          admin: {
            description:
              "A paragraph describing what this committee does.",
          },
        },
      ],
    },
  ],
};
