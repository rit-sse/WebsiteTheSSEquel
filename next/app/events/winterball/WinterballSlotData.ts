const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`

const data: {imageSrc: string, name: string, description: string, alt:string}[] = [
    {
        imageSrc: defaultImage,
        name: "Have Some Fun",
        description: `Some information about what the Winterball is like. 
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullam corper
        dui eu ex laoreet, sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
        porttitor, dignissim vulputate neque.`,
        alt: "Have Some Fun"
    },
    {
        imageSrc: defaultImage,
        name: "Food and Drinks",
        description: `Some information about the food and drinks that will be served.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ullam corper
        dui eu ex laoreet, sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
        porttitor, dignissim vulputate neque.`,
        alt: "Food and Drinks"
    }
]

export default data;