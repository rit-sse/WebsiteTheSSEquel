import { GitHubIcon, LinkedInIcon, EmailIcon } from "../../../components/common/Icons";
import { AlumniMember } from "./alumni";
import Avatar from 'boring-avatars';
import Image from "next/image";
import { Card } from "@/components/ui/card";

interface AlumniCardProps {
  alumniMember: AlumniMember;
  children?: React.ReactNode;
}

export default function AlumniCard({ alumniMember, children }: AlumniCardProps) {
  return (
    <Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center text-center h-full">
      {/* Avatar */}
      <div className="mb-3">
        {alumniMember.image != "https://source.boringavatars.com/beam/" ? (
          <Image 
            src={alumniMember.image} 
            alt={`Photo of ${alumniMember.name}`}
            width={96}
            height={96}
            className="rounded-full object-cover w-24 h-24"
            unoptimized
          /> 
        ) : (
          <Avatar size={96} name={alumniMember.name || "default"} colors={["#426E8C", "#5289AF", "#86ACC7"]} variant="beam"/>
        )}
      </div>

      {/* Name */}
      <h4 className="font-bold text-lg text-foreground">{alumniMember.name}</h4>
      
      {/* Quote */}
      {alumniMember.quote && (
        <p className="text-sm italic text-muted-foreground mb-2">&quot;{alumniMember.quote}&quot;</p>
      )}
      
      {/* Previous Roles */}
      <p className="text-sm font-semibold text-primary">{alumniMember.previous_roles}</p>
      
      {/* End Date */}
      <p className="text-xs text-muted-foreground mt-1 flex-grow">{alumniMember.end_date}</p>

      {/* Contact Icons */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-border w-full justify-center">
        {alumniMember.linkedin && (
          <a 
            href={alumniMember.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <LinkedInIcon />
          </a>
        )}
        {alumniMember.github && (
          <a 
            href={alumniMember.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <GitHubIcon />
          </a>
        )}
        {alumniMember.email && (
          <a 
            href={`mailto:${alumniMember.email}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <EmailIcon />
          </a>
        )}
      </div>

      {/* Edit/Delete buttons slot */}
      {children && (
        <div className="mt-3 pt-3 border-t border-border w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
