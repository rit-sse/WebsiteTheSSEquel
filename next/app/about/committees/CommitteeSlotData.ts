// The default height and width for the placeholder dummy photo
const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`
const defaultDescription = `This is a description of the committee. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                            sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                            porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                            Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                            Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.`


// Here is what each locale should follow.
export interface descriptionStructure {
    events: string,
    talks: string,
    public_relations: string,
    mentoring: string,
    marketing: string,
    student_outreach: string,
    tech_committee: string
}

// "Hey we are not gonna use any language other than English!"
// I'd like this to be separated *in case* another language needs to be accommodated.
const descriptions: {
    [locale: string]: descriptionStructure
} = {
    "en_US": {
        "events": "The events committee, lead by the Events Head, is in charge of hosting all of the Society's fun events for the semester! Whether we're hanging out in the lab with a movie night, hosting a fun family feud night, or going off campus for laser tag or camping, there's always something fun planned with the SSE!",
        "talks": "The Talks committee, lead by the Head of Talks, is in charge of hosting all of the Society's talks throughout the semester. Students can come in the lab and schedule a time to give a talk about virtually any subject they're passionate about! Want to explain the intricacies of Git? Or the best ways to destress before finals week? Talks committee has you covered!",
        "public_relations": "The Public Relations committee, lead by the Head of Public Relations, maintains the SSE's strong connections with our company partners. We build connections with businesses near and far, and love to invite them back to the lab to talk to our students about anything career-related! We're always looking for new companies to connect with, whether for talks or sponsorship opportunities!",
        "mentoring": "The Mentoring committee, lead by the Mentoring Head, ensures that our core function as a tutoring organization is carried out! We offer mentoring for all students Monday to Friday from 10:00AM to 6:00PM. There is also an exam cabinet available for students to study from that the committee maintains an inventory of. In addition, the committee hosts end-of-semester appreciation events to celebrate all the hard work our volunteer mentors do over the semester.",
        "marketing": "The Marketing committee, lead by the Head of Marketing, is in charge of keeping track of (and growing) our online presence! This includes getting the word out about our new social medias, making posters for our events and talks, posting any exciting or funny photos from the lab or events that week, and working with other committees to ensure that our members are up-to-date on the great stuff going on at the SSE!",
        "student_outreach": "The Student Outreach committee is responsible for helping to promote the Society of Software Engineers to all of campus and potential/new students in as many ways possible. This includes volunteering for the SSE student open houses, speaking to students in the SE freshman and co-op seminar classes, and running Orientation events in the fall semester.",
        "tech_committee": "The Tech Committee meets together on Sunday to develop the website for the Society of Software Engineers! This is the website that you are on right now, where we worked as a team to turn it into a reality. We also work on everything tech related in the lab, whether it be the lab computers, the lab TVs, or even just as support for our projects committee!",
    }
}

export default [
    {
        imageSrc: "/images/events1.jpg",
        name: 'Events',
        description: descriptions["en_US"]["events"]
    },
    {
        imageSrc: "/images/nat-imagine.png",
        name: 'Talks',
        description: descriptions["en_US"]["talks"]
    },
    {
        imageSrc: "/images/mtb.jpg",
        name: 'Public Relations',
        description: descriptions["en_US"]["public_relations"]
    },
    {
        imageSrc: "/images/mentoring.jpg",
        name: 'Mentoring',
        description: descriptions["en_US"]["mentoring"]
    },
    {
        imageSrc: "/images/sse-booth.jpg",
        name: 'Marketing',
        description: descriptions["en_US"]["marketing"]
    },
    {
        imageSrc: "/images/outreach.jpg",
        name: 'Student Outreach',
        description: descriptions["en_US"]["student_outreach"]
    },
    {
        imageSrc: "/images/tech-committee-1.jpg",
        name: 'Tech Committee',
        description: descriptions["en_US"]["tech_committee"]
    }
]