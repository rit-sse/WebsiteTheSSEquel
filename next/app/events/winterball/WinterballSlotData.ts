const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`

const data: { imageSrc: string, name: string, description: string, alt: string }[] = [
    {
        imageSrc: defaultImage,
        name: "Open to All",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. .`,
        alt: "All-In-One Hub For Developers"
    },
    {
        imageSrc: defaultImage,
        name: "Food and Drinks",
        description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. .`,
        alt: "Hands-On Experience"
    }
]

export default data;