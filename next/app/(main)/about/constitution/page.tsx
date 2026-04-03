import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { ConstitutionWorkbench } from "./ConstitutionWorkbench";

export default async function Constitution({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const authLevel = await getAuthLevel();
  const document = await getCurrentConstitutionDocument();
  const { draft } = await searchParams;
  const draftId = Number(draft);

  const initialDraft =
    authLevel.userId && draftId && !Number.isNaN(draftId)
      ? await prisma.constitutionProposal.findFirst({
          where: {
            id: draftId,
            authorId: authLevel.userId,
            status: {
              in: ["DRAFT", "PRIMARY_REVIEW"],
            },
          },
          select: {
            id: true,
            title: true,
            summary: true,
            rationale: true,
            sectionHeadingPath: true,
            proposedSectionMarkdown: true,
            status: true,
          },
        })
      : null;

  return (
    <section className="space-y-6">
      <div className="text-page-structure space-y-6">
        <ConstitutionWorkbench
          renderedHtml={document.html}
          baseMarkdown={document.markdown}
          baseSha={document.sha}
          flatSections={document.flatSections}
          auth={{
            isUser: authLevel.isUser,
            isMember: authLevel.isMember,
            isOfficer: authLevel.isOfficer,
          }}
          initialDraft={
            initialDraft
              ? {
                  id: initialDraft.id,
                  title: initialDraft.title,
                  summary: initialDraft.summary,
                  rationale: initialDraft.rationale,
                  sectionHeadingPath: initialDraft.sectionHeadingPath,
                  proposedSectionMarkdown:
                    initialDraft.proposedSectionMarkdown,
                  computedStatus: initialDraft.status,
                }
              : null
          }
        />
      </div>
    </section>
  );
}
