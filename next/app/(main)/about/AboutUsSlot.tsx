import { ZCardContent } from "@/types/ZCardContent";
import { FC } from "react";

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

    toContent(): FC {
        const name = this.name;
        const description = this.description;
        return function slotContent() {
            return (
                <div className='general-classes'>
                    <div className="inline-block">
                        <h2 className='title-classes'>
                            {name}
                        </h2>
                        <div className="h-0.5 w-full rounded-full bg-chart-2 accent-rule-animate mt-2 mb-4" aria-hidden="true" />
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