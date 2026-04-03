import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureGithubUrl(val: string): string {
  if (val.startsWith("https://") || val.startsWith("http://")) return val;
  if (val.includes("github.com")) return `https://${val}`;
  return `https://github.com/${val}`;
}

export function ensureLinkedinUrl(val: string): string {
  if (val.startsWith("https://") || val.startsWith("http://")) return val;
  if (val.includes("linkedin.com")) return `https://${val}`;
  return `https://linkedin.com/in/${val}`;
}

export const isUrlValid = (str: string) => {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i"
  );
  return pattern.test(str);
};

export const MENTOR_HEAD_TITLE = "Mentoring Head";
export const PROJECTS_HEAD_TITLE = "Projects Head";
export const TECH_COMMITTEE_HEAD_TITLE = "Tech Head";
export const PRESIDENT_TITLE = "President";
export const VICE_PRESIDENT_TITLE = "Vice President";
export const TECH_COMMITTEE_DIVISIONS = [
  "Web Division",
  "Lab Division",
  "Services Division",
] as const;
export const TECH_COMMITTEE_DIVISION_OPTIONS = [
  {
    value: TECH_COMMITTEE_DIVISIONS[0],
    description:
      "Builds and maintains the SSE website and related web tooling.",
  },
  {
    value: TECH_COMMITTEE_DIVISIONS[1],
    description:
      "Supports lab systems, devices, and operational technology used in the space.",
  },
  {
    value: TECH_COMMITTEE_DIVISIONS[2],
    description:
      "Owns supporting technical services for the organization and our users.",
  },
] as const;
export const TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE = {
  "Lab Division Manager": TECH_COMMITTEE_DIVISIONS[1],
  "Web Division Manager": TECH_COMMITTEE_DIVISIONS[0],
  "Services Division Manager": TECH_COMMITTEE_DIVISIONS[2],
} as const;
export const TECH_COMMITTEE_DIVISION_MANAGER_TITLES = Object.keys(
  TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE
) as Array<keyof typeof TECH_COMMITTEE_DIVISION_MANAGER_BY_TITLE>;
