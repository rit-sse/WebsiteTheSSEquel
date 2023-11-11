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
            const generalClasses = 'text-left pt-4 pb-32 md:py-16'
            const nameClasses = 'bg-clip-text font-bold text-3xl/[3rem]'
            const descriptionClasses = 'mt-4 pb-4 text-xl/relaxed'
        
            return (
            <div className={generalClasses}>
                <h2 className={nameClasses}>
                    {this.name}
                </h2>
        
                <p className={descriptionClasses}>
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