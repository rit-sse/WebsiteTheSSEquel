const GITHUB_REPO_URL = "https://github.com/rit-sse/WebsiteTheSSEquel";
const DISCORD_INVITE_URL = "https://www.discord.gg/rNC6wj82kq";

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type AssignmentEmailOptions = {
  applicantName: string;
  finalDivision: string;
  baseUrl: string;
};

function wrapEmailContent(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #426E8C, #5289AF); color: white; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Society of Software Engineers</h1>
      </div>
      <div style="padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin-top: 0; color: #1f2937;">${title}</h2>
        ${body}
      </div>
    </div>
  `;
}

export function buildTechCommitteeRejectionEmail(
  applicantName: string
): EmailTemplate {
  const body = `
    <p>Hi ${applicantName},</p>
    <p>Thank you for applying to join Tech Committee.</p>
    <p>After reviewing your application, we are not moving forward with it at this time.</p>
    <p>We appreciate your interest in contributing to SSE and encourage you to apply again in the future.</p>
  `;

  return {
    subject: "Update on your Tech Committee application",
    html: wrapEmailContent("Tech Committee Application Update", body),
    text: `Hi ${applicantName},\n\nThank you for applying to join Tech Committee.\n\nAfter reviewing your application, we are not moving forward with it at this time.\n\nWe appreciate your interest in contributing to SSE and encourage you to apply again in the future.`,
  };
}

export function buildTechCommitteeAssignmentEmail({
  applicantName,
  finalDivision,
  baseUrl,
}: AssignmentEmailOptions): EmailTemplate {
  const committeesUrl = `${baseUrl}/about/committees`;
  const settingsUrl = `${baseUrl}/settings`;

  const divisionSection =
    finalDivision === "Lab Division"
      ? {
          html: `
            <h3 style="margin-bottom: 8px; color: #1f2937;">Lab Division Next Steps</h3>
            <ol style="padding-left: 20px; line-height: 1.7; color: #374151;">
              <li>Report to the Lab Division Manager for your first onboarding conversation.</li>
              <li>Set up your server account and confirm you can access the systems you need.</li>
              <li>Complete training on lab duties, server responsibilities, and any operational procedures.</li>
            </ol>
          `,
          text: "Lab Division Next Steps:\n1. Report to the Lab Division Manager for your first onboarding conversation.\n2. Set up your server account and confirm you can access the systems you need.\n3. Complete training on lab duties, server responsibilities, and any operational procedures.",
        }
      : finalDivision === "Web Division"
        ? {
            html: `
              <h3 style="margin-bottom: 8px; color: #1f2937;">Web Division Next Steps</h3>
              <ol style="padding-left: 20px; line-height: 1.7; color: #374151;">
                <li>Watch for follow-up from Tech leadership about current website work and where to start.</li>
                <li>Make sure your GitHub access is in order so you can clone the repo and contribute.</li>
                <li>Review the onboarding guide and get your local development setup working.</li>
              </ol>
            `,
            text: "Web Division Next Steps:\n1. Watch for follow-up from Tech leadership about current website work and where to start.\n2. Make sure your GitHub access is in order so you can clone the repo and contribute.\n3. Review the onboarding guide and get your local development setup working.",
          }
        : {
            html: `
              <h3 style="margin-bottom: 8px; color: #1f2937;">Services Division Next Steps</h3>
              <ol style="padding-left: 20px; line-height: 1.7; color: #374151;">
                <li>Watch for follow-up from Tech leadership about the services currently owned by the division.</li>
                <li>Confirm what systems and tools you will be working with first.</li>
                <li>Review the relevant documentation and onboarding notes before your first task.</li>
              </ol>
            `,
            text: "Services Division Next Steps:\n1. Watch for follow-up from Tech leadership about the services currently owned by the division.\n2. Confirm what systems and tools you will be working with first.\n3. Review the relevant documentation and onboarding notes before your first task.",
          };

  const body = `
    <p>Hi ${applicantName},</p>
    <p>Your Tech Committee application has been accepted, and you have been assigned to <strong>${finalDivision}</strong>.</p>
    <p>We are excited to have you join Tech Committee. This email covers what you should do next and where to find the most important information.</p>

    ${divisionSection.html}

    <h3 style="margin-bottom: 8px; color: #1f2937;">Where To Find Things</h3>
    <ul style="padding-left: 20px; line-height: 1.7; color: #374151;">
      <li><strong>Discord:</strong> Join the SSE Discord if you are not already in it: <a href="${DISCORD_INVITE_URL}">${DISCORD_INVITE_URL}</a></li>
      <li><strong>Committee overview:</strong> Read about Tech Committee here: <a href="${committeesUrl}">${committeesUrl}</a></li>
      <li><strong>Repository:</strong> The main website repo is here: <a href="${GITHUB_REPO_URL}">${GITHUB_REPO_URL}</a></li>
      <li><strong>Profile/settings:</strong> Keep your profile current so officers can reach you if needed: <a href="${settingsUrl}">${settingsUrl}</a></li>
    </ul>

    <h3 style="margin-bottom: 8px; color: #1f2937;">What You Should Do Now</h3>
    <ol style="padding-left: 20px; line-height: 1.7; color: #374151;">
      <li>Make sure you are in the SSE Discord and can receive messages from Tech leadership.</li>
      <li>Confirm you have access to the tools relevant to your division. If something is missing, reach out immediately.</li>
      <li>Watch for follow-up instructions from Tech leadership about your first tasks, meeting expectations, and onboarding details.</li>
    </ol>

    <p>If you are blocked on access, unsure what to do next, or have not heard from anyone after a reasonable amount of time, reach out to Tech leadership so we can unblock you quickly.</p>
    <p>Welcome aboard.</p>
  `;

  return {
    subject: `Welcome to Tech Committee - ${finalDivision}`,
    html: wrapEmailContent("Tech Committee Assignment", body),
    text: `Hi ${applicantName},\n\nYour Tech Committee application has been accepted, and you have been assigned to ${finalDivision}.\n\nWe are excited to have you join Tech Committee. This email covers what you should do next and where to find the most important information.\n\n${divisionSection.text}\n\nWhere To Find Things:\n- Discord: ${DISCORD_INVITE_URL}\n- Committee overview: ${committeesUrl}\n- Repository: ${GITHUB_REPO_URL}\n- Profile/settings: ${settingsUrl}\n\nWhat You Should Do Now:\n1. Make sure you are in the SSE Discord and can receive messages from Tech leadership.\n2. Confirm you have access to the tools relevant to your division. If something is missing, reach out immediately.\n3. Watch for follow-up instructions from Tech leadership about your first tasks, meeting expectations, and onboarding details.\n\nIf you are blocked on access, unsure what to do next, or have not heard from anyone after a reasonable amount of time, reach out to Tech leadership so we can unblock you quickly.\n\nWelcome aboard.`,
  };
}
