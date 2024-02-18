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
        return () => {
            return (
                <div className='general-classes'>
                    <h2 className='title-classes'>
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