import { ZCardContent } from "@/types/ZCardContent";
import { FC } from "react";

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

    toContent(): FC<{}> {
        return () => {
            return (
                <div className="general-classes">
                    <h2 className='name-classes'>
                        {this.name}
                    </h2>
                
                    <p className='description-classes'>
                        {this.description}
                    </p>
                </div>
            );
        }
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}