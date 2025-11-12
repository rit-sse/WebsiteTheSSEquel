import { CommitteeMember } from "./member";
import MemberCard from "./MemberCard";

//temporary testing
const contributors: CommitteeMember[] = [
    {name: "Name Lastname", role: "Role", active_date: "Spring 2025", features: ["One page", "2 page", "red page"]},
    {name: "Another Name", role: "Another Role", active_date: "Fall 2023", features: ["blue page"]},
    {name: "Last Name", role: "A very long role name", active_date: "Summer 1009"}
]

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
            {contributors && contributors.map(member => (
                <MemberCard member={member}></MemberCard>
            ))}
            </div>
    </section>
    </>
  );
}