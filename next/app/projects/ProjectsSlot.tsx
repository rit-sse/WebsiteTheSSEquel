import { ZCardContent } from "@/types/ZCardContent";
import { FC } from "react";

export class ProjectsSlot implements ZCardContent {
    constructor(
        private readonly imageSrc: string,
        private readonly name: string,
        private readonly description: string,
        private readonly contactName: string,
        private readonly contact: string,
        private readonly alt: string
    ) {
        this.imageSrc = imageSrc;
        this.name = name;
        this.description = description;
        this.contactName = contactName;
        this.contact = contact;
        this.alt = alt
    }

    getAlt = () => this.alt;

    toContent(): FC {
        // eslint-disable-next-line react/display-name
        return () =>
            (
                <div className="text-left pt-4 pb-32 md:py-16">
                    <h3 className="text-3xl font-bold">
                        {this.name}
                    </h3>
                    <h4>
                        {this.contactName} | {this.contact}
                    </h4>
                    <p className="sm:text-xl/relaxed">
                        {this.description}
                    </p>
                </div>
            );
    }

    getImageSrc(): string {
        return this.imageSrc;
    }
}