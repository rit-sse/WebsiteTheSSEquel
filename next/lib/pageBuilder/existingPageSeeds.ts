import type { BlockNode, PageContent } from "./blocks";

export interface ExistingCmsPageSeed {
  slug: string;
  title: string;
  navSection:
    | "TOP_LEVEL"
    | "STUDENTS"
    | "ALUMNI"
    | "COMPANIES"
    | "SE_OFFICE"
    | "HIDDEN";
  navOrder: number;
  showInNav: boolean;
  navLabel?: string;
  content: PageContent;
  seoDescription?: string;
}

let nextId = 0;

function block<T extends BlockNode["type"]>(
  type: T,
  props: Extract<BlockNode, { type: T }>["props"],
): Extract<BlockNode, { type: T }> {
  nextId += 1;
  return { id: `existing-page-${nextId}`, type, props } as Extract<
    BlockNode,
    { type: T }
  >;
}

function content(blocks: BlockNode[]): PageContent {
  return { version: 1, blocks };
}

function section(
  label: string,
  props: Partial<Extract<BlockNode, { type: "section" }>["props"]> = {},
): Extract<BlockNode, { type: "section" }> {
  return block("section", {
    label,
    width: "wide",
    depth: "1",
    padding: "normal",
    background: "transparent",
    layout: "stack",
    gap: "normal",
    revealOnScroll: false,
    frame: "card",
    ...props,
  });
}

const aboutRows: Extract<BlockNode, { type: "zCardRow" }>["props"]["items"] = [
  {
    imageSrc: "/images/locked-in.jpg",
    imageAlt: "All-In-One Hub For Developers",
    photoCategorySlug: "general",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "All-In-One Hub For Developers",
    body: "GOL-1670 offers weekday Software Engineering mentoring and tutoring. Experience the SSE Winter Ball, partake in trips and movies, or join our intramural sports. Academics and recreation, seamlessly combined.",
  },
  {
    imageSrc: "/images/tech-committee-1.jpg",
    imageAlt: "Hands-On Experience",
    photoCategorySlug: "projects",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Hands-On Experience",
    body: "In the Projects Committee, SSE members collaborate on unique software projects, from singing tesla coils to multitouch walls. Additionally, our Rapid Development Weekends offer a fast-paced experience, producing everything from games to file transfer systems in just two days.",
  },
];

const involvementRows: Extract<
  BlockNode,
  { type: "zCardRow" }
>["props"]["items"] = [
  {
    imageSrc: "/images/gen-meeting.jpg",
    imageAlt: "Image of Come to General Meeting",
    photoCategorySlug: "events",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Come to General Meeting",
    body: "We have a general meeting every week on Wednesday at 3 PM in the SSE lab (GOL 1670). Come join us to stay up to date with what's happening in the SSE and to meet other members! If you have any questions, feel free to reach out to any of the officers (found on the Leadership page). The lab is open every weekday from 10 AM to 6 PM. Feel free to stop by and hang out, we love meeting new people!",
  },
  {
    imageSrc: "/images/mentoring.jpg",
    imageAlt: "Image of Come in for Mentoring",
    photoCategorySlug: "mentoring",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Come in for Mentoring",
    body: "If you need help with any of your GCCIS or math classes, we have mentors who would love to help! Mentoring is open Monday to Friday from 10AM to 6PM. You can check out the mentoring schedule of the times for each mentor. If you would like to apply to be a mentor, please reach out to our Mentoring Head.",
    ctaText: "Mentor schedule",
    ctaHref: "/mentoring/schedule",
  },
  {
    imageSrc: "/images/jetmon-project.png",
    imageAlt: "Image of Join a Project",
    photoCategorySlug: "projects",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Join a Project",
    body: "Collaboration is a core value of the SSE. We have a variety of projects that you can join (including this website!). Check out our projects page to see what we're working on. Don't see anything you like? Reach out to our projects head to start your own project! An SSE project can be anything with a software component, so get creative!",
    ctaText: "Projects",
    ctaHref: "/projects",
  },
  {
    imageSrc: "/images/fish.jpg",
    imageAlt: "Image of Attend or Give a Talk",
    photoCategorySlug: "events",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Attend or Give a Talk",
    body: "We don't always talk about technical software topics, we often delve into diverse topics, such as the amusing appearances of various aquatic creatures. Our enthusiasm for this particular subject matter has led to the establishment of Funny Fauna Friday, a designated day for engaging in lively conversations about these quirky aquatic beings. If you would like to give a talk of your own please reach out to our Talk Head!",
  },
  {
    imageSrc: "/images/shhhh.jpg",
    imageAlt: "Image of Help Clean the Lab",
    photoCategorySlug: "general",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Help Clean the Lab",
    body: "With all this happening, the lab can get a bit messy. This is a great opportunity to gain membership here by participating in lab cleanup sessions! Check out our calendar for the next lab cleaning, or talk to our Lab Ops Head.",
    ctaText: "Events",
    ctaHref: "/events/calendar",
  },
];

const committeeRows: Extract<
  BlockNode,
  { type: "zCardRow" }
>["props"]["items"] = [
  {
    imageSrc: "/images/events1.jpg",
    imageAlt: "Events",
    photoCategorySlug: "events",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Events",
    body: "The events committee, lead by the Events Head, is in charge of hosting all of the Society's fun events for the semester! Whether we're hanging out in the lab with a movie night, hosting a fun family feud night, or going off campus for laser tag or camping, there's always something fun planned with the SSE!",
  },
  {
    imageSrc: "/images/nat-imagine.png",
    imageAlt: "Talks",
    photoCategorySlug: "events",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Talks",
    body: "The Talks committee, lead by the Head of Talks, is in charge of hosting all of the Society's talks throughout the semester. Students can come in the lab and schedule a time to give a talk about virtually any subject they're passionate about! Want to explain the intricacies of Git? Or the best ways to destress before finals week? Talks committee has you covered!",
  },
  {
    imageSrc: "/images/mtb.jpg",
    imageAlt: "Public Relations",
    photoCategorySlug: "outreach",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Public Relations",
    body: "The Public Relations committee, lead by the Head of Public Relations, maintains the SSE's strong connections with our company partners. We build connections with businesses near and far, and love to invite them back to the lab to talk to our students about anything career-related! We're always looking for new companies to connect with, whether for talks or sponsorship opportunities!",
  },
  {
    imageSrc: "/images/mentoring.jpg",
    imageAlt: "Mentoring",
    photoCategorySlug: "mentoring",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Mentoring",
    body: "The Mentoring committee, lead by the Mentoring Head, ensures that our core function as a tutoring organization is carried out! We offer mentoring for all students Monday to Friday from 10:00AM to 6:00PM. There is also an exam cabinet available for students to study from that the committee maintains an inventory of. In addition, the committee hosts end-of-semester appreciation events to celebrate all the hard work our volunteer mentors do over the semester.",
  },
  {
    imageSrc: "/images/sse-booth.jpg",
    imageAlt: "Marketing",
    photoCategorySlug: "social",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Marketing",
    body: "The Marketing committee, lead by the Head of Marketing, is in charge of keeping track of (and growing) our online presence! This includes getting the word out about our new social medias, making posters for our events and talks, posting any exciting or funny photos from the lab or events that week, and working with other committees to ensure that our members are up-to-date on the great stuff going on at the SSE!",
  },
  {
    imageSrc: "/images/outreach.jpg",
    imageAlt: "Student Outreach",
    photoCategorySlug: "outreach",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Student Outreach",
    body: "The Student Outreach committee is responsible for helping to promote the Society of Software Engineers to all of campus and potential/new students in as many ways possible. This includes volunteering for the SSE student open houses, speaking to students in the SE freshman and co-op seminar classes, and running Orientation events in the fall semester.",
  },
  {
    imageSrc: "/images/tech-committee-1.jpg",
    imageAlt: "Tech Committee",
    photoCategorySlug: "projects",
    photoCount: 6,
    photoIntervalMs: 6000,
    title: "Tech Committee",
    body: "The Tech Committee meets together on Sunday to develop the website for the Society of Software Engineers! This is the website that you are on right now, where we worked as a team to turn it into a reality. We also work on everything tech related in the lab, whether it be the lab computers, the lab TVs, or even just as support for our projects committee!",
  },
];

export const EXISTING_CMS_PAGE_SEEDS: ExistingCmsPageSeed[] = [
  {
    slug: "about",
    title: "About",
    navSection: "TOP_LEVEL",
    navOrder: 100,
    showInNav: true,
    seoDescription:
      "The Society of Software Engineers at RIT fosters a vibrant community of tech enthusiasts, bridging academia with industry partnerships.",
    content: content([
      section("About page", {
        width: "screenXl",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "About Us",
        level: 1,
        align: "center",
        accent: "primary",
      }),
      block("markdown", {
        body: "The Society of Software Engineers at RIT fosters a vibrant community of tech enthusiasts, bridging academia with industry partnerships from giants like Microsoft to Apple, ensuring our members thrive in their future careers.",
        align: "center",
      }),
      block("zCardRow", { items: aboutRows, revealOnScroll: false }),
    ]),
  },
  {
    slug: "photos",
    title: "Photos",
    navSection: "TOP_LEVEL",
    navOrder: 200,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "photosGallery", frame: false }),
    ]),
  },
  {
    slug: "about/get-involved",
    title: "Get Involved",
    navSection: "STUDENTS",
    navOrder: 400,
    showInNav: true,
    content: content([
      section("Get involved page", {
        width: "screenXl",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "Get Involved!",
        level: 1,
        align: "center",
        accent: "primary",
      }),
      block("markdown", {
        body: "Are you ready to make an impact? Dive in the heart of the SSE and become part of a vibrant community dedicated to innovation and collaboration. Whether you are passionate about coding, organizing events, or fostering connections, there is a place for you here. Join us in shaping the future of the SSE as we work together to create meaningful opportunities for growth, learning, and impact. Let's build something incredible together.",
        align: "center",
      }),
      block("zCardRow", { items: involvementRows, revealOnScroll: false }),
      block("cardGrid", {
        heading: "Next steps",
        columns: 2,
        items: [
          {
            title: "Come to our events",
            body: "See what is coming up on the SSE calendar.",
            href: "/events/calendar",
            ctaText: "Events",
            accent: "blue",
          },
          {
            title: "Talk to us",
            body: "Join the SSE Discord and meet the community.",
            href: "https://www.discord.gg/rNC6wj82kq",
            ctaText: "Join our Discord",
            accent: "orange",
          },
        ],
      }),
    ]),
  },
  {
    slug: "projects",
    title: "Projects",
    navSection: "STUDENTS",
    navOrder: 700,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "projectsDirectory", frame: false }),
    ]),
  },
  {
    slug: "events",
    title: "Events",
    navSection: "HIDDEN",
    navOrder: 0,
    showInNav: false,
    content: content([
      block("appWidget", { widget: "eventsArchive", frame: false }),
    ]),
  },
  {
    slug: "events/calendar",
    title: "Events",
    navSection: "STUDENTS",
    navOrder: 800,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "eventsCalendar", frame: false }),
    ]),
  },
  {
    slug: "memberships",
    title: "Membership Leaderboard",
    navSection: "STUDENTS",
    navOrder: 900,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "membershipLeaderboard", frame: false }),
    ]),
  },
  {
    slug: "mentoring/schedule",
    title: "Mentor Schedule",
    navSection: "STUDENTS",
    navOrder: 1000,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "mentorSchedule", frame: false }),
    ]),
  },
  {
    slug: "about/alumni",
    title: "Alumni Directory",
    navSection: "ALUMNI",
    navOrder: 100,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "alumniDirectory", frame: false }),
    ]),
  },
  {
    slug: "about/leadership",
    title: "Leadership",
    navSection: "SE_OFFICE",
    navOrder: 100,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "leadershipDirectory", frame: false }),
    ]),
  },
  {
    slug: "about/committees",
    title: "Committees",
    navSection: "SE_OFFICE",
    navOrder: 200,
    showInNav: true,
    content: content([
      section("Committees page", {
        width: "screenXl",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "Committees",
        level: 1,
        align: "center",
        accent: "primary",
      }),
      block("markdown", {
        body: "The Society of Software Engineers delegates responsibility for tasks with committees. These committees play pivotal roles in organizing events, facilitating projects, providing platforms for knowledge exchange, and more. Together we create opportunities for members to connect, collaborate, and learn from one another.",
        align: "center",
      }),
      block("zCardRow", { items: committeeRows, revealOnScroll: false }),
    ]),
  },
  {
    slug: "about/credits",
    title: "Credits",
    navSection: "HIDDEN",
    navOrder: 0,
    showInNav: false,
    content: content([
      block("appWidget", { widget: "githubCredits", frame: false }),
    ]),
  },
  {
    slug: "about/constitution",
    title: "SSE Constitution",
    navSection: "STUDENTS",
    navOrder: 500,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "constitution", frame: false }),
    ]),
  },
  {
    slug: "about/primary-officers-policy",
    title: "Primary Policy",
    navSection: "STUDENTS",
    navOrder: 600,
    showInNav: true,
    content: content([
      block("appWidget", { widget: "primaryOfficersPolicy", frame: false }),
    ]),
  },
  {
    slug: "sponsors",
    title: "Sponsors",
    navSection: "HIDDEN",
    navOrder: 0,
    showInNav: false,
    content: content([
      // ── Hero ── NeoCard, centered hero copy
      section("Sponsor hero", {
        width: "wide",
        padding: "normal",
        depth: "1",
        frame: "neoCard",
      }),
      block("heading", {
        text: "Partner With SSE",
        level: 1,
        align: "center",
        accent: "none",
      }),
      block("markdown", {
        body: "The Society of Software Engineers (SSE) is the core developer community at RIT. Our lab in GOL-1670 is where students work, study, build projects, and help each other. Members gain real experience, mentor younger students, and collaborate on software that actually ships. The environment builds strong engineers who are ready for internships and full-time roles.\n\nPartnering with SSE gives sponsors visibility and direct access to some of the most capable young engineers on campus.",
        align: "center",
      }),

      // ── Sponsorship Options ── plain Card
      section("Sponsorship options", {
        width: "wide",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "Sponsorship Options",
        level: 2,
        align: "center",
        accent: "none",
      }),
      block("appWidget", {
        widget: "sponsorshipTiers",
        heading: "",
        body: "",
        frame: false,
      }),

      // ── Ready to Partner? ── form CTAs, centered
      section("Ready to partner", {
        width: "wide",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "Ready to Partner?",
        level: 2,
        align: "center",
        accent: "none",
      }),
      block("markdown", {
        body: "Whether you're interested in sponsoring SSE, scheduling a recruiting talk, or proposing a ViSE talk, we'd love to hear from you. Fill out one of the forms below and our team will get back to you shortly.",
        align: "center",
      }),
      block("appWidget", {
        widget: "sponsorForms",
        heading: "",
        body: "",
        frame: false,
      }),

      // ── Recruiting Talks ── 2-column bullet pair
      section("Recruiting talks", {
        width: "wide",
        padding: "normal",
        depth: "1",
      }),
      block("bulletListPair", {
        heading: "Recruiting Talks",
        columns: [
          {
            heading: "What We Offer",
            items: [
              "Tech talks in our lab space (GOL-1670)",
              "On-campus interview sessions",
              "Technical workshops and hands-on sessions",
              "Company info sessions and Q&A",
            ],
          },
          {
            heading: "Why SSE?",
            items: [
              "Direct access to motivated CS/SE students",
              "Students with real project experience",
              "Engaged audience ready for opportunities",
              "Flexible scheduling to fit your needs",
            ],
          },
        ],
      }),

      // ── ViSE ── 2-column bullet pair with description
      section("ViSE", {
        width: "wide",
        padding: "normal",
        depth: "1",
      }),
      block("bulletListPair", {
        heading: "Voices in Software Engineering (ViSE)",
        description:
          "Our speaker series brings industry professionals, alumni, researchers, and independent engineers into the SSE community to share their stories, work, and insights. If you have something to say, we want to hear it.",
        columns: [
          {
            heading: "Who We're Looking For",
            items: [
              "Engineers talking about work they're proud of",
              "Researchers sharing current projects",
              "Alumni reflecting on career paths",
              "Independent voices with a technical story to tell",
            ],
          },
          {
            heading: "What to Expect",
            items: [
              "A curious, engaged audience of CS/SE students",
              "In-person (GOL-1670), virtual, or hybrid formats",
              "Typical talks run 30–60 minutes with Q&A",
              "No sales pitches — ViSE is about ideas, not recruiting",
            ],
          },
        ],
      }),

      // ── Questions ── plain Card, centered max-w-2xl text
      section("Sponsor questions", {
        width: "wide",
        padding: "normal",
        depth: "1",
      }),
      block("heading", {
        text: "Questions?",
        level: 2,
        align: "center",
        accent: "none",
      }),
      block("markdown", {
        body: "Have questions about sponsorship or recruiting opportunities? Reach out to us directly.\n\n[societyofsoftwareengineers@gmail.com](mailto:societyofsoftwareengineers@gmail.com)",
        align: "center",
      }),
    ]),
  },
];
