import Image from 'next/image';

export const Sponsor: React.FC<{url: string, imageLink: string}> = ({url, imageLink}) =>
    (
        <a className='mr-3' href={url}>
            <Image className="m-4 inline" src={imageLink} width={150} height={150} objectFit='contain' alt="sponsor"/>
        </a>
    );