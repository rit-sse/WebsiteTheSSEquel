import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface SponsorProps {
    url: string;
    imageLink: string;
    name: string;
    description: string;
}

export const Sponsor: React.FC<SponsorProps> = ({ url, imageLink, name, description }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block group">
        <Card depth={2} className="p-4 h-full transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none w-[280px]">
            <div className="flex flex-col items-center text-center gap-3">
                <div className="relative w-[120px] h-[80px]">
                    <Image
                        src={imageLink}
                        alt={name}
                        fill
                        className="object-contain"
                    />
                </div>
                <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
            </div>
        </Card>
    </a>
);