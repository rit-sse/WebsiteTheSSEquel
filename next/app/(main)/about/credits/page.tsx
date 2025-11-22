import { contributors } from "./contributingMembers";
import MemberCard from "./MemberCard";

export default function Credits() {
  return (
    <>
    <section className="text-page-structure">
            <h1>Credits</h1>
            <div className="subtitle-structure">
                <p>
                    Cementing the people who made this website possible over the years.
                </p>
            </div>
            <div className="flex">
            {contributors.map( (member, idx) => (
                <MemberCard key={idx} member={member}></MemberCard>
            ))}
            </div>
    </section>
    </>
  );
}