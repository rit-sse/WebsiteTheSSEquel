import Avatar from 'boring-avatars';
import { EmailIcon, GitHubIcon, LinkedInIcon } from './Icons';

export interface Person {
    person_id?: string;
    name: string;
    image?: string;
    title?: string;
    description?: string;
    links?: SocialLinks;
    start_date?: string;
    end_date?: string;
    other_info?: string[];
}

export interface SocialLinks {
    email?: string;
    linkedin?: string;
    github?: string;
}

interface PersonProps {
    person: Person;
}

interface Iconprops {
    name: string;
    image?: string;
}

export function PersonCard({ person }: PersonProps) {
    return (
        <div className="mt-2 flex flex-col items-center w-full max-w-xs sm:max-w-sm px-4">
            <Icon name={person.name} image={person.image}/>
            <Name name={person.name}/>
            <BoldInformation info={person.title}/>
            <BoldInformation info={person.end_date}/>
            <Information info={person.description}/>
            <SocialInformation links={person.links}/>
        </div>
    );
}

function SocialInformation({ links }: any) {
    if (!links) return;
    return (
        <div>
            {links.linkedin && (
                <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
                    <LinkedInIcon />
                </a>
            )}
            {links.github && (
                <a href={links.github} target="_blank" rel="noopener noreferrer">
                    <GitHubIcon />
                </a>
            )}
            {links.email && (
                <a href={`mailto:${links.email}`}>
                    <EmailIcon />
                </a>
            )}
        </div>
    );
}

function Icon({ name, image }: Iconprops) {
    if (!image) return;
    else if (image == "https://source.boringavatars.com/beam/")
        return (
            <Avatar size={96} name={name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
        );
    return (
        <img src={image} alt="Photo of team member" className="rounded-full object-cover h-[96px] w-[96px]"/>
    );
}

function Name({ name }: any) {
    return (
        <h4 className="font-bold sm:text-lg text-primary-focus text-center">
            {name}
        </h4>
    );
}

function Information({ info }: any) {
    if (!info) return;
    return (
        <p>
            {info}
        </p>
    );
}

function BoldInformation({ info }: any) {
    if (!info) return;
    return (
        <p className="font-semibold text-center">
            {info}
        </p>
    );
}