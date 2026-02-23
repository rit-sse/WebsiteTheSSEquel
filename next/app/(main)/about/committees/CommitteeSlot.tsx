import { ZCardContent } from "@/types/ZCardContent";
export class CommitteeSlot implements ZCardContent {
    imageSrc: string;
    name: string;
    description: string;

    constructor(
        private constructorImageSrc: string,
        private constructorName: string,
        private constructorDescription: string
    ) {
        this.imageSrc = constructorImageSrc;
        this.name = constructorName;
        this.description = constructorDescription;
    }

    getAlt(): string {
        return "Image of " + this.name;
    }

    toContent(): () => React.ReactNode {
        const name = this.name;
        const description = this.description;
        return function slotContent() {
            return (
                <div className="general-classes">
                    <h2 className='name-classes'>
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