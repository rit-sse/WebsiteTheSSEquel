import { PersonCard, Person, PersonCardBuilder } from "@/components/common/personcard/PersonCard";
import { toPerson } from "./member";
import { keyof } from "zod";

//Move to file elsewhere
const contributors: Person[] = [
    {name: "Name Lastname", role: "Role", active_date: "Spring 2025", features: ["One page", "2 page", "red page"]},
    {name: "Another Name", role: "Another Role", active_date: "Fall 2023", features: ["blue page"]},
    {name: "Last Name", role: "A very long role name", active_date: "Summer 1009"}
].map(toPerson);

const personCardBuilder = new PersonCardBuilder()
        .buildTitle("name")
        .buildBoldInfo("role")
        .buildBoldInfo("active_date");
        //.buildInfo("features");

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
          personCardBuilder.create(member)
      ))}
      </div>
    </section>
    </>
  );
}