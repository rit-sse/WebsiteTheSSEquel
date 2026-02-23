import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
