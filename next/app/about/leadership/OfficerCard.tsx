import { GitHubIcon, LinkedInIcon, EmailIcon } from "../../../components/common/Icons";
import { TeamMember } from "./team";

interface OfficerCardProps {
  teamMember: TeamMember;
}

export default function OfficerCard({ teamMember }: OfficerCardProps) {

  return (
    <div className="mt-4">
      <div className="mt-2 flex flex-col items-center">
        <img src={teamMember.image} alt="Photo of officer" className="flex justify-center" />
        <h4 className="font-bold sm:text-lg text-primary-focus">{teamMember.name}</h4>
        <p className="font-semibold">{teamMember.title}</p>
        <p className="mt-2 px-2 text-center">{teamMember.desc}</p>
        <div className="flex flex-row gap-4 mt-4 justify-center items-center">
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
