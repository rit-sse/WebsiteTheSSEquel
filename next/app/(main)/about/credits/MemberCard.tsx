import { CommitteeMemberProp } from "./member";
import { NeoCard } from "@/components/ui/neo-card";

export default function MemberCard({ member }: CommitteeMemberProp) {
  return ( 
    <NeoCard className="max-w-xs sm:max-w-sm p-4 pt-2 flex-grow">
      <div className="mt-2 flex flex-col items-center">
        <h4 className="font-bold sm:text-lg text-primary-focus">
            {member.name}
        </h4>
        <p className="font-semibold">
            {member.role && member.role}
        </p>
        <p className="font-semibold">
            {member.active_date}
        </p>
      </div>
      <div className="flex flex-col gap-1 justify-center items-center">
        {member.features && member.features.slice(0,2).map((feature, ind) => (
            <span key={ind}>
                {feature}
            </span>
        ))}
      </div>
    </NeoCard>
  );
}