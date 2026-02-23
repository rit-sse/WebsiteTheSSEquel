import { ZCardContent } from "@/types/ZCardContent";
export class AboutUsSlot implements ZCardContent {
    constructor(
        private readonly imageSrc: string,
        private readonly name: string,
        private readonly description: string,
        private readonly alt: string
    ) {
        this.imageSrc = imageSrc;
        this.name = name;
        this.description = description;
        this.alt = alt
    }

    getAlt = () => this.alt;

    toContent(): () => React.ReactNode {
        const name = this.name;
        const description = this.description;
        return function slotContent() {
            return (
                <div className='general-classes'>
                    <h2 className='title-classes'>
                        {name}
                    </h2>
                    
                    <p className='description-classes'>
                        {description}
                    </p>
                </div>
            );
        }
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}