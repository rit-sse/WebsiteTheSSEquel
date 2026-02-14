import type { GlobalConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const AboutPageGlobal: GlobalConfig = {
  slug: "about-page",
  label: "About Page",
  admin: {
    group: "Page Content",
    description:
      'Controls the intro paragraph and content cards on the "/about" page.',
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
          "Shown below the page title. Summarises what the SSE is about.",
      },
    },
    {
      name: "slots",
      label: "Content Cards",
      type: "array",
      admin: {
        description:
          "Each card has an image, a heading, and a description. They display in a zig-zag layout on the page.",
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
              'Path to a static image in /public/images/, e.g. "/images/locked-in.jpg". Only used when no file is uploaded above.',
          },
        },
        {
          name: "name",
          label: "Heading",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
          required: true,
        },
        {
          name: "alt",
          label: "Image Alt Text",
          type: "text",
          admin: {
            description:
              "Accessibility text describing the image. Falls back to the heading if empty.",
          },
        },
      ],
    },
  ],
};
