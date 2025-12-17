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

// merge tailwind classes
export const cn = (...classes: ((string | undefined | false | null) | (string | undefined | false | null)[])[]) => {
  return classes
    .flatMap((c) => (Array.isArray(c) ? c : [c]))
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
};

export const MENTOR_HEAD_TITLE = "Mentor Head";
export const PROJECTS_HEAD_TITLE = "Projects Head";
