import { GitHubIcon, LinkedInIcon, EmailIcon } from "../../../components/common/Icons";
import { TeamMember } from "./team";
import Avatar from 'boring-avatars';
import Image from "next/image";

interface OfficerCardProps {
  teamMember: TeamMember;
}

export default function OfficerCard({ teamMember }: OfficerCardProps) {

  return (
    <div className="mt-4 w-full flex justify-center">
      <div className="mt-2 flex flex-col items-center w-full max-w-xs sm:max-w-sm px-4">
        {teamMember.image != "https://source.boringavatars.com/beam/" ? (
          <Image src={teamMember.image} alt="Photo of team member" width={96} height={96} className="rounded-full object-cover"/> 
        ) : (
          <Avatar size={96} name={teamMember.name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
        )}
        <h4 className="font-bold sm:text-lg text-primary-focus">{teamMember.name}</h4>
        <p className="font-semibold">{teamMember.title}</p>
        <p className="mt-2 px-2 text-center">{teamMember.desc}</p>
        <div className="w-full flex flex-row gap-4 justify-center items-center">
          <a href={teamMember.linkedin}>
            <LinkedInIcon />
          </a>
          <a href={teamMember.github}>
            <GitHubIcon />
          </a>
          <a href={teamMember.email}>
            <EmailIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
