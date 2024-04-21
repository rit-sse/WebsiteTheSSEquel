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
export type ApiWrapper<T> = {
  create: (item: NoId<T>) => Promise<Response>;
  fetch: () => Promise<T[]>;
  update: (item: NonExhaustive<T>) => Promise<Response>;
  delete: (id: number) => Promise<Response>;
};

function apiWrapperFactory<T>(route: string): ApiWrapper<T> {
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

export const goLinksApi: ApiWrapper<GoLink> = {
  ...apiWrapperFactory("golinks"),
  fetch: async () =>
    fetch("/api/golinks/public").then((response) => response.json()),
};

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
