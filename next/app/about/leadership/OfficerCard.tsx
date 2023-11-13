import { GitHub, LinkedIn, Email } from "../../../components/common/Icons";
import { TeamMember } from "./team";

interface OfficerCardProps {
  teamMember: TeamMember;
}

export default function OfficerCard({ teamMember }: OfficerCardProps) {
  return (
    <div className="mt-4">
      <div className="w-24 h-24 mx-auto">
        <img src={teamMember.avatar} className="w-full h-full rounded-full" alt="" />
      </div>
      <div className="mt-2 flex flex-col items-center">
        <h4 className="font-bold sm:text-lg text-primary-focus">{teamMember.name}</h4>
        <p className="font-semibold">{teamMember.title}</p>
        <p className="mt-2 px-2 text-center">{teamMember.desc}</p>
        <div className="mt-4 flex gap-4">
          <a href={teamMember.linkedin}>
            <LinkedIn />
          </a>
          <a href={teamMember.github}>
            <GitHub />
          </a>
          <a href={teamMember.email}>
            <Email />
          </a>
        </div>
      </div>
    </div>
  );
}
