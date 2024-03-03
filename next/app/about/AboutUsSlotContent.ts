const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`

const data: {imageSrc: string, name: string, description: string, alt:string}[] = [
    {
        imageSrc: defaultImage,
        name: "All-In-One Hub For Developers",
        description: `GOL-1670 offers weekday Software Engineering mentoring and
                tutoring. Experience the SSE Winter Ball, partake in trips and
                movies, or join our intramural sports. Academics and recreation,
                seamlessly combined.`,
        alt: "All-In-One Hub For Developers"
    },
    {
        imageSrc: defaultImage,
        name: "Hands-On Experience",
        description: `In the Projects Committee, SSE members collaborate on unique
                software projects, from singing tesla coils to multitouch walls.
                Additionally, our Rapid Development Weekends offer a fast-paced
                experience, producing everything from games to file transfer
                systems in just two days.`,
        alt: "Hands-On Experience"
    }
]

export default data;