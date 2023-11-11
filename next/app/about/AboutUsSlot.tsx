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
        // eslint-disable-next-line react/display-name
        return () =>
            (
                <div>
                    <h3 className="text-3xl font-bold">
                        {this.name}
                    </h3>
                    <p className="mt-8 sm:text-xl/relaxed">
                        {this.description}
                    </p>
                </div>
            );
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}