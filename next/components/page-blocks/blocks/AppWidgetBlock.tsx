import { Card } from "@/components/ui/card";
import AlumniPage from "@/app/(main)/about/alumni/page";
import CreditsPage from "@/app/(main)/about/credits/page";
import ConstitutionPage from "@/app/(main)/about/constitution/page";
import LeadershipPage from "@/app/(main)/about/leadership/page";
import PrimaryOfficersPolicyPage from "@/app/(main)/about/primary-officers-policy/page";
import EventsArchivePage from "@/app/(main)/events/page";
import EventsCalendarPage from "@/app/(main)/events/calendar/page";
import MembershipsPage from "@/app/(main)/memberships/page";
import MentorSchedulePage from "@/app/(main)/mentoring/schedule/page";
import PhotosPage from "@/app/(main)/photos/page";
import ProjectsPage from "@/app/(main)/projects/page";
import BecomeSponsorForm from "@/app/(main)/sponsors/BecomeSponsorForm";
import RecruitingTalkForm from "@/app/(main)/sponsors/RecruitingTalkForm";
import SponsorshipTiers from "@/app/(main)/sponsors/SponsorshipTiers";
import ViseTalkForm from "@/app/(main)/sponsors/ViseTalkForm";
import type { BlockRenderProps } from "../types";

export async function AppWidgetBlock({
  props,
}: BlockRenderProps<"appWidget">) {
  const widget = await renderWidget(props.widget);
  const hasIntro = Boolean(props.heading || props.body);
  const body = (
    <>
      {hasIntro && (
        <div className="mx-auto mb-6 max-w-3xl text-center">
          {props.heading && (
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {props.heading}
            </h2>
          )}
          {props.body && (
            <p className="mt-2 whitespace-pre-line text-muted-foreground">
              {props.body}
            </p>
          )}
        </div>
      )}
      {widget}
    </>
  );

  if (props.frame) {
    return (
      <Card depth={1} className="my-8 w-full p-4 md:p-8">
        {body}
      </Card>
    );
  }

  return <section className="my-8 w-full">{body}</section>;
}

async function renderWidget(widget: BlockRenderProps<"appWidget">["props"]["widget"]) {
  switch (widget) {
    case "photosGallery":
      return <PhotosPage />;
    case "eventsArchive":
      return <EventsArchivePage />;
    case "eventsCalendar":
      return <EventsCalendarPage />;
    case "projectsDirectory":
      return <ProjectsPage />;
    case "membershipLeaderboard":
      return <MembershipsPage />;
    case "mentorSchedule":
      return <MentorSchedulePage />;
    case "alumniDirectory":
      return <AlumniPage />;
    case "leadershipDirectory":
      return <LeadershipPage />;
    case "githubCredits":
      return <CreditsPage />;
    case "constitution":
      return <ConstitutionPage />;
    case "primaryOfficersPolicy":
      return <PrimaryOfficersPolicyPage />;
    case "sponsorshipTiers":
      return <SponsorshipTiers />;
    case "sponsorForms":
      return (
        <div className="flex flex-col flex-wrap justify-center gap-4 sm:flex-row">
          <BecomeSponsorForm />
          <RecruitingTalkForm />
          <ViseTalkForm />
        </div>
      );
  }
}
