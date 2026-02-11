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
        const title = this.title;
        const body = this.body;
        return function slotData() {       
            return (
                <div className='general-classes'>
                    <div className="inline-block">
                        <h2 className='title-classes'>
                            {title}
                        </h2>
                        <div className="h-0.5 w-full rounded-full bg-chart-7 accent-rule-animate mt-2 mb-4" aria-hidden="true" />
                    </div>
                
                    <p className='description-classes'>
                        {body}
                    </p>
                </div>
            );
        }
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}