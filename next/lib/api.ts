export type NoId<T> = {
  [P in keyof T as Exclude<P, "id">]: T[P];
};

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

export type Api<T> = {
  create: (item: NoId<T>) => Promise<Response>;
  fetch: () => Promise<T[]>;
  update: (item: T) => Promise<Response>;
  delete: (id: number) => Promise<Response>;
};

function routeFactory<T>(route: string): Api<T> {
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

export const skillsApi: Api<Skill> = routeFactory("skills");

export const goLinksApi: Api<GoLink> = {
  ...routeFactory("golinks"),
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
