'use client'

import { GitHubIcon } from "@/components/common/Icons";
import { CommitteeMemberProp } from "./member";
import { NeoCard } from "@/components/ui/neo-card";

export default function MemberCard({ member }: CommitteeMemberProp) {
  return ( 
    <NeoCard className="max-w-xs sm:max-w-sm p-4 pt-2 flex-grow">
      <div className="mt-2 flex flex-col items-center">
        <h4 className="font-bold sm:text-lg text-primary-focus">
          {member.name}
        </h4>
        <div className="flex gap-3 pt-3 border-t border-border w-full justify-center">
          {member.gitHub && (
            <a 
              href={"https://"+member.gitHub} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <GitHubIcon/>
            </a>
          )}
        </div>
      </div>
    </NeoCard>
  );
}