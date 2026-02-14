import type { GlobalConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const GetInvolvedGlobal: GlobalConfig = {
  slug: "get-involved-page",
  label: "Get Involved Page",
  admin: {
    group: "Page Content",
    description:
      'Controls the intro paragraph and activity cards on the "/about/get-involved" page.',
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
          "Shown below the page title. Motivates visitors to get involved with the SSE.",
      },
    },
    {
      name: "slots",
      label: "Activity Cards",
      type: "array",
      admin: {
        description:
          "Each card highlights one way to get involved. Drag to reorder.",
      },
      fields: [
        {
          name: "image",
          label: "Card Image",
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
              'Path to a static image in /public/images/, e.g. "/images/gen-meeting.jpg". Only used when no file is uploaded above.',
          },
        },
        {
          name: "title",
          label: "Card Title",
          type: "text",
          required: true,
        },
        {
          name: "body",
          label: "Card Body",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
};
