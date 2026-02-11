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
        const name = this.name;
        const description = this.description;
        return function slotContent() {
            return (
                <div className="general-classes">
                    <div className="inline-block">
                        <h2 className='name-classes'>
                            {name}
                        </h2>
                        <div className="h-0.5 w-full rounded-full bg-chart-4 accent-rule-animate mt-2 mb-4" aria-hidden="true" />
                    </div>
                
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