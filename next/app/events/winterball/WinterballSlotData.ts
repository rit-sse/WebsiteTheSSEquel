const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`

const data: {imageSrc: string, name: string, description: string, alt:string}[] = [
    {
        imageSrc: defaultImage,
        name: "Have Some Fun",
        description: `Explain how Winter Ball is fun (live music, decorations)
        Information about the food and drinks at Winter Ball.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullamcorper
        dui eu ex laoreet, sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
        porttitor, dignissim vulputate neque.`,
        alt: "All-In-One Hub For Developers"
    },
    {
        imageSrc: defaultImage,
        name: "Food and Drinks",
        description: `Information about the food and drinks at Winter Ball.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullamcorper
        dui eu ex laoreet, sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
        porttitor, dignissim vulputate neque.`,
        alt: "Food and Drinks"
    }
]

export default data;