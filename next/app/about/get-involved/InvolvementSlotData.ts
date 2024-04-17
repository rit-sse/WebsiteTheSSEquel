// The default height and width for the placeholder dummy photo
const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`
const defaultDescription = `This is a description of the committee. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                            sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                            porttitor, dignissim vulputate neque.`

export default [
    {
        imageSrc: "/images/mentoring-review-session-1.png",
        title: 'Come to General Meeting',
        body: `We have a general meeting every week on Monday at 1 PM in the SSE lab (GOL 1670). Come join us
            to stay up to date with what's happening in the SSE and to meet other members! If you have any questions,
            feel free to reach out to any of the officers (found on the Leadership page). The lab is open every weekday
            from 10 AM to 6 PM. Feel free to stop by and hang out, we love meeting new people!`
    },
    {
        imageSrc: "/images/mentoring.jpg",
        title: 'Come in for Mentoring',
        body: `If you need help with any of your GCCIS or math classes, we have mentors who would love to help! Mentoring is 
        open Monday to Friday from 10AM to 6PM. You can check out the mentoring schedule of the times for each mentor. 
        If you would like to apply to be a mentor, please reach out to our Mentoring Head.`
    },
    {
        imageSrc: "/images/projects-2.gif",
        title: 'Join a Project',
        body: `Collaboration is a core value of the SSE. We have a variety of projects that you can join (including this website!).
            Check out our projects page to see what we're working on. Don't see anything you like? Reach out to our projects head
            to start your own project! An SSE project can be anything with a software component, so get creative!`
    },
    {
        imageSrc: "/images/talks-2.jpg",
        title: 'Attend or Give a Talk',
        body: `We don't always talk about technical software topics, we often delve into diverse topics, such as 
            the amusing appearances of various aquatic creatures. Our enthusiasm for this particular subject matter has led 
            to the establishment of Funny Fish Friday, a designated day for engaging in lively conversations about these quirky 
            aquatic beings. If you would like to give a talk of your own please reach out to our Talk Head!`
    },
    {
        imageSrc: defaultImage,
        title: 'Help Clean the Lab',
        body: `With all this happening, the lab can get a bit messy. 
            This is a great opportunity to gain membership here by participating 
            in lab cleanup sessions! Check out our calendar for the next lab cleaning, or talk to our Lab Ops Head.`
    },
    {
        imageSrc: "/images/tech-committee-1.jpg",
        title: 'Come to Tech Committee',
        body: `If you would like to help rebuild the SSE website, come to GOL-1670 on Sundays at 1PM!
        It's a great way to get some experience developing websites, and looks excellent on your resume!
        Plus, you get to have food, and make new friends!`
    }
]