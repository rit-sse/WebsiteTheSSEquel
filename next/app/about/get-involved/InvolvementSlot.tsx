import { ZCardContent } from "@/types/ZCardContent";
import { FC } from "react";

export class InvolvementSlot implements ZCardContent {
    imageSrc: string;
    title: string;
    body: string;

    constructor(
        private constructorImageSrc: string,
        private constructortitle: string,
        private constructorbody: string
    ) {
        this.imageSrc = constructorImageSrc;
        this.title = constructortitle;
        this.body = constructorbody;
    }

    getAlt(): string {
        return "Image of " + this.title;
    }

    toContent(): FC<{}> {
        return () => {
            const generalClasses = 'text-left pt-4 pb-32 md:py-16'
            const titleClasses = 'bg-clip-text font-bold text-3xl/[3rem]'
            const bodyClasses = 'mt-4 pb-4 text-xl/relaxed'
        
            return (
            <div className={generalClasses}>
                <h2 className={titleClasses}>
                    {this.title}
                </h2>
        
                <p className={bodyClasses}>
                    {this.body}
                </p>
            </div>
            );
        }
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}