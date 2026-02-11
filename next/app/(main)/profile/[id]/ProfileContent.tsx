"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Linkedin, ExternalLink, Pencil, Trophy, Calendar, Briefcase, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { getImageUrl } from "@/lib/s3Utils";

interface HandoverDoc {
    id: number;
    positionId: number;
    content: string;
    updatedAt: string;
    position: { title: string };
}

interface ProfileData {
    id: number;
    name: string;
    email?: string;
    image: string;
    linkedIn: string | null;
    gitHub: string | null;
    description: string | null;
    membershipCount: number;
    memberships: {
        id: number;
        reason: string;
        dateGiven: string;
    }[];
    projects: {
        id: number;
        title: string;
        description: string;
        repoLink: string | null;
    }[];
    officerRoles: {
        id: number;
        is_active: boolean;
        start_date: string;
        end_date: string;
        position_id: number;
        position: { title: string };
    }[];
    isOwner: boolean;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function parseMembershipReason(reason: string): { label: string; detail: string } {
    const [first, ...rest] = reason.split(":");
    if (rest.length === 0) {
        return {
            label: "Membership",
            detail: reason.trim(),
        };
    }
    const detail = rest.join(":").trim();
    return {
        label: first.trim() || "Membership",
        detail: detail || reason.trim(),
    };
}

/** Normalize a github value to a full URL */
function githubUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("github.com")) return `https://${val}`;
    return `https://github.com/${val}`;
}

/** Normalize a linkedin value to a full URL */
function linkedinUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("linkedin.com")) return `https://${val}`;
    return `https://linkedin.com/in/${val}`;
}

const DEFAULT_IMAGE = "https://source.boringavatars.com/beam/";

interface ProfileContentProps {
    userId: string;
    children?: React.ReactNode;
}

export default function ProfileContent({ userId, children }: ProfileContentProps) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [handoverDocs, setHandoverDocs] = useState<HandoverDoc[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/user/${userId}/profile`);
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        setError("You do not have permission to view this profile.");
                    } else if (res.status === 404) {
                        setError("User not found.");
                    } else {
                        setError("Failed to load profile.");
                    }
                    return;
                }
                const data: ProfileData = await res.json();
                setProfile(data);

                // Fetch handover docs for active officer roles
                const activePositionIds = data.officerRoles
                    .filter((r) => r.is_active)
                    .map((r) => r.position_id);

                if (activePositionIds.length > 0) {
                    const docs = await Promise.all(
                        activePositionIds.map(async (pid) => {
                            try {
                                const r = await fetch(`/api/handover/${pid}`);
                                if (r.ok) return (await r.json()) as HandoverDoc;
                            } catch { /* ignore */ }
                            return null;
                        })
                    );
                    setHandoverDocs(docs.filter((d): d is HandoverDoc => d !== null));
                }
            } catch {
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    if (loading) return <ProfileSkeleton />;

    if (error || !profile) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground text-lg">{error ?? "Profile not found."}</p>
            </div>
        );
    }

    const activeRoles = profile.officerRoles.filter((r) => r.is_active);
    const pastRoles = profile.officerRoles.filter((r) => !r.is_active);

    // Use getImageUrl to handle both S3 keys and full URLs
    const profileImageUrl = getImageUrl(profile.image);
    const hasImage = profileImageUrl !== DEFAULT_IMAGE;

    return (
        <Card depth={1} className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
            {/* ── Hero banner ── */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-center">
                        {/* Avatar */}
                        <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-background shadow-lg">
                            {hasImage ? (
                                <AvatarImage src={profileImageUrl} alt={profile.name} />
                            ) : null}
                            <AvatarFallback className="text-3xl font-bold">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Identity block */}
                        <div className="flex flex-col items-center sm:items-start gap-1 pb-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-bold font-heading tracking-tight">
                                    {profile.name}
                                </h1>
                                {activeRoles.map((role) => (
                                    <Badge key={role.id}>{role.position.title}</Badge>
                                ))}
                            </div>

                            {profile.email && (
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                            )}

                            {/* Stats + social row */}
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Trophy className="h-4 w-4" />
                                    <span>
                                        {profile.membershipCount}{" "}
                                        membership{profile.membershipCount !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {profile.gitHub && (
                                    <a
                                        href={githubUrl(profile.gitHub)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Github className="h-4 w-4" />
                                        <span className="hidden sm:inline">{profile.gitHub.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>
                                    </a>
                                )}

                                {profile.linkedIn && (
                                    <a
                                        href={linkedinUrl(profile.linkedIn)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                        <span className="hidden sm:inline">LinkedIn</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Edit button (owner only) */}
                        {profile.isOwner && (
                            <Button asChild variant="outline" size="sm" className="shrink-0">
                                <Link href="/settings">
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Profile
                                </Link>
                            </Button>
                        )}
                    </div>
            </div>

            {/* ── Bio ── */}
            {profile.description && (
                <p className="text-foreground/80 leading-relaxed px-2 sm:px-6 max-w-prose">
                    {profile.description}
                </p>
            )}

            <hr className="border-border" />

            {/* ── Content sections ── */}
            <div className="flex flex-col gap-6">
                {/* Main sections */}
                <div className="flex flex-col gap-6">
                    {/* Projects */}
                    {profile.projects.length > 0 && (
                        <section>
                            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                Projects
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {profile.projects.map((project) => (
                                    <Card key={project.id} depth={2} className="p-4 group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm truncate">
                                                    {project.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    {project.description}
                                                </p>
                                            </div>
                                            {project.repoLink && (
                                                <a
                                                    href={project.repoLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-foreground shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Slot for role-specific children */}
                    {children}
                </div>

                {/* Supporting sections */}
                <div className="flex flex-col gap-6">
                    {/* Officer History */}
                    {pastRoles.length > 0 && (
                        <section>
                            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Officer History
                            </h2>
                            <Card depth={2} className="p-4">
                                <div className="flex flex-col gap-2.5">
                                    {pastRoles.map((role) => (
                                        <div key={role.id} className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{role.position.title}</span>
                                            <span className="text-muted-foreground text-xs tabular-nums">
                                                {new Date(role.start_date).getFullYear()}&ndash;{new Date(role.end_date).getFullYear()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </section>
                    )}

                    {/* Recent memberships */}
                    {profile.memberships.length > 0 && (
                        <section>
                            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                Recent Memberships
                            </h2>
                            <Card depth={2} className="p-4">
                                <div className="flex flex-col gap-2.5">
                                    {profile.memberships.slice(0, 8).map((m) => {
                                        const parsed = parseMembershipReason(m.reason);
                                        return (
                                        <div key={m.id} className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                                    {parsed.label}
                                                </Badge>
                                                <span className="text-muted-foreground text-xs tabular-nums shrink-0">
                                                    {new Date(m.dateGiven).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-medium leading-snug">
                                                {parsed.detail}
                                            </p>
                                        </div>
                                    )})}
                                    {profile.memberships.length > 8 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            +{profile.memberships.length - 8} more
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </section>
                    )}
                </div>
            </div>

            {/* Handover docs for active officer positions — full width */}
            {handoverDocs.length > 0 && handoverDocs.map((doc) => (
                <section key={doc.id}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.position.title} Handover
                        </h2>
                        {profile.isOwner && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/positions/${doc.positionId}/handover`}>
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                    <Card depth={2} className="p-5">
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{doc.content}</ReactMarkdown>
                        </div>
                    </Card>
                </section>
            ))}
        </Card>
    );
}

function ProfileSkeleton() {
    return (
        <Card depth={1} className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
            <div className="rounded-xl bg-muted/50 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="flex flex-col gap-3 flex-1 pb-1">
                        <Skeleton className="h-8 w-56" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
        </Card>
    );
}
