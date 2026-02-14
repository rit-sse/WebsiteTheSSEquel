import type { GlobalConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

export const HomepageGlobal: GlobalConfig = {
  slug: "homepage-content",
  label: "Homepage",
  admin: {
    group: "Page Content",
    description:
      "Controls the hero section, callout banners, and social links on the homepage.",
  },
  access: {
    read: () => true,
    update: isOfficer,
  },
  fields: [
    // ── Hero section ───────────────────────────────────────────────
    {
      name: "description",
      type: "textarea",
      required: true,
      admin: {
        description:
          "The main tagline shown in the hero section below the SSE logo.",
      },
    },

    // ── Callout banners ────────────────────────────────────────────
    {
      name: "labHoursCallout",
      label: "Lab Hours Callout",
      type: "text",
      required: true,
      admin: {
        description:
          'Mentoring-hours banner text, e.g. "Mentoring hours: Monday–Friday 10 AM – 6 PM".',
      },
    },
    {
      name: "weeklyMeetingCallout",
      label: "Weekly Meeting Callout",
      type: "text",
      required: true,
      admin: {
        description:
          'Weekly meeting banner text, e.g. "Come to our weekly meetings on Wednesday at 3 PM in GOL-1670!".',
      },
    },

    // ── Social links ───────────────────────────────────────────────
    {
      name: "discordLink",
      label: "Discord Invite Link",
      type: "text",
      required: true,
      admin: {
        description: "Full Discord invite URL shown on the homepage.",
      },
    },
    {
      name: "instagramLink",
      label: "Instagram Link",
      type: "text",
      admin: { description: "Instagram profile URL." },
    },
    {
      name: "tiktokLink",
      label: "TikTok Link",
      type: "text",
      admin: { description: "TikTok profile URL." },
    },
    {
      name: "twitchLink",
      label: "Twitch Link",
      type: "text",
      admin: { description: "Twitch channel URL." },
    },
  ],
};
