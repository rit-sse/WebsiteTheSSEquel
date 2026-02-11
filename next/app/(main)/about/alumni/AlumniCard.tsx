import { Github, Linkedin, Mail } from "lucide-react";
import { AlumniMember } from "./alumni";
import Avatar from 'boring-avatars';
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { BRAND_AVATAR_COLORS } from "@/lib/theme/colors";

interface AlumniCardProps {
  alumniMember: AlumniMember;
  children?: React.ReactNode;
}

export default function AlumniCard({ alumniMember, children }: AlumniCardProps) {
  return (
    <Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center text-center h-full">
      {/* Avatar */}
      <div className="mb-3">
        {alumniMember.image && alumniMember.image !== "https://source.boringavatars.com/beam/" ? (
          <Image 
            src={alumniMember.image} 
            alt={`Photo of ${alumniMember.name}`}
            width={96}
            height={96}
            className="rounded-full object-cover w-24 h-24"
            unoptimized
          /> 
        ) : (
          <Avatar size={96} name={alumniMember.name || "default"} colors={[...BRAND_AVATAR_COLORS]} variant="beam"/>
        )}
      </div>

      {/* Name */}
      <h4 className="font-bold text-lg text-foreground">{alumniMember.name}</h4>
      <div className="accent-rule accent-rule-purple mt-1 mb-2" aria-hidden="true" />
      
      {/* Quote */}
      {alumniMember.quote && (
        <p className="text-sm italic text-muted-foreground mb-2">&quot;{alumniMember.quote}&quot;</p>
      )}
      
      {/* Previous Roles */}
      <p className="text-sm font-semibold text-chart-2 dark:text-chart-8">{alumniMember.previous_roles}</p>
      <div className="h-0.5 w-[94%] bg-chart-4/35 rounded-full my-2" aria-hidden="true" />
      
      {/* End Date */}
      <p className="text-xs text-muted-foreground mt-1 flex-grow">{alumniMember.end_date}</p>

      {/* Contact Icons */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-chart-4/40 w-full justify-center">
        {alumniMember.linkedin && (
          <a 
            href={alumniMember.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {alumniMember.github && (
          <a 
            href={alumniMember.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        )}
        {alumniMember.email && (
          <a 
            href={`mailto:${alumniMember.email}`}
            className="text-muted-foreground hover:text-chart-4 transition-colors"
          >
            <Mail className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Edit/Delete buttons slot */}
      {children && (
        <div className="mt-3 pt-3 border-t border-chart-4/40 w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
