import Image from 'next/image';
import { ZCardContent } from '@/types/ZCardContent';
import ZCard from './ZCard';

const ZCardContainer: React.FC<{
    contentSlots: ZCardContent[];
  }> = ({ contentSlots }) => {
    return (
        <div className='pt-4'>
            {contentSlots.map((slot, index) => (
                <div key={index}>
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
                </div>
            ))}
        </div>
      );
  };
  
export default ZCardContainer;