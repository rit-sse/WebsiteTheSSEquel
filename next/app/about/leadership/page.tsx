import OfficerCard from "./OfficerCard";
import { teamData, Team } from "./team";

export default function Leadership() {
  let team: Team = teamData;

  team.committee_heads.sort((a, b) => {
    if (a.title < b.title) {
      return -1;
    }
    return 1;
  });

  return (
    <>
      <section className="mt-16">
        <div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
          <div className="content-center">
            {/* Meet our team */}
            <div className="max-w-xl mx-auto">
              <h1
                className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
              >
                Meet our team
              </h1>
              <p className="mt-3 text-xl leading-8">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Lorem,
                ipsum dolor sit amet consectetur adipisicing elit. Lorem, ipsum
                dolor sit amet consectetur.
              </p>
            </div>
          </div>

          {/* Primary Officers */}
          <div className="my-20">
            <h3 className="text-xl font-extrabold text-primary-focus sm:text-3xl my-12">
              Primary Officers
            </h3>
            <div className="">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.primary_officers.map((member, idx) => (
                  <OfficerCard key={idx} teamMember={member} />
                ))}
              </div>
            </div>
          </div>
          {/* Committee Heads */}
          <div className="mt-20">
            <h3 className="text-xl font-extrabold text-primary-focus sm:text-3xl mb-12">
              Committee Heads
            </h3>
            <div className="">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.committee_heads.map((member, idx) => (
                  <OfficerCard key={idx} teamMember={member} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
