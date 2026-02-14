/**
 * Auto-seed Payload globals with the existing hardcoded content the first
 * time the server boots.  This runs inside `onInit` so officers immediately
 * see real, editable content in the admin panel instead of empty forms.
 *
 * The seed is idempotent: it checks for a sentinel field on each global and
 * only writes when the global is still in its default (empty) state.
 */
import type { Payload } from "payload";

// ─── Homepage ─────────────────────────────────────────────────────────
const homepageSeed = {
  description:
    "An academic organization at the Rochester Institute of Technology providing mentoring and community to students in Golisano College.",
  labHoursCallout: "Mentoring hours: Monday-Friday from 10:00 AM - 6:00 PM",
  weeklyMeetingCallout:
    "Come to our weekly meetings on Wednesday at 3:00 PM in GOL-1670!",
  discordLink: "https://www.discord.gg/rNC6wj82kq",
  instagramLink: "https://www.instagram.com/rit_sse/",
  tiktokLink: "https://www.tiktok.com/@rit_sse",
  twitchLink: "https://www.twitch.tv/rit_sse",
};

// ─── About Page ───────────────────────────────────────────────────────
const aboutSeed = {
  introText:
    "The Society of Software Engineers at RIT fosters a vibrant community of tech enthusiasts, bridging academia with industry partnerships from giants like Microsoft to Apple, ensuring our members thrive in their future careers.",
  slots: [
    {
      imageSrc: "/images/locked-in.jpg",
      name: "All-In-One Hub For Developers",
      description:
        "GOL-1670 offers weekday Software Engineering mentoring and tutoring. Experience the SSE Winter Ball, partake in trips and movies, or join our intramural sports. Academics and recreation, seamlessly combined.",
      alt: "All-In-One Hub For Developers",
    },
    {
      imageSrc: "/images/tech-committee-1.jpg",
      name: "Hands-On Experience",
      description:
        "In the Projects Committee, SSE members collaborate on unique software projects, from singing tesla coils to multitouch walls. Additionally, our Rapid Development Weekends offer a fast-paced experience, producing everything from games to file transfer systems in just two days.",
      alt: "Hands-On Experience",
    },
  ],
};

// ─── Committees Page ──────────────────────────────────────────────────
const committeesSeed = {
  introText:
    "The Society of Software Engineers delegates responsibility for tasks with committees. These committees play pivotal roles in organizing events, facilitating projects, providing platforms for knowledge exchange, and more. Together we create opportunities for members to connect, collaborate, and learn from one another.",
  committees: [
    {
      imageSrc: "/images/events1.jpg",
      name: "Events",
      description:
        "The events committee, lead by the Events Head, is in charge of hosting all of the Society's fun events for the semester! Whether we're hanging out in the lab with a movie night, hosting a fun family feud night, or going off campus for laser tag or camping, there's always something fun planned with the SSE!",
    },
    {
      imageSrc: "/images/nat-imagine.png",
      name: "Talks",
      description:
        "The Talks committee, lead by the Head of Talks, is in charge of hosting all of the Society's talks throughout the semester. Students can come in the lab and schedule a time to give a talk about virtually any subject they're passionate about! Want to explain the intricacies of Git? Or the best ways to destress before finals week? Talks committee has you covered!",
    },
    {
      imageSrc: "/images/mtb.jpg",
      name: "Public Relations",
      description:
        "The Public Relations committee, lead by the Head of Public Relations, maintains the SSE's strong connections with our company partners. We build connections with businesses near and far, and love to invite them back to the lab to talk to our students about anything career-related! We're always looking for new companies to connect with, whether for talks or sponsorship opportunities!",
    },
    {
      imageSrc: "/images/mentoring.jpg",
      name: "Mentoring",
      description:
        "The Mentoring committee, lead by the Mentoring Head, ensures that our core function as a tutoring organization is carried out! We offer mentoring for all students Monday to Friday from 10:00AM to 6:00PM. There is also an exam cabinet available for students to study from that the committee maintains an inventory of. In addition, the committee hosts end-of-semester appreciation events to celebrate all the hard work our volunteer mentors do over the semester.",
    },
    {
      imageSrc: "/images/sse-booth.jpg",
      name: "Marketing",
      description:
        "The Marketing committee, lead by the Head of Marketing, is in charge of keeping track of (and growing) our online presence! This includes getting the word out about our new social medias, making posters for our events and talks, posting any exciting or funny photos from the lab or events that week, and working with other committees to ensure that our members are up-to-date on the great stuff going on at the SSE!",
    },
    {
      imageSrc: "/images/outreach.jpg",
      name: "Student Outreach",
      description:
        "The Student Outreach committee is responsible for helping to promote the Society of Software Engineers to all of campus and potential/new students in as many ways possible. This includes volunteering for the SSE student open houses, speaking to students in the SE freshman and co-op seminar classes, and running Orientation events in the fall semester.",
    },
    {
      imageSrc: "/images/tech-committee-1.jpg",
      name: "Tech Committee",
      description:
        "The Tech Committee meets together on Sunday to develop the website for the Society of Software Engineers! This is the website that you are on right now, where we worked as a team to turn it into a reality. We also work on everything tech related in the lab, whether it be the lab computers, the lab TVs, or even just as support for our projects committee!",
    },
  ],
};

// ─── Get Involved Page ────────────────────────────────────────────────
const getInvolvedSeed = {
  introText:
    "Are you ready to make an impact? Dive in the heart of the SSE and become part of a vibrant community dedicated to innovation and collaboration. Whether you are passionate about coding, organizing events, or fostering connections, there is a place for you here. Join us in shaping the future of the SSE as we work together to create meaningful opportunities for growth, learning, and impact. Let's build something incredible together.",
  slots: [
    {
      imageSrc: "/images/gen-meeting.jpg",
      title: "Come to General Meeting",
      body: "We have a general meeting every week on Wednesday at 3 PM in the SSE lab (GOL 1670). Come join us to stay up to date with what's happening in the SSE and to meet other members! If you have any questions, feel free to reach out to any of the officers (found on the Leadership page). The lab is open every weekday from 10 AM to 6 PM. Feel free to stop by and hang out, we love meeting new people!",
    },
    {
      imageSrc: "/images/mentoring.jpg",
      title: "Come in for Mentoring",
      body: "If you need help with any of your GCCIS or math classes, we have mentors who would love to help! Mentoring is open Monday to Friday from 10AM to 6PM. You can check out the mentoring schedule of the times for each mentor. If you would like to apply to be a mentor, please reach out to our Mentoring Head.",
    },
    {
      imageSrc: "/images/jetmon-project.png",
      title: "Join a Project",
      body: "Collaboration is a core value of the SSE. We have a variety of projects that you can join (including this website!). Check out our projects page to see what we're working on. Don't see anything you like? Reach out to our projects head to start your own project! An SSE project can be anything with a software component, so get creative!",
    },
    {
      imageSrc: "/images/fish.jpg",
      title: "Attend or Give a Talk",
      body: "We don't always talk about technical software topics, we often delve into diverse topics, such as the amusing appearances of various aquatic creatures. Our enthusiasm for this particular subject matter has led to the establishment of Funny Fauna Friday, a designated day for engaging in lively conversations about these quirky aquatic beings. If you would like to give a talk of your own please reach out to our Talk Head!",
    },
    {
      imageSrc: "/images/shhhh.jpg",
      title: "Help Clean the Lab",
      body: "With all this happening, the lab can get a bit messy. This is a great opportunity to gain membership here by participating in lab cleanup sessions! Check out our calendar for the next lab cleaning, or talk to our Lab Ops Head.",
    },
  ],
};

// ─── Public entry point (called from payload.config onInit) ───────────
export async function seedGlobals(payload: Payload): Promise<void> {
  // --- Homepage ---
  try {
    const homepage = await payload.findGlobal({ slug: "homepage-content" });
    if (!homepage.description) {
      await payload.updateGlobal({
        slug: "homepage-content",
        data: homepageSeed as Record<string, unknown>,
        depth: 0,
      });
      payload.logger.info("Seeded homepage-content global.");
    }
  } catch (err) {
    payload.logger.error({ err }, "Failed to seed homepage-content");
  }

  // --- About Page ---
  try {
    const about = await payload.findGlobal({ slug: "about-page" });
    const slots = (about as Record<string, unknown>).slots;
    if (!Array.isArray(slots) || slots.length === 0) {
      await payload.updateGlobal({
        slug: "about-page",
        data: aboutSeed as Record<string, unknown>,
        depth: 0,
      });
      payload.logger.info("Seeded about-page global.");
    }
  } catch (err) {
    payload.logger.error({ err }, "Failed to seed about-page");
  }

  // --- Committees Page ---
  try {
    const committees = await payload.findGlobal({ slug: "committees-page" });
    const list = (committees as Record<string, unknown>).committees;
    if (!Array.isArray(list) || list.length === 0) {
      await payload.updateGlobal({
        slug: "committees-page",
        data: committeesSeed as Record<string, unknown>,
        depth: 0,
      });
      payload.logger.info("Seeded committees-page global.");
    }
  } catch (err) {
    payload.logger.error({ err }, "Failed to seed committees-page");
  }

  // --- Get Involved Page ---
  try {
    const involved = await payload.findGlobal({ slug: "get-involved-page" });
    const items = (involved as Record<string, unknown>).slots;
    if (!Array.isArray(items) || items.length === 0) {
      await payload.updateGlobal({
        slug: "get-involved-page",
        data: getInvolvedSeed as Record<string, unknown>,
        depth: 0,
      });
      payload.logger.info("Seeded get-involved-page global.");
    }
  } catch (err) {
    payload.logger.error({ err }, "Failed to seed get-involved-page");
  }
}
