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

export default [
    {
        imageSrc: "/images/events1.jpg",
        name: 'Events',
        description: defaultDescription
    },
    {
        imageSrc: "/images/talks-1.jpg",
        name: 'Talks',
        description: defaultDescription
    },
    {
        imageSrc: "/images/talks-2.jpg",
        name: 'Public Relations',
        description: defaultDescription
    },
    {
        imageSrc: "/images/mentoring.jpg",
        name: 'Mentoring',
        description: defaultDescription
    },
    {
        imageSrc: "/images/mentoring-review-session-1.png",
        name: 'Marketing',
        description: defaultDescription
    },
    {
        imageSrc: "/images/student-involvement-1.jpg",
        name: 'Student Outreach',
        description: defaultDescription
    },
    {
        imageSrc: "/images/tech-committee-1.jpg",
        name: 'Tech Committee',
        description: defaultDescription
    }
]