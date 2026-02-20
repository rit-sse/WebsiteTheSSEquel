import { GitHubIcon, LinkedInIcon } from "@/components/common/Icons";
import { CommitteeMemberProp } from "./member";
import { ensureGithubUrl } from "@/lib/utils";
import { MailIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function MemberCard({ member }: CommitteeMemberProp) {
  return ( 
    <Card depth={2} className="max-w-xs sm:max-w-sm p-4 pt-2 flex-grow hover:border-0">
      <div className="mt-2 flex flex-col items-center">
          <a href={`../profile/${member.id}`}>
          <h4 className="font-bold sm:text-lg text-primary-focus hover:text-primary">
            {member.name}
          </h4>
          </a>
        {/* Contact Icons */}
        <div className="flex gap-3 mt-4 pt-3 border-t border-border w-full justify-center">
          {member.linkedIn && (
            <a
              href={ensureGithubUrl(member.linkedIn)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <LinkedInIcon/>
            </a>
          )}
          {member.gitHub && (
            <a
              href={ensureGithubUrl(member.gitHub)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <GitHubIcon/>
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <MailIcon/>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}