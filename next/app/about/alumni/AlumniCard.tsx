import { GitHubIcon, LinkedInIcon, EmailIcon } from "../../../components/common/Icons";
import { AlumniMember } from "./alumni";
import Avatar from 'boring-avatars';
import Image from "next/image";

interface AlumniCardProps {
  alumniMember: AlumniMember;
}

export default function AlumniCard({ alumniMember }: AlumniCardProps) {
  return (
    <div className="mt-4 w-full flex justify-center">
      <div className="mt-2 flex flex-col items-center w-full max-w-xs sm:max-w-sm px-4">
        {alumniMember.image != "https://source.boringavatars.com/beam/" ? (
          <Image src={alumniMember.image} alt="Photo of team member" width={96} height={96} className="rounded-full object-cover"/> 
        ) : (
          <Avatar size={96} name={alumniMember.name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
        )}
        <h4 className="font-bold sm:text-lg text-primary-focus">{alumniMember.name}</h4>
        <p className="font-semibold">{alumniMember.title}</p>
        <p className="mt-2 px-2 text-center">{alumniMember.desc}</p>
        <div className="w-full flex flex-row gap-4 justify-center items-center">
          {alumniMember.linkedin && (
            <a href={alumniMember.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedInIcon />
            </a>
          )}
          {alumniMember.github && (
            <a href={alumniMember.github} target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
            </a>
          )}
          {alumniMember.email && (
            <a href={`mailto:${alumniMember.email}`}>
              <EmailIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
