import Image from 'next/image';
import { ZCardContent } from '@/types/ZCardContent';
import ZCard from './ZCard';
import { Card } from "@/components/ui/card";
import RevealOnScroll from "@/components/common/RevealOnScroll";

const ZCardContainer: React.FC<{
    contentSlots: ZCardContent[];
  }> = ({ contentSlots }) => {
    return (
        <div className='pt-4'>
            {contentSlots.map((slot, index) => (
                <RevealOnScroll key={index}>
                    <Card className="mb-8 px-6 py-4 md:px-8 md:py-5">
                        <ZCard imageSide={index % 2 == 0 ? 'left' : 'right'}>
                            <Image
                                src={slot.getImageSrc()}
                                alt={slot.getAlt()}
                                width='540'
                                height='400'
                                className="w-full h-auto rounded-md"
                            />
                            {slot.toContent()({})}
                        </ZCard>
                    </Card>
                </RevealOnScroll>
            ))}
        </div>
      );
  };
  
export default ZCardContainer;