import ZCardContainer from '@/components/ZCardContainer';
import { InvolvementSlot } from './InvolvementSlot'
import { GetInvolvedCTAs } from './GetInvolvedCTAs'
import { Card } from "@/components/ui/card";
import { getInvolvementSlots } from '@/lib/cmsContent';

export default async function GetInvolved() {
    const { introText, slots: involvementSlotData } = await getInvolvementSlots();

    return (
        <section className="py-8 px-4 md:px-8">
            <div className="max-w-screen-xl mx-auto">
                <Card depth={1} className="p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-primary">Get Involved!</h1>
                        <p className="mt-4 text-lg max-w-3xl mx-auto">
                            {introText}
                        </p>
                    </div>

                    <ZCardContainer contentSlots={
                        involvementSlotData.map(
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