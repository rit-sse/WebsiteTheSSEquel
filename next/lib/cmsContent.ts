import { getPayloadClient } from "@/lib/payload";
import { lexicalToPlainText } from "@/lib/payloadCms";
import HomepageContent, { UpcomingEvents } from "@/app/HomepageContent";
import AboutUsSlotContent from "@/app/(main)/about/AboutUsSlotContent";
import CommitteeSlotData from "@/app/(main)/about/committees/CommitteeSlotData";
import InvolvementSlotData from "@/app/(main)/about/get-involved/InvolvementSlotData";

type UploadLike =
  | string
  | null
  | undefined
  | {
      url?: string | null;
      filename?: string | null;
    };

export type AboutSlotData = {
  imageSrc: string;
  name: string;
  description: string;
  alt: string;
};

export type CMSCommitteeSlotData = {
  imageSrc: string;
  name: string;
  description: string;
};

export type InvolvementSlotData = {
  imageSrc: string;
  title: string;
  body: string;
};

function resolveUploadURL(upload: UploadLike, fallback?: string): string {
  if (typeof upload === "string" && upload.length > 0) {
    return upload;
  }

  if (upload && typeof upload === "object") {
    if (upload.url) {
      return upload.url;
    }
    if (upload.filename) {
      return `/api/payload/media/file/${upload.filename}`;
    }
  }

  return fallback ?? "/images/SSEProjectPlaceholder.png";
}

export async function getHomepageContent() {
  const payload = await getPayloadClient();
  const global = await payload.findGlobal({
    slug: "homepage-content",
    depth: 1,
  });

  const upcomingEvents =
    global.upcomingEvents?.map((event: Record<string, unknown>) => ({
      title: String(event.title || ""),
      date: String(event.date || ""),
      location: String(event.location || ""),
      description: String(event.description || ""),
      image: resolveUploadURL(event.image as UploadLike),
    })) ?? [];

  return {
    description: String(global.description || HomepageContent.description),
    labHoursCallout: String(
      global.labHoursCallout || HomepageContent.labHoursCallout
    ),
    weeklyMeetingCallout: String(
      global.weeklyMeetingCallout || HomepageContent.weeklyMeetingCallout
    ),
    discordLink: String(global.discordLink || HomepageContent.discordLink),
    instagramLink: String(global.instagramLink || HomepageContent.instagramLink),
    tiktokLink: String(global.tiktokLink || HomepageContent.tiktokLink),
    twitchLink: String(global.twitchLink || HomepageContent.twitchLink),
    upcomingEvents: upcomingEvents.length > 0 ? upcomingEvents : UpcomingEvents,
  };
}

export async function getAboutSlots(): Promise<{
  introText: string;
  slots: AboutSlotData[];
}> {
  const payload = await getPayloadClient();
  const global = await payload.findGlobal({
    slug: "about-page",
    depth: 1,
  });

  const introText =
    typeof (global as Record<string, unknown>).introText === "string"
      ? String((global as Record<string, unknown>).introText)
      : "The Society of Software Engineers at RIT fosters a vibrant community of tech enthusiasts, bridging academia with industry partnerships from giants like Microsoft to Apple, ensuring our members thrive in their future careers.";

  const slots =
    global.slots?.map((slot: Record<string, unknown>) => ({
      imageSrc: resolveUploadURL(
        slot.image as UploadLike,
        typeof slot.imageSrc === "string" ? slot.imageSrc : undefined
      ),
      name: String(slot.name || ""),
      description:
        typeof slot.description === "string"
          ? slot.description
          : lexicalToPlainText(slot.description),
      alt: String(slot.alt || slot.name || "About image"),
    })) ?? [];

  return {
    introText,
    slots: slots.length > 0 ? slots : AboutUsSlotContent,
  };
}

export async function getCommitteeSlots(): Promise<{
  introText: string;
  committees: CMSCommitteeSlotData[];
}> {
  const payload = await getPayloadClient();
  const global = await payload.findGlobal({
    slug: "committees-page",
    depth: 1,
  });

  const introText =
    typeof (global as Record<string, unknown>).introText === "string"
      ? String((global as Record<string, unknown>).introText)
      : "The Society of Software Engineers delegates responsibility for tasks with committees. These committees play pivotal roles in organizing events, facilitating projects, providing platforms for knowledge exchange, and more. Together we create opportunities for members to connect, collaborate, and learn from one another.";

  const committees =
    global.committees?.map((committee: Record<string, unknown>) => ({
      imageSrc: resolveUploadURL(
        committee.image as UploadLike,
        typeof committee.imageSrc === "string"
          ? committee.imageSrc
          : undefined
      ),
      name: String(committee.name || ""),
      description:
        typeof committee.description === "string"
          ? committee.description
          : lexicalToPlainText(committee.description),
    })) ?? [];

  return {
    introText,
    committees: committees.length > 0 ? committees : CommitteeSlotData,
  };
}

export async function getInvolvementSlots(): Promise<{
  introText: string;
  slots: InvolvementSlotData[];
}> {
  const payload = await getPayloadClient();
  const global = await payload.findGlobal({
    slug: "get-involved-page",
    depth: 1,
  });

  const introText =
    typeof (global as Record<string, unknown>).introText === "string"
      ? String((global as Record<string, unknown>).introText)
      : "Are you ready to make an impact? Dive in the heart of the SSE and become part of a vibrant community dedicated to innovation and collaboration. Whether you are passionate about coding, organizing events, or fostering connections, there is a place for you here. Join us in shaping the future of the SSE as we work together to create meaningful opportunities for growth, learning, and impact. Let's build something incredible together.";

  const slots =
    global.slots?.map((slot: Record<string, unknown>) => ({
      imageSrc: resolveUploadURL(
        slot.image as UploadLike,
        typeof slot.imageSrc === "string" ? slot.imageSrc : undefined
      ),
      title: String(slot.title || ""),
      body:
        typeof slot.body === "string"
          ? slot.body
          : lexicalToPlainText(slot.body),
    })) ?? [];

  return {
    introText,
    slots: slots.length > 0 ? slots : InvolvementSlotData,
  };
}
