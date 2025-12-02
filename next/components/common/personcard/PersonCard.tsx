import Avatar from 'boring-avatars';
import { EmailIcon, GitHubIcon, LinkedInIcon } from '../Icons';
import { Person, SocialLinks } from './persondata';

export class PersonCardBuilder {
    private keys: (keyof Person)[] = [];
    private builders: {(person: Person, key: keyof Person): JSX.Element | undefined;}[] = [];

    public create(person: Person) {
        return (
            <div className="mt-2 flex flex-col items-center max-w-xs sm:max-w-sm px-4">
                {this.builders.map((builder, idx) => builder(person, this.keys[idx]))}
            </div>
        );
    }

    public buildIcon(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(Icon);
        return this;
    }

    public buildSocials(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(SocialInformation);
        return this;
    }

    public buildTitle(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(Name);
        return this;
    }

    public buildInfo(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(Information);
        return this;
    }

    public buildInfoList(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(InformationList);
        return this;
    }

    public buildBoldInfo(key: string): PersonCardBuilder {
        this.keys.push(key as keyof Person);
        this.builders.push(BoldInformation);
        return this;
    }
}

function SocialInformation(person: Person, key: keyof Person) {
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

function Icon(person: Person, key: keyof Person) {
    const name = person[key] as string;
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

function Name(person: Person, key: keyof Person) {
    const name = person[key] as string;
    return (
        <h4 className="font-bold sm:text-lg text-primary-focus text-center">
            {name}
        </h4>
    );
}

function Information(person: Person, key: keyof Person) {
    const info = person[key] as string;
    if (!info) return;
    return (
        <p>
            {info}
        </p>
    );
}

function BoldInformation(person: Person, key: keyof Person) {
    const info = person[key] as string;
    if (!info) return;
    return (
        <p className="font-semibold text-center">
            {info}
        </p>
    );
}

function InformationList(person: Person, key: keyof Person) {
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