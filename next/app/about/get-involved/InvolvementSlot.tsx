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
            return (
            <div className='general-classes'>
                <h2 className='title-classes'>
                    {this.title}
                </h2>
        
                <p className='description-classes'>
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