import { Card } from "@/components/ui/card";
import { NeoCard } from "@/components/ui/neo-card";
import SponsorshipTiers from "./SponsorshipTiers";
import BecomeSponsorForm from "./BecomeSponsorForm";
import RecruitingTalkForm from "./RecruitingTalkForm";
import ViseTalkForm from "./ViseTalkForm";

export default function SponsorsPage() {
  return (
    <div className="space-y-8 w-full max-w-[94vw] xl:max-w-[1400px] mx-auto px-4">
      {/* Hero Section */}
      <NeoCard className="w-full p-6 md:p-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Partner With SSE
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            The Society of Software Engineers (SSE) is the core developer community at RIT. 
            Our lab in GOL-1670 is where students work, study, build projects, and help each other. 
            Members gain real experience, mentor younger students, and collaborate on software that actually ships. 
            The environment builds strong engineers who are ready for internships and full-time roles.
          </p>
          <p className="text-lg text-muted-foreground">
            Partnering with SSE gives sponsors visibility and direct access to some of the most capable 
            young engineers on campus.
          </p>
        </div>
      </NeoCard>

      {/* Sponsorship Tiers */}
      <Card className="w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold font-display mb-8 text-center">
          Sponsorship Options
        </h2>
        <SponsorshipTiers />
      </Card>

      {/* Call to Action Section */}
      <Card className="w-full p-6 md:p-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            Ready to Partner?
          </h2>
          <p className="text-muted-foreground mb-8">
            Whether you&apos;re interested in sponsoring SSE, scheduling a
            recruiting talk, or proposing a ViSE talk, we&apos;d love to hear
            from you. Fill out one of the forms below and our team will get
            back to you shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <BecomeSponsorForm />
            <RecruitingTalkForm />
            <ViseTalkForm />
          </div>
        </div>
      </Card>

      {/* Recruiting Talks Section */}
      <Card className="w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold font-display mb-6">
          Recruiting Talks
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">What We Offer</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Tech talks in our lab space (GOL-1670)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>On-campus interview sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Technical workshops and hands-on sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Company info sessions and Q&A</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Why SSE?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Direct access to motivated CS/SE students</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Students with real project experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Engaged audience ready for opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Flexible scheduling to fit your needs</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Voices in Software Engineering (ViSE) Section */}
      <Card className="w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold font-display mb-2">
          Voices in Software Engineering (ViSE)
        </h2>
        <p className="text-muted-foreground mb-6">
          Our speaker series brings industry professionals, alumni, researchers,
          and independent engineers into the SSE community to share their
          stories, work, and insights. If you have something to say, we want
          to hear it.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Who We&apos;re Looking For</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Engineers talking about work they&apos;re proud of</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Researchers sharing current projects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Alumni reflecting on career paths</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Independent voices with a technical story to tell</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">What to Expect</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>A curious, engaged audience of CS/SE students</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>In-person (GOL-1670), virtual, or hybrid formats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Typical talks run 30–60 minutes with Q&amp;A</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>No sales pitches &mdash; ViSE is about ideas, not recruiting</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Contact Section */}
      <Card className="w-full p-6 md:p-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            Questions?
          </h2>
          <p className="text-muted-foreground mb-4">
            Have questions about sponsorship or recruiting opportunities? 
            Reach out to us directly.
          </p>
          <a 
            href="mailto:sse@rit.edu" 
            className="text-primary hover:underline font-medium text-lg"
          >
            sse@rit.edu
          </a>
        </div>
      </Card>
    </div>
  );
}
