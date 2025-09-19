import Image from 'next/image';

interface SponsorProps {
    url: string;
    imageLink: string;
}

export default function Sponsor({url, imageLink}: SponsorProps){
    return(
        <a className='mr-3' href={url}>
            <Image className="m-4 inline" src={imageLink} width={150} height={150} objectFit='contain' alt="sponsor"/>
        </a>
    )
}