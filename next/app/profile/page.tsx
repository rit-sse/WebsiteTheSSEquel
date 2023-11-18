import { GitHubIcon, LinkedInIcon, EmailIcon, DiscordIcon, SlackIcon, InstagramIcon, TwitchIcon, ClearIcon } from "../../components/common/Icons";
import { Profile, Role } from "./profile";

const user: Profile = {
    avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
    name: "Jonathon Cruz",
    pronouns: "he/him/his",
    role: Role.president,
    bio: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
    links: {
        github: "#",
        linkedIn: "#",
        email: "email@email.com",
        instagram: "#"
    }
}

export default function Profile() {
    return (
        <>
            <div className="mt-4">
                <div className="w-24 h-24 mx-auto">
                    <img src={user.avatar} className="w-full h-full rounded-full" alt="profile picture" />
                </div>
                <div className="mt-7 flex flex-col items-center">
                    <h2 className="font-bold text-4xl md:text-6xl text-primary-focus">{user.name}</h2>
                    <h3 className="mt-2 font-semibold text-3xl">{user.role}</h3>
                    <h4 className="mt-2 font-semibold text-lg">{user.pronouns}</h4>
                    <p className="mt-2 px-2 text-center">{user.bio}</p>
                    <div className="flex flex-row gap-4 mt-4 justify-center items-center">
                        {(user.links?.email != null) && <a href={user.links?.email}>
                            <EmailIcon />
                        </a>}
                        {(user.links?.website != null) && <a href={user.links?.website}>
                            <ClearIcon />
                        </a>}
                        {(user.links?.linkedIn != null) && <a href={user.links?.linkedIn}>
                            <LinkedInIcon />
                        </a>}
                        {(user.links?.github != null) && <a href={user.links?.github}>
                            <GitHubIcon />
                        </a>}
                        {(user.links?.discord != null) && <a href={user.links?.discord}>
                            <DiscordIcon />
                        </a>}
                        {(user.links?.slack != null) && <a href={user.links?.slack}>
                            <SlackIcon />
                        </a>}
                        {(user.links?.instagram != null) && <a href={user.links?.instagram}>
                            <InstagramIcon />
                        </a>}
                        {(user.links?.twitch != null) && <a href={user.links?.twitch}>
                            <TwitchIcon />
                        </a>}
                    </div>
                </div>
            </div>
        </>
    );
}