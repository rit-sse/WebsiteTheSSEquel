import { getSSEMembers } from "@/lib/github/search";
import MemberCard from "./MemberCard";
import { Card } from "@/components/ui/card";

export default async function Credits() {
  const members = await getSSEMembers();
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
      <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-center text-primary">Credits</h1>
            <div className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                <p>
                    Cementing the people who made this website possible over the years.
                </p>
            </div>
          </div>
          <div className="flex justify-center flex-wrap gap-4">
          {members.map( (member, idx) => (
            <MemberCard key={idx} member={member}></MemberCard>
          ))}
          </div>
      </Card>
      </div>
    </section>
  );
}