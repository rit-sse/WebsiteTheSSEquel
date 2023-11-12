import { GitHub, LinkedIn, Email } from "../../../components/common/Icons";
import { TeamMember } from "./team";

interface OfficerCardProps {
  teamMember: TeamMember;
}

export default function OfficerCard({ teamMember }: OfficerCardProps) {
  let iconColor: string = "";

  return (
    <div className="mt-4">
      <div className="w-24 h-24 mx-auto">
        <img src={teamMember.avatar} className="w-full h-full rounded-full" alt="" />
      </div>
      <div className="mt-2">
        <h4 className="font-bold sm:text-lg text-primary-focus">{teamMember.name}</h4>
        <p className="font-semibold">{teamMember.title}</p>
        <p className="mt-2 px-2">{teamMember.desc}</p>
        <div className="mt-4 flex justify-center gap-4 text-gray-400">
          <a href={teamMember.linkedin}>
            <LinkedIn color={iconColor} />
          </a>
          <a href={teamMember.github}>
            <GitHub color={iconColor} />
          </a>
          <a href={teamMember.email}>
            <Email color={iconColor} />
          </a>
        </div>
      </div>
    </div>
  );
}
