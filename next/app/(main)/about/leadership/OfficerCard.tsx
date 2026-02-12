import { Github, Linkedin, Mail } from "lucide-react";
import { TeamMember } from "./team";
import Avatar from "boring-avatars";
import { Card } from "@/components/ui/card";
import { getImageUrl } from "@/lib/s3Utils";

const DEFAULT_IMAGE = "https://source.boringavatars.com/beam/";

// Expect these to live under: next/public/assets/officers/*.jpg
const OFFICER_STATIC_PHOTOS: Record<string, string> = {
  // S3 KEYS (NOT "/assets/..."):
  president: "assets/officers/president.jpg",
  vice_president: "assets/officers/vice_president.jpg",
  treasurer: "assets/officers/treasurer.jpg",
  secretary: "assets/officers/secretary.jpg",
  tech_head: "assets/officers/tech_head.jpg",
  events_officer: "assets/officers/events_officer.jpg",
  lab_ops: "assets/officers/lab_ops.jpg",
  marketing_officer: "assets/officers/marketing_officer.jpg",
  mentoring_officer: "assets/officers/mentoring_officer.jpg",
  projects_head: "assets/officers/projects_head.jpg",
  talks_officer: "assets/officers/talks_officer.jpg",
  lab_division_manager: "assets/officers/lab_division_manager.jpg",
  web_division_manager: "assets/officers/web_division_manager.jpg",
  services_division_manager: "assets/officers/services_division_manager.jpg",
};

function normalizeKey(val: string) {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getOfficerPhoto(teamMember: TeamMember) {
  const titleKey = normalizeKey(teamMember.title ?? "");
  const staticPhoto = titleKey ? OFFICER_STATIC_PHOTOS[titleKey] : undefined;
  if (staticPhoto) return getImageUrl(staticPhoto);

  if (teamMember.image && teamMember.image !== DEFAULT_IMAGE) {
    return getImageUrl(teamMember.image);
  }

  return null;
}

function ensureGithubUrl(val: string): string {
  if (val.startsWith("https://") || val.startsWith("http://")) return val;
  if (val.includes("github.com")) return `https://${val}`;
  return `https://github.com/${val}`;
}

function ensureLinkedinUrl(val: string): string {
  if (val.startsWith("https://") || val.startsWith("http://")) return val;
  if (val.includes("linkedin.com")) return `https://${val}`;
  return `https://linkedin.com/in/${val}`;
}

interface OfficerCardProps {
  teamMember: TeamMember;
  children?: React.ReactNode;
}

export default function OfficerCard({ teamMember, children }: OfficerCardProps) {
  const officerImage = getOfficerPhoto(teamMember);

  return (
    <Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center text-center h-full">
      <div className="mb-3">
        {officerImage ? (
          <img
            src={officerImage}
            alt={`Photo of ${teamMember.name}`}
            className="rounded-full object-cover w-24 h-24"
            onError={(e) => {
              console.log("[OfficerCard] failed src:", officerImage);
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Avatar
            size={96}
            name={teamMember.name || "default"}
            colors={["#426E8C", "#5289AF", "#86ACC7"]}
            variant="beam"
          />
        )}
      </div>

      {/* Name & Title */}
      <h4 className="font-bold text-lg text-foreground">{teamMember.name}</h4>
      <p className="text-sm font-semibold text-primary mb-2">{teamMember.title}</p>

      {/* Description */}
      <p className="text-sm text-muted-foreground flex-grow line-clamp-3">
        {teamMember.desc}
      </p>

      {/* Contact Icons */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-border w-full justify-center">
        {teamMember.linkedin && (
          <a
            href={ensureLinkedinUrl(teamMember.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        )}
        {teamMember.github && (
          <a
            href={ensureGithubUrl(teamMember.github)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
        )}
        {teamMember.email && (
          <a
            href={`mailto:${teamMember.email}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Edit/Replace buttons slot */}
      {children && (
        <div className="mt-3 pt-3 border-t border-border w-full">
          {children}
        </div>
      )}
    </Card>
  );
}
