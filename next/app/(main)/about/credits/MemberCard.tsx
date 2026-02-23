import { CommitteeMemberProp } from "./member";
import { ensureGithubUrl } from "@/lib/utils";
import { Linkedin, Github, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Avatar from "boring-avatars";

export default async function MemberCard({ member }: CommitteeMemberProp) {
  const gradLabel = member.graduationTerm && member.graduationYear
    ? `${member.graduationTerm.charAt(0).toUpperCase()}${member.graduationTerm.slice(1).toLowerCase()} '${String(member.graduationYear).slice(-2)}`
    : null;

  return (
    <Card depth={2} className="w-52 p-4 flex flex-col items-center gap-2 hover:border-0">
      {/* Avatar */}
      <div className="mt-1">
        {member.profileImageUrl ? (
          <Image
            src={member.profileImageUrl}
            alt={member.name}
            width={56}
            height={56}
            className="rounded-full object-cover w-14 h-14"
          />
        ) : (
          <Avatar size={56} name={member.name} variant="beam" />
        )}
      </div>

      {/* Name + officer title */}
      <div className="text-center">
        <h4 className="font-bold text-sm text-primary leading-tight">
          {member.name}
        </h4>
        {member.officerTitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
            {member.officerTitle}
          </p>
        )}
      </div>

      {/* Extra info */}
      {(member.major || gradLabel) && (
        <div className="text-center text-[11px] text-muted-foreground leading-snug">
          {member.major && <p>{member.major}</p>}
          {gradLabel && <p>{gradLabel}</p>}
        </div>
      )}

      {member.description && (
        <p className="text-[11px] text-muted-foreground text-center line-clamp-2 leading-snug">
          {member.description}
        </p>
      )}

      {/* Contact icons */}
      <div className="flex gap-3 pt-2 border-t border-border w-full justify-center mt-auto">
        {member.linkedIn && (
          <a
            href={ensureGithubUrl(member.linkedIn)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        {member.gitHub && (
          <a
            href={ensureGithubUrl(member.gitHub)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
      </div>
    </Card>
  );
}