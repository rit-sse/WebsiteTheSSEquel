import { DateTime } from "next-auth/providers/kakao";

/**
 * Remove the "id" key from an object type
 */
export type NoId<T> = {
  [P in keyof T as Exclude<P, "id">]: T[P];
};

/**
 * Make every key except "id" optional
 */
export type NonExhaustive<T> = {
  [P in keyof T]?: T[P];
} & { id: number };

export type GoLink = {
  id: number;
  golink: string;
  url: string;
  description: string;
  isPinned: boolean;
  isPublic: boolean;
};

export type Skill = {
  id: number;
  skill: string;
};

export type HourBlock = {
  id: number;
  weekday: string;
  startTime: DateTime;
};

export type Mentor = {
  id: number;
  userId: number;
  expirationDate: DateTime;
  isActive: boolean;
};

export type MentorRead = Mentor & {};

export type Schedule = {
  id: number;
  mentorId: number;
  hourBlockId: number;
};

export type ScheduleRead = Schedule & {
  mentor: Mentor;
  hourBlock: HourBlock;
};

export type Officer = {
  is_active: boolean;
  start_date: string;
  end_date: string;
  user: {
    name: string;
    email: string;
  };
  position: {
    is_primary: true;
    title: string;
  };
};

/**
 * A collection of functions to wrap API methods working with a given type
 *
 * create: create a new item
 *
 * fetch: fetch all items
 *
 * update: update an existing item
 *
 * delete: remove an item
 */
export type ApiWrapper<R, W = NoId<R>> = {
  create: (item: W) => Promise<Response>;
  fetch: () => Promise<R[]>;
  update: (item: NonExhaustive<W>) => Promise<Response>;
  delete: (id: number) => Promise<Response>;
};

function apiWrapperFactory<R, W>(route: string): ApiWrapper<R, W> {
  return {
    create: async (item) =>
      fetch("/api/" + route, {
        method: "POST",
        body: JSON.stringify(item),
      }),
    fetch: async () =>
      fetch("/api/" + route).then((response) => response.json()),
    update: async (item) =>
      fetch("/api/" + route, {
        method: "PUT",
        body: JSON.stringify(item),
      }),
    delete: async (id) =>
      fetch("/api/" + route, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
  };
}

export const skillsApi: ApiWrapper<Skill> = apiWrapperFactory("skills");
export const hourBlockApi: ApiWrapper<HourBlock> =
  apiWrapperFactory("hourBlocks");

export const goLinksApi: ApiWrapper<GoLink> = {
  ...apiWrapperFactory("golinks"),
  fetch: async () =>
    fetch("/api/golinks/public").then((response) => response.json()),
};

export const scheduleApi: ApiWrapper<ScheduleRead, Schedule> =
  apiWrapperFactory("schedule");

export const officerApi: ApiWrapper<Officer> = apiWrapperFactory("schedule");

export type AuthLevel = {
  isUser: boolean;
  isMember: boolean;
  isMentor: boolean;
  isOfficer: boolean;
};

export async function fetchAuthLevel(): Promise<AuthLevel> {
  const response = await fetch("/api/authLevel");
  const data = await response.json();
  return data;
}
