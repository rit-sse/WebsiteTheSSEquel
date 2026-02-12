import { Github, Linkedin, Mail } from "lucide-react";
import { TeamMember } from "./team";
import Avatar from 'boring-avatars';
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { BRAND_AVATAR_COLORS } from "@/lib/theme/colors";

interface OfficerCardProps {
  teamMember: TeamMember;
  children?: React.ReactNode;
}

export default function OfficerCard({ teamMember, children }: OfficerCardProps) {
  return (
    <Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center text-center h-full">
      {/* Avatar */}
      <div className="mb-3">
        {teamMember.image != "https://source.boringavatars.com/beam/" ? (
          <Image 
            src={teamMember.image} 
            alt={`Photo of ${teamMember.name}`} 
            width={96} 
            height={96} 
            className="rounded-full object-cover w-24 h-24"
          /> 
        ) : (
          <Avatar size={96} name={teamMember.name || "default"} colors={[...BRAND_AVATAR_COLORS]} variant="beam"/>
        )}
      </div>

      {/* Name & Title */}
      <h4 className="font-bold text-lg text-foreground">{teamMember.name}</h4>
      <div className="accent-rule accent-rule-teal accent-rule-animate mt-1 mb-2" aria-hidden="true" />
      <p className="text-sm font-semibold text-chart-2 dark:text-foreground mb-2">{teamMember.title}</p>
      <div className="h-0.5 w-[94%] bg-chart-4/35 rounded-full mb-3" aria-hidden="true" />
      
      {/* Description */}
      <p className="text-sm text-muted-foreground flex-grow line-clamp-3">{teamMember.desc}</p>
      
      {/* Contact Icons */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-chart-4/40 w-full justify-center">
        {teamMember.linkedin && (
          <a 
            href={teamMember.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {teamMember.github && (
          <a 
            href={teamMember.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        )}
        {teamMember.email && (
          <a 
            href={`mailto:${teamMember.email}`}
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Mail className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Edit/Replace buttons slot */}
      {children && (
        <div className="mt-3 pt-3 border-t border-chart-4/40 w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
