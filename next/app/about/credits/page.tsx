import { PersonCardBuilder } from "@/components/common/personcard/PersonCard";
import { CommitteeMember } from "./member";

//Move to file elsewhere
const contributors: CommitteeMember[] = [
    {name: "Name Lastname", role: "Role", active_date: "Spring 2025", features: ["One page", "2 page", "red page"]},
    {name: "Another Name", role: "Another Role", active_date: "Fall 2023", features: ["blue page"]},
    {name: "Last Name", role: "A very long role name", active_date: "Summer 1009"}
];

const personCardBuilder = new PersonCardBuilder<CommitteeMember>()
        .buildTitle("name")
        .buildBoldInfo("role")
        .buildBoldInfo("active_date")
        .buildInfoList("features");

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
      <div className="w-full flex flex-row flex-wrap justify-center gap-5">
      {contributors && contributors.map(member => (
          personCardBuilder.create(member)
      ))}
      </div>
    </section>
    </>
  );
}