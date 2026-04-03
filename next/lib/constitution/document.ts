import { renderMarkdownToHtml } from "@/lib/posts";
import { getConstitutionRawUrl } from "@/lib/constitution/config";
import { getConstitutionGithubContents } from "@/lib/constitution/github";
import { parseConstitutionSections } from "@/lib/constitution/sections";
import type { ConstitutionDocumentSnapshot } from "@/lib/constitution/types";

export async function getCurrentConstitutionDocument(): Promise<ConstitutionDocumentSnapshot> {
  const githubContents = await getConstitutionGithubContents();
  const markdown =
    githubContents.markdown ||
    (await fetch(getConstitutionRawUrl(), { cache: "no-store" }).then((response) =>
      response.text()
    ));
  const html = await renderMarkdownToHtml(markdown);
  const { headings, flatSections } = parseConstitutionSections(markdown);

  return {
    markdown,
    html,
    sha: githubContents.sha,
    headings,
    flatSections,
  };
}
