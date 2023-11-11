import { ZCardContent } from "@/types/ZCardContent";
import { FC } from "react";

export class CommitteeSlot implements ZCardContent {
    imageSrc: string;
    title: string;
    body: string;

    constructor(
        private imageSrcString: string,
        private titleName: string,
        private bodyContent: string
    ) {
        this.imageSrc = imageSrcString;
        this.title = titleName;
        this.body = bodyContent;
    }

    getAlt(): string {
        return "Image of" + this.title;
    }

    toContent(): FC<{}> {
        return () => {
            const generalClasses = 'text-left pt-4 pb-32 md:py-16'
            const nameClasses = 'bg-clip-text font-bold text-3xl/[3rem]'
            const descriptionClasses = 'mt-4 pb-4 text-xl/relaxed'
        
            return (
            <div className={generalClasses}>
                <h2 className={nameClasses}>
                    {this.title}
                </h2>
        
                <p className={descriptionClasses}>
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