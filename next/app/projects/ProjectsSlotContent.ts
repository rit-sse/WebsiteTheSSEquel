const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`

const data: { imageSrc: string, name: string, description: string, contactName: string, contact: string, alt: string }[] = [
    {
        imageSrc: defaultImage,
        name: "Website Rework", 
        description: `The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.
        The old website sucks, and Tess is Tech Head.`,
        contactName: "Tess Hacker",
        contact: "esh7943@rit.edu",
        alt: "Website Progress Photo"
    },
    {
        imageSrc: defaultImage,
        name: "Hand Waving Robot",
        description: `We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.`,
        contactName: "John Mihal",
        contact: "jn7198@rit.edu",
        alt: "Hand Waving Robot"
    },
    {
        imageSrc: defaultImage,
        name: "Matrix Display",
        description: `We want cool displays, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.
        We are tired at waving at tours, and Tess is Tech Head.`,
        contactName: "Aditya Vikram",
        contact: "av9242@rit.edu",
        alt: "Matrix Display Prototype"
    }
]

export default data;