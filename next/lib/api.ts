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
    create: (item): Promise<Response> =>
      fetch(process.env.NEXTAUTH_URL + "/api/" + route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      }),
    fetch: async () => {
      const response = await fetch(process.env.NEXTAUTH_URL + "/api/" + route);
      const data = await response.json();
      return data;
    },
    update: (item) =>
      fetch(process.env.NEXTAUTH_URL + "/api/" + route, {
        method: "PUT",
        body: JSON.stringify(item),
      }),
    delete: (id) =>
      fetch(process.env.NEXTAUTH_URL + "/api/" + route, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
  };
}

export const skillsApi: Api<Skill> = routeFactory("skills");

export async function createGolink(golink: NoId<GoLink>): Promise<Response> {
  return await fetch(process.env.NEXTAUTH_URL + "/api/golinks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(golink),
  });
}

export async function fetchGolinks(): Promise<GoLink[]> {
  const response = await fetch(
    process.env.NEXTAUTH_URL + "/api/golinks/public"
  );
  const data = await response.json();
  return data;
}

export async function updateGolink(golink: GoLink): Promise<Response> {
  return await fetch(process.env.NEXTAUTH_URL + `/api/golinks`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(golink),
  });
}

export async function deleteGolink(id: number): Promise<Response> {
  return await fetch(process.env.NEXTAUTH_URL + `/api/golinks`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id,
    }),
  });
}

export type AuthLevel = {
  isUser: boolean;
  isMember: boolean;
  isMentor: boolean;
  isOfficer: boolean;
};

export async function fetchAuthLevel(): Promise<AuthLevel> {
  const response = await fetch(process.env.NEXTAUTH_URL + "/api/authLevel");
  const data = await response.json();
  return data;
}