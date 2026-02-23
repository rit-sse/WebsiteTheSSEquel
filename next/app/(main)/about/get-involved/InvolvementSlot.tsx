import { ZCardContent } from "@/types/ZCardContent";
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

    toContent(): () => React.ReactNode {
        const title = this.title;
        const body = this.body;
        return function slotData() {       
            return (
                <div className='general-classes'>
                    <h2 className='title-classes'>
                        {title}
                    </h2>
                
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