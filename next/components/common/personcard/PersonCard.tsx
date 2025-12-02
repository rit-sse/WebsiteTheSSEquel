import Avatar from 'boring-avatars';
import { EmailIcon, GitHubIcon, LinkedInIcon } from '../Icons';
import { SocialLinks } from './persondata';

export class PersonCardBuilder<T> {
    private keys: (keyof T)[] = [];
    private builders: {(person: T, key: keyof T): JSX.Element | undefined;}[] = [];

    public create(person: T) {
        return (
            <div className="mt-2 flex flex-col items-center max-w-xs sm:max-w-sm px-4">
                {this.builders.map((builder, idx) => builder(person, this.keys[idx]))}
            </div>
        );
    }

    /**
     * Builds Icon from given person, the person interface MUST include 'name'
     * @param key Key of Person that holds icon image information
     * @returns 
     */
    public buildIcon(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(Icon);
        return this;
    }

    /**
     * Builds a view of different links to socials, this value of person
     * must contain SocialLinks.
     * @param key Key of person that holds SocialLinks
     * @returns 
     */
    public buildSocials(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(SocialInformation);
        return this;
    }

    public buildTitle(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(Name);
        return this;
    }

    public buildInfo(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(Information);
        return this;
    }

    /**
     * Builds a list of information stacked vertically, the value from the key
     * must be an string[]
     * @param key Key of person that holds a list of information
     * @returns 
     */
    public buildInfoList(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(InformationList);
        return this;
    }

    public buildBoldInfo(key: string): PersonCardBuilder<T> {
        this.keys.push(key as keyof T);
        this.builders.push(BoldInformation);
        return this;
    }
}

function SocialInformation<T>(person: T, key: keyof T) {
    const links: SocialLinks = person[key] as SocialLinks;
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

function Icon<T>(person: any, key: keyof T) {
    const name = person.name; //TODO remove the any here
    const image = person[key] as string;
    if (!image) return;
    else if (image == "https://source.boringavatars.com/beam/")
        return (
            <Avatar size={96} name={name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
        );
    return (
        <img src={image} alt="Photo of team member" className="rounded-full object-cover h-[96px] w-[96px]"/>
    );
}

function Name<T>(person: T, key: keyof T) {
    const name = person[key] as string;
    return (
        <h4 className="font-bold sm:text-lg text-primary-focus text-center">
            {name}
        </h4>
    );
}

function Information<T>(person: T, key: keyof T) {
    const info = person[key] as string;
    if (!info) return;
    return (
        <p>
            {info}
        </p>
    );
}

function BoldInformation<T>(person: T, key: keyof T) {
    const info = person[key] as string;
    if (!info) return;
    return (
        <p className="font-semibold text-center">
            {info}
        </p>
    );
}

function InformationList<T>(person: T, key: keyof T) {
    const list: string[] = person[key] as string[];
    if (!list) return;
    return (
        <>
        <div>
        {list.map((element, idx) => {
            return (<p key={idx}>{element}</p>)
        })}
        </div>
        </>
    );
}