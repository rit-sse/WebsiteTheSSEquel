import ZCardContainer from '@/components/ZCardContainer';
import InvolvementSlotData from './InvolvementSlotData';
import { InvolvementSlot } from './InvolvementSlot'
import { GetInvolvedCTAs } from './GetInvolvedCTAs'
import { Card } from "@/components/ui/card";

export default function GetInvolved() {
    return (
        <section className="py-8 px-4 md:px-8">
            <div className="max-w-screen-xl mx-auto">
                <Card depth={1} className="p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-primary">Get Involved!</h1>
                        <p className="mt-4 text-lg max-w-3xl mx-auto">
                            Are you ready to make an impact? Dive in the heart of the SSE and become part of a vibrant community dedicated to innovation and collaboration. Whether you are passionate about coding, organizing events, or fostering connections, there is a place for you here. Join us in shaping the future of the SSE as we work together to create meaningful opportunities for growth, learning, and impact. Let&apos;s build something incredible together.
                        </p>
                    </div>

                    <ZCardContainer contentSlots={
                        InvolvementSlotData.map(
                            data => new InvolvementSlot(
                                data.imageSrc, data.title, data.body
                            )
                        )
                    }/>

                    <GetInvolvedCTAs />
                </Card>
            </div>
        </section>
    )
}