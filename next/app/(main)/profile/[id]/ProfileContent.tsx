"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Github,
    Linkedin,
    ExternalLink,
    Pencil,
    Trophy,
    Calendar,
    Briefcase,
    FileText,
    AlertCircle,
    Sparkles,
    X,
    Save,
    Loader2,
    Star,
    Zap,
    Target,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { getImageUrl, isS3Key } from "@/lib/s3Utils";
import { useProfileImage } from "@/contexts/ProfileImageContext";
import ImageUpload from "@/components/common/ImageUpload";

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
    profileImageKey: string | null;
    graduationTerm: "SPRING" | "SUMMER" | "FALL" | null;
    graduationYear: number | null;
    major: string | null;
    coopSummary: string | null;
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
        return { label: "Membership", detail: reason.trim() };
    }
    const detail = rest.join(":").trim();
    return { label: first.trim() || "Membership", detail: detail || reason.trim() };
}

function githubUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("github.com")) return `https://${val}`;
    return `https://github.com/${val}`;
}

function linkedinUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("linkedin.com")) return `https://${val}`;
    return `https://linkedin.com/in/${val}`;
}

function prettifyTerm(term: "SPRING" | "SUMMER" | "FALL" | null): string {
    if (!term) return "Not set";
    if (term === "SPRING") return "Spring";
    if (term === "SUMMER") return "Summer";
    return "Fall";
}

function extractLinkedInUsername(val: string): string {
    if (!val) return "";
    try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        const parts = url.pathname.replace(/\/$/, "").split("/");
        const inIdx = parts.indexOf("in");
        if (inIdx !== -1 && parts[inIdx + 1]) return parts[inIdx + 1];
        return parts[parts.length - 1] || val;
    } catch {
        return val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");
    }
}

function extractGitHubUsername(val: string): string {
    if (!val) return "";
    try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
        return parts[0] || val;
    } catch {
        return val.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "").replace(/\/$/, "");
    }
}

const DEFAULT_IMAGE = "https://source.boringavatars.com/beam/";

// --- Quest field definitions ---
const QUEST_FIELDS = [
    { key: "graduationTerm", label: "Graduation Term", icon: GraduationCap, points: 20 },
    { key: "graduationYear", label: "Graduation Year", icon: Calendar, points: 20 },
    { key: "major", label: "Major", icon: Briefcase, points: 20 },
    { key: "gitHub", label: "GitHub", icon: Github, points: 20 },
    { key: "linkedIn", label: "LinkedIn", icon: Linkedin, points: 20 },
] as const;

const TOTAL_QUEST_POINTS = QUEST_FIELDS.reduce((sum, f) => sum + f.points, 0);

interface ProfileContentProps {
    userId: string;
    children?: React.ReactNode;
}

export default function ProfileContent({ userId, children }: ProfileContentProps) {
    const { status: sessionStatus, update: updateSession } = useSession();
    const router = useRouter();
    const { setProfileImage } = useProfileImage();

    // If user signs out while viewing this page, redirect home.
    // (Initial unauthenticated visits are already blocked server-side in page.tsx)
    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.replace("/");
        }
    }, [sessionStatus, router]);

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [handoverDocs, setHandoverDocs] = useState<HandoverDoc[]>([]);

    // --- Edit mode ---
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editLinkedIn, setEditLinkedIn] = useState("");
    const [editGitHub, setEditGitHub] = useState("");
    const [editGraduationTerm, setEditGraduationTerm] = useState<"SPRING" | "SUMMER" | "FALL" | "">("");
    const [editGraduationYear, setEditGraduationYear] = useState("");
    const [editMajor, setEditMajor] = useState("");
    const [editCoopSummary, setEditCoopSummary] = useState("");
    const [editImage, setEditImage] = useState(DEFAULT_IMAGE);

    const fetchProfile = useCallback(async () => {
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
            populateEditFields(data);

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
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    function populateEditFields(data: ProfileData) {
        setEditName(data.name);
        setEditDescription(data.description ?? "");
        setEditLinkedIn(extractLinkedInUsername(data.linkedIn ?? ""));
        setEditGitHub(extractGitHubUsername(data.gitHub ?? ""));
        setEditGraduationTerm(data.graduationTerm ?? "");
        setEditGraduationYear(data.graduationYear ? String(data.graduationYear) : "");
        setEditMajor(data.major ?? "");
        setEditCoopSummary(data.coopSummary ?? "");
        setEditImage(data.image ?? DEFAULT_IMAGE);
    }

    function enterEditMode() {
        if (profile) populateEditFields(profile);
        setEditing(true);
    }

    function cancelEdit() {
        if (profile) populateEditFields(profile);
        setEditing(false);
    }

    async function handleSave() {
        if (!profile) return;
        setSaving(true);
        try {
            const payload: Record<string, unknown> = { id: profile.id };

            if (editName !== profile.name) payload.name = editName;
            if (editDescription !== (profile.description ?? "")) payload.description = editDescription;

            const originalLi = extractLinkedInUsername(profile.linkedIn ?? "");
            const originalGh = extractGitHubUsername(profile.gitHub ?? "");
            if (editLinkedIn !== originalLi) payload.linkedIn = editLinkedIn;
            if (editGitHub !== originalGh) payload.gitHub = editGitHub;
            if (editGraduationTerm !== (profile.graduationTerm ?? "")) {
                payload.graduationTerm = editGraduationTerm || null;
            }
            const originalGraduationYear = profile.graduationYear ? String(profile.graduationYear) : "";
            if (editGraduationYear !== originalGraduationYear) {
                payload.graduationYear = editGraduationYear ? Number(editGraduationYear) : null;
            }
            if (editMajor !== (profile.major ?? "")) payload.major = editMajor;
            if (editCoopSummary !== (profile.coopSummary ?? "")) payload.coopSummary = editCoopSummary;

            if (editImage !== (profile.image ?? DEFAULT_IMAGE)) {
                if (editImage === DEFAULT_IMAGE) {
                    payload.image = null;
                } else {
                    payload.image = isS3Key(editImage) ? editImage : profile.profileImageKey ?? editImage;
                }
            }

            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.text()) || "Save failed");

            const updated = await res.json();

            // Refresh NextAuth session so all session-based consumers update
            await updateSession({
                name: updated.name,
                email: updated.email,
                image: updated.image ?? null,
            });

            // Update global profile image context — this propagates to navbar, etc. instantly
            const resolvedImage = updated.image ? getImageUrl(updated.image) : null;
            setProfileImage(resolvedImage);

            // Refetch the profile to get the fully resolved data
            const profileRes = await fetch(`/api/user/${userId}/profile`);
            if (profileRes.ok) {
                const freshProfile: ProfileData = await profileRes.json();
                setProfile(freshProfile);
                populateEditFields(freshProfile);
            }

            setEditing(false);

            if (updated.membershipAwarded) {
                const awardLabel = [updated.awardTerm, updated.awardYear].filter(Boolean).join(" ");
                toast.success(`Profile saved! Membership awarded${awardLabel ? ` for ${awardLabel}` : ""}!`, {
                    icon: <Star className="h-5 w-5 text-yellow-500" />,
                    duration: 5000,
                });
            } else if (updated.membershipRevoked) {
                toast.warning("Profile saved. Your profile-completion membership was revoked because required fields are now missing.", {
                    duration: 6000,
                });
            } else {
                toast.success("Profile updated!");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    // Show skeleton while session is loading or while redirecting after sign-out
    if (sessionStatus === "loading" || sessionStatus === "unauthenticated") return <ProfileSkeleton />;

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

    const profileImageUrl = getImageUrl(profile.image);
    const hasImage = profileImageUrl !== DEFAULT_IMAGE;

    // Quest scoring
    const fieldComplete = (key: string): boolean => {
        switch (key) {
            case "graduationTerm": return !!profile.graduationTerm;
            case "graduationYear": return !!profile.graduationYear;
            case "major": return !!profile.major?.trim();
            case "gitHub": return !!profile.gitHub?.trim();
            case "linkedIn": return !!profile.linkedIn?.trim();
            default: return false;
        }
    };
    const earnedPoints = QUEST_FIELDS.reduce((sum, f) => sum + (fieldComplete(f.key) ? f.points : 0), 0);
    const allQuestComplete = earnedPoints === TOTAL_QUEST_POINTS;

    return (
        <Card depth={1} className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
            {/* ── Hero banner ── */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-center">
                    {/* Avatar — in edit mode, clickable via ImageUpload */}
                    {editing ? (
                        <div className="shrink-0">
                            <ImageUpload
                                value={editImage === DEFAULT_IMAGE ? null : editImage}
                                onChange={(img) => setEditImage(img ?? DEFAULT_IMAGE)}
                                initials={getInitials(editName || profile.name)}
                                avatarSize="h-28 w-28 sm:h-32 sm:w-32"
                                compact
                                showRemove={editImage !== DEFAULT_IMAGE && editImage !== (profile.image ?? DEFAULT_IMAGE)}
                            />
                        </div>
                    ) : (
                        <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-background shadow-lg shrink-0">
                            {hasImage ? (
                                <AvatarImage src={profileImageUrl} alt={profile.name} />
                            ) : null}
                            <AvatarFallback className="text-3xl font-bold">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}

                    {/* Identity block */}
                    <div className="flex flex-col items-center sm:items-start gap-1 pb-1 flex-1 min-w-0">
                        {editing ? (
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-2xl font-bold font-heading max-w-sm"
                                placeholder="Your name"
                            />
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-bold font-heading tracking-tight">
                                    {profile.name}
                                </h1>
                                {activeRoles.map((role) => (
                                    <Badge key={role.id}>{role.position.title}</Badge>
                                ))}
                            </div>
                        )}

                        {profile.email && !editing && (
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                        )}

                        {/* Stats + social row (view mode) */}
                        {!editing && (
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
                                        <span className="hidden sm:inline">{extractGitHubUsername(profile.gitHub)}</span>
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
                        )}
                    </div>

                    {/* Edit / Save / Cancel buttons */}
                    {profile.isOwner && (
                        <div className="flex gap-2 shrink-0">
                            {editing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEdit}
                                        disabled={saving}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1.5" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        ) : (
                                            <Save className="h-3.5 w-3.5 mr-1.5" />
                                        )}
                                        {saving ? "Saving..." : "Save"}
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" size="sm" onClick={enterEditMode}>
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bio ── */}
            {editing ? (
                <div>
                    <Label htmlFor="edit-description" className="text-sm font-medium mb-1.5 block">Bio</Label>
                    <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Tell people a bit about yourself..."
                        rows={3}
                        className="max-w-prose"
                    />
                </div>
            ) : profile.description ? (
                <p className="text-foreground/80 leading-relaxed max-w-prose">
                    {profile.description}
                </p>
            ) : null}

            {/* ── Profile Quest (Nate Parrott-inspired gamification) ── */}
            {profile.isOwner && (
                <div>
                    <Card
                        depth={2}
                        className={allQuestComplete
                            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 p-5"
                            : "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5"
                        }
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 mt-0.5">
                                {allQuestComplete ? (
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-sm">
                                        {allQuestComplete ? "Quest Complete!" : "Profile Quest"}
                                    </h3>
                                    <Badge variant={allQuestComplete ? "default" : "secondary"} className="text-[10px]">
                                        {earnedPoints} / {TOTAL_QUEST_POINTS} XP
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    {allQuestComplete
                                        ? "All fields complete. You've unlocked your profile-completion membership!"
                                        : "Complete your profile to earn XP and unlock your membership. Each field unlocked gets you closer!"}
                                </p>

                                {/* XP bar */}
                                <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-full ${allQuestComplete ? "bg-emerald-500" : "bg-primary"}`}
                                        style={{ width: `${(earnedPoints / TOTAL_QUEST_POINTS) * 100}%` }}
                                    />
                                </div>

                                {/* Field checklist */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {QUEST_FIELDS.map((field) => {
                                        const complete = fieldComplete(field.key);
                                        const Icon = field.icon;
                                        return (
                                            <div
                                                key={field.key}
                                                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                                    complete
                                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-muted/50 text-muted-foreground"
                                                }`}
                                            >
                                                {complete ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                ) : (
                                                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                                )}
                                                <span className={complete ? "line-through opacity-70" : ""}>
                                                    {field.label}
                                                </span>
                                                <span className="ml-auto font-mono text-[10px] opacity-60">
                                                    +{field.points} XP
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {!allQuestComplete && !editing && (
                                    <Button
                                        size="sm"
                                        className="mt-3"
                                        onClick={enterEditMode}
                                    >
                                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                                        Complete Quest
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── Inline edit fields (visible only in edit mode) ── */}
            {editing && (
                <div className="flex flex-col gap-5">
                    <hr className="border-border" />
                    <h2 className="text-lg font-heading font-semibold">Edit Details</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-graduationTerm">Graduation Term</Label>
                            <select
                                id="edit-graduationTerm"
                                value={editGraduationTerm}
                                onChange={(e) => setEditGraduationTerm(e.target.value as "SPRING" | "SUMMER" | "FALL" | "")}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Select term</option>
                                <option value="SPRING">Spring</option>
                                <option value="SUMMER">Summer</option>
                                <option value="FALL">Fall</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-graduationYear">Graduation Year</Label>
                            <Input
                                id="edit-graduationYear"
                                type="number"
                                min={2000}
                                max={2100}
                                value={editGraduationYear}
                                onChange={(e) => setEditGraduationYear(e.target.value)}
                                placeholder="2026"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-major">Major</Label>
                            <Input
                                id="edit-major"
                                value={editMajor}
                                onChange={(e) => setEditMajor(e.target.value)}
                                placeholder="Software Engineering"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-coopSummary">Co-op Summary (Optional)</Label>
                            <Input
                                id="edit-coopSummary"
                                value={editCoopSummary}
                                onChange={(e) => setEditCoopSummary(e.target.value)}
                                placeholder="Current or recent co-op"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-gitHub">GitHub</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                                    github.com/
                                </span>
                                <Input
                                    id="edit-gitHub"
                                    value={editGitHub}
                                    onChange={(e) => setEditGitHub(e.target.value)}
                                    placeholder="username"
                                    className="neo:rounded-l-none clean:rounded-l-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="edit-linkedIn">LinkedIn</Label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                                    linkedin.com/in/
                                </span>
                                <Input
                                    id="edit-linkedIn"
                                    value={editLinkedIn}
                                    onChange={(e) => setEditLinkedIn(e.target.value)}
                                    placeholder="username"
                                    className="neo:rounded-l-none clean:rounded-l-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <hr className="border-border" />

            {/* ── Content sections ── */}
            <div className="flex flex-col gap-6">
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

                    {children}
                </div>

                <div className="flex flex-col gap-6">
                    {/* Academic metadata (view mode only) */}
                    {!editing && (
                        <section>
                            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                Academic Snapshot
                            </h2>
                            <Card depth={2} className="p-4">
                                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Graduation:</span>{" "}
                                        <span className="font-medium">
                                            {profile.graduationTerm && profile.graduationYear
                                                ? `${prettifyTerm(profile.graduationTerm)} ${profile.graduationYear}`
                                                : "Not set"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Major:</span>{" "}
                                        <span className="font-medium">{profile.major?.trim() || "Not set"}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-muted-foreground">Co-op Summary:</span>{" "}
                                        <span className="font-medium">{profile.coopSummary?.trim() || "Not set"}</span>
                                    </div>
                                </div>
                            </Card>
                        </section>
                    )}

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
                                Memberships
                            </h2>
                            <Card depth={2} className="p-4">
                                <div className="flex flex-col gap-2.5">
                                    {profile.memberships.map((m) => {
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
                                        );
                                    })}
                                </div>
                            </Card>
                        </section>
                    )}
                </div>
            </div>

            {/* Handover docs for active officer positions */}
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
