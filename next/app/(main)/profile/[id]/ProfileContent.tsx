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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { isS3Key, normalizeToS3Key } from "@/lib/s3Utils";
import { useProfileImage } from "@/contexts/ProfileImageContext";
import ImageUpload from "@/components/common/ImageUpload";
import AvailabilityGrid, { AvailabilitySlot } from "@/app/(main)/dashboard/mentoring/components/AvailabilityGrid";
import {
    CATEGORICAL_COLOR_COUNT,
    getCategoricalColorByIndex,
    getCategoricalColorFromSeed,
} from "@/lib/categoricalColors";

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
    mentorProfile: {
        id: number;
        isActive: boolean;
        expirationDate: string;
        availability: AvailabilitySlot[];
        shifts: {
            id: number;
            weekday: number;
            dayLabel: string;
            startHour: number;
            label: string;
        }[];
        mentoringHead: {
            id: number;
            name: string;
            email: string;
        } | null;
        latestApplication: {
            id: number;
            discordUsername: string;
            pronouns: string;
            major: string;
            yearLevel: string;
            coursesJson: string;
            courses: string[];
            skillsText: string;
            toolsComfortable: string;
            toolsLearning: string;
            previousSemesters: number;
            whyMentor: string;
            comments: string | null;
            status: string;
            createdAt: string;
            semester: {
                id: number;
                name: string;
                isActive?: boolean;
            };
        } | null;
    } | null;
    isOwner: boolean;
}

interface MentorSemester {
    id: number;
    name: string;
    isActive: boolean;
}

interface ExistingApplication {
    id: number;
    status: string;
    discordUsername?: string;
    pronouns?: string;
    major?: string;
    yearLevel?: string;
    coursesJson?: string;
    skillsText?: string;
    toolsComfortable?: string;
    toolsLearning?: string;
    previousSemesters?: number;
    whyMentor?: string;
    comments?: string | null;
    semester: {
        id: number;
        name: string;
        isActive?: boolean;
    };
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
    let detail = rest.join(":").trim();
    // Strip internal event-ID suffix like " [abc123]"
    detail = detail.replace(/\s*\[[^\]]+\]$/, "");
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
    { key: "graduationTerm", label: "Graduation Term", icon: GraduationCap },
    { key: "graduationYear", label: "Graduation Year", icon: Calendar },
    { key: "major", label: "Major", icon: Briefcase },
    { key: "gitHub", label: "GitHub", icon: Github },
    { key: "linkedIn", label: "LinkedIn", icon: Linkedin },
] as const;

const TOTAL_QUEST_FIELDS = QUEST_FIELDS.length;

const MENTOR_COURSES = [
    { id: "CSCI-141", label: "CSCI 141: Computer Science I" },
    { id: "CSCI-142", label: "CSCI 142: Computer Science II" },
    { id: "CSCI-140", label: "CS for AP Student/Transfers" },
    { id: "GCIS-123", label: "GCIS 123: Software Development & Problem Solving I" },
    { id: "GCIS-124", label: "GCIS 124: Software Development & Problem Solving II" },
    { id: "SWEN-250", label: "SWEN 250: Personal Software Engineering WITHOUT C++" },
    { id: "SWEN-251", label: "SWEN 251: Personal Software Engineering WITH C++" },
    { id: "SWEN-261-WC", label: "SWEN 261: Intro to Software Engineering (Web Checkers)" },
    { id: "SWEN-261-ES", label: "SWEN 261: Intro to Software Engineering (E-Store)" },
    { id: "SWEN-261-UF", label: "SWEN 261: Intro to Software Engineering (UFund)" },
    { id: "SWEN-344", label: "SWEN 344: Web Engineering" },
    { id: "SWEN-262", label: "SWEN 262: Engineering of Software Subsystems" },
    { id: "SWEN-331", label: "SWEN 331: Engineering Secure Software" },
    { id: "SWEN-340-MP", label: "SWEN 340: Software Design for Computing Systems (Music Player)" },
    { id: "SWEN-340-NMP", label: "SWEN 340: Software Design for Computing Systems (Not Music Player)" },
    { id: "SWEN-440", label: "SWEN 440: Software System Requirements and Architecture" },
    { id: "SWEN-444", label: "SWEN 444: Human Centered Requirements and Design" },
    { id: "CSCI-243", label: "CSCI 243: Mechanics of Programming" },
    { id: "CSCI-261", label: "CSCI 261: Analysis of Algorithms" },
    { id: "CSCI-262", label: "CSCI 262: Introduction to CS Theory" },
] as const;

const PRONOUNS = ["She/Her", "He/Him", "They/Them", "Other"] as const;
const MAJORS = ["Software Engineering", "Computer Science", "Other"] as const;
const YEAR_LEVELS = ["1st", "2nd", "3rd", "4th", "5th (Undergrad)", "MS Student", "Other"] as const;
const PREVIOUS_SEMESTERS = ["0", "1", "2", "3", "4", "5+"] as const;

function parseCourses(coursesJson?: string): string[] {
    if (!coursesJson) return [];
    try {
        const parsed = JSON.parse(coursesJson);
        return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
    } catch {
        return [];
    }
}

function categoricalBadgeStyle(seed: string | number): React.CSSProperties {
    const token = getCategoricalColorFromSeed(seed);
    return {
        backgroundColor: token.fill,
        color: token.foreground,
        borderColor: token.fill,
    };
}

function uniqueCategoricalBadgeStyles(
    seeds: Array<string | number>
): Map<string, React.CSSProperties> {
    const styles = new Map<string, React.CSSProperties>();
    const usedIndices = new Set<number>();

    for (const seed of seeds) {
        const key = String(seed);
        if (styles.has(key)) continue;

        const baseIndex = getCategoricalColorFromSeed(seed).index;
        let chosenIndex = baseIndex;

        for (let offset = 0; offset < CATEGORICAL_COLOR_COUNT; offset++) {
            const candidate = (baseIndex + offset) % CATEGORICAL_COLOR_COUNT;
            if (!usedIndices.has(candidate)) {
                chosenIndex = candidate;
                break;
            }
        }

        usedIndices.add(chosenIndex);
        const token = getCategoricalColorByIndex(chosenIndex);
        styles.set(key, {
            backgroundColor: token.fill,
            color: token.foreground,
            borderColor: token.fill,
        });
    }

    return styles;
}

function normalizeMentorApplicationStatus(status: string | undefined, isActiveMentor: boolean): string {
    if (!status) return "unknown";
    if (isActiveMentor && status.toLowerCase() === "invited") return "closed";
    return status;
}

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
    const [pendingCleanupKeys, setPendingCleanupKeys] = useState<string[]>([]);
    const [mentorEditing, setMentorEditing] = useState(false);
    const [mentorLoading, setMentorLoading] = useState(false);
    const [mentorSavingAnswers, setMentorSavingAnswers] = useState(false);
    const [mentorSavingAvailability, setMentorSavingAvailability] = useState(false);
    const [mentorResubmitting, setMentorResubmitting] = useState(false);
    const [activeMentorSemester, setActiveMentorSemester] = useState<MentorSemester | null>(null);
    const [mentorApplications, setMentorApplications] = useState<ExistingApplication[]>([]);
    const [mentorAvailabilitySlots, setMentorAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const [discordUsername, setDiscordUsername] = useState("");
    const [pronouns, setPronouns] = useState("");
    const [pronounsOther, setPronounsOther] = useState("");
    const [mentorMajor, setMentorMajor] = useState("");
    const [mentorMajorOther, setMentorMajorOther] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [yearLevelOther, setYearLevelOther] = useState("");
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [skillsText, setSkillsText] = useState("");
    const [toolsComfortable, setToolsComfortable] = useState("");
    const [toolsLearning, setToolsLearning] = useState("");
    const [previousSemesters, setPreviousSemesters] = useState("0");
    const [whyMentor, setWhyMentor] = useState("");
    const [mentorComments, setMentorComments] = useState("");

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

            // Only fetch handover docs when viewing your own profile (requires officer auth)
            if (data.isOwner) {
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
        setPendingCleanupKeys([]);
        setEditing(true);
    }

    function cancelEdit() {
        if (profile) populateEditFields(profile);
        setPendingCleanupKeys([]);
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
            if (pendingCleanupKeys.length > 0) {
                payload.cleanupImageKeys = pendingCleanupKeys;
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
            // Image URL is already resolved by the API via resolveUserImage()
            setProfileImage(updated.image ?? null);

            // Refetch the profile to get the fully resolved data
            const profileRes = await fetch(`/api/user/${userId}/profile`);
            if (profileRes.ok) {
                const freshProfile: ProfileData = await profileRes.json();
                setProfile(freshProfile);
                populateEditFields(freshProfile);
            }

            setPendingCleanupKeys([]);
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

    function populateMentorFields(
        source: ExistingApplication | NonNullable<NonNullable<ProfileData["mentorProfile"]>["latestApplication"]> | null
    ) {
        if (!source) return;

        const priorPronouns = source.pronouns || "";
        const priorMajor = source.major || "";
        const priorYear = source.yearLevel || "";

        setDiscordUsername(source.discordUsername || "");
        setSelectedCourses(parseCourses(source.coursesJson));
        setSkillsText(source.skillsText || "");
        setToolsComfortable(source.toolsComfortable || "");
        setToolsLearning(source.toolsLearning || "");
        setPreviousSemesters(source.previousSemesters === 5 ? "5+" : `${source.previousSemesters ?? 0}`);
        setWhyMentor(source.whyMentor || "");
        setMentorComments(source.comments || "");

        if (PRONOUNS.includes(priorPronouns as (typeof PRONOUNS)[number])) {
            setPronouns(priorPronouns);
            setPronounsOther("");
        } else if (priorPronouns) {
            setPronouns("Other");
            setPronounsOther(priorPronouns);
        } else {
            setPronouns("");
            setPronounsOther("");
        }

        if (MAJORS.includes(priorMajor as (typeof MAJORS)[number])) {
            setMentorMajor(priorMajor);
            setMentorMajorOther("");
        } else if (priorMajor) {
            setMentorMajor("Other");
            setMentorMajorOther(priorMajor);
        } else {
            setMentorMajor("");
            setMentorMajorOther("");
        }

        if (YEAR_LEVELS.includes(priorYear as (typeof YEAR_LEVELS)[number])) {
            setYearLevel(priorYear);
            setYearLevelOther("");
        } else if (priorYear) {
            setYearLevel("Other");
            setYearLevelOther(priorYear);
        } else {
            setYearLevel("");
            setYearLevelOther("");
        }
    }

    useEffect(() => {
        const loadMentorData = async () => {
            if (!profile?.isOwner || !profile.mentorProfile) {
                return;
            }
            setMentorLoading(true);
            try {
                const semesterRes = await fetch("/api/mentor-semester?activeOnly=true");
                let activeSemester: MentorSemester | null = null;
                if (semesterRes.ok) {
                    const semesters = await semesterRes.json();
                    activeSemester = semesters?.[0] ?? null;
                    setActiveMentorSemester(activeSemester);
                } else {
                    setActiveMentorSemester(null);
                }

                const appsRes = await fetch("/api/mentor-application?my=true");
                let apps: ExistingApplication[] = [];
                if (appsRes.ok) {
                    apps = await appsRes.json();
                    setMentorApplications(apps);
                } else {
                    setMentorApplications([]);
                }

                populateMentorFields((apps[0] ?? profile.mentorProfile.latestApplication) ?? null);

                const defaultSlots = profile.mentorProfile.availability ?? [];
                setMentorAvailabilitySlots(defaultSlots);

                if (activeSemester?.id) {
                    const availabilityRes = await fetch(`/api/mentor-availability?my=true&semesterId=${activeSemester.id}`);
                    if (availabilityRes.ok) {
                        const availability = await availabilityRes.json();
                        const slots = availability?.[0]?.slots;
                        if (Array.isArray(slots)) {
                            setMentorAvailabilitySlots(slots);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load mentor profile editor state:", error);
            } finally {
                setMentorLoading(false);
            }
        };

        loadMentorData();
    }, [profile?.id, profile?.isOwner, profile?.mentorProfile]);

    const activeApplication = mentorApplications.find((application) => application.semester.isActive) ?? null;
    const latestApplication = mentorApplications[0] ?? null;
    const editableApplication = activeApplication ?? latestApplication ?? profile?.mentorProfile?.latestApplication ?? null;
    const canResubmitForActiveSemester = !!(
        profile?.mentorProfile &&
        !profile.mentorProfile.isActive &&
        activeMentorSemester &&
        !activeApplication
    );
    const displayedEditableStatus = normalizeMentorApplicationStatus(
        editableApplication?.status,
        !!profile?.mentorProfile?.isActive
    );

    const getResolvedPronouns = () => (pronouns === "Other" ? pronounsOther.trim() : pronouns);
    const getResolvedMajor = () => (mentorMajor === "Other" ? mentorMajorOther.trim() : mentorMajor);
    const getResolvedYearLevel = () => (yearLevel === "Other" ? yearLevelOther.trim() : yearLevel);

    const validateMentorAnswers = () => {
        if (!discordUsername.trim()) return "Discord username is required.";
        if (!getResolvedPronouns().trim()) return "Pronouns are required.";
        if (!getResolvedMajor().trim()) return "Major is required.";
        if (!getResolvedYearLevel().trim()) return "Year level is required.";
        if (!whyMentor.trim()) return "Please explain why you want to mentor.";
        return null;
    };

    const buildMentorPayload = () => ({
        discordUsername: discordUsername.trim(),
        pronouns: getResolvedPronouns().trim(),
        major: getResolvedMajor().trim(),
        yearLevel: getResolvedYearLevel().trim(),
        coursesJson: JSON.stringify(selectedCourses),
        skillsText: skillsText.trim(),
        toolsComfortable: toolsComfortable.trim(),
        toolsLearning: toolsLearning.trim(),
        previousSemesters: previousSemesters === "5+" ? 5 : Number.parseInt(previousSemesters, 10) || 0,
        whyMentor: whyMentor.trim(),
        comments: mentorComments.trim(),
    });

    const handleMentorCourseToggle = (courseId: string) => {
        setSelectedCourses((previous) =>
            previous.includes(courseId)
                ? previous.filter((id) => id !== courseId)
                : [...previous, courseId]
        );
    };

    const handleSaveMentorAnswers = async () => {
        if (!editableApplication) {
            toast.error("No application available to update.");
            return;
        }
        const validationError = validateMentorAnswers();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setMentorSavingAnswers(true);
        try {
            const response = await fetch("/api/mentor-application", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editableApplication.id,
                    ...buildMentorPayload(),
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to update mentor application.");
            }
            toast.success("Mentor answers updated.");
            await fetchProfile();
        } catch (error) {
            console.error(error);
            toast.error("Could not save mentor answers.");
        } finally {
            setMentorSavingAnswers(false);
        }
    };

    const handleResubmitMentorApplication = async () => {
        if (!activeMentorSemester) {
            toast.error("No active semester found.");
            return;
        }
        const validationError = validateMentorAnswers();
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setMentorResubmitting(true);
        try {
            const response = await fetch("/api/mentor-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    semesterId: activeMentorSemester.id,
                    ...buildMentorPayload(),
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to resubmit mentor application.");
            }
            toast.success(`Application submitted for ${activeMentorSemester.name}.`);
            await fetchProfile();
        } catch (error) {
            console.error(error);
            toast.error("Could not resubmit application.");
        } finally {
            setMentorResubmitting(false);
        }
    };

    const handleSaveMentorAvailability = async () => {
        if (!activeMentorSemester) {
            toast.error("No active semester found.");
            return;
        }

        setMentorSavingAvailability(true);
        try {
            const response = await fetch("/api/mentor-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    semesterId: activeMentorSemester.id,
                    slots: mentorAvailabilitySlots,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.error || "Failed to update availability.");
            }
            const data = await response.json();
            if (Array.isArray(data?.slots)) {
                setMentorAvailabilitySlots(data.slots);
            }
            const removedCount = Array.isArray(data?.removedBlocks) ? data.removedBlocks.length : 0;
            toast.success(
                removedCount > 0
                    ? `Availability updated and removed ${removedCount} incompatible shift${removedCount === 1 ? "" : "s"}.`
                    : "Availability updated."
            );
            await fetchProfile();
        } catch (error) {
            console.error(error);
            toast.error("Could not update availability.");
        } finally {
            setMentorSavingAvailability(false);
        }
    };

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

    // Image URL is already resolved by the API via resolveUserImage()
    const profileImageUrl = profile.image ?? DEFAULT_IMAGE;
    const hasImage = !!profile.image;

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
    const completedQuestFields = QUEST_FIELDS.reduce((sum, f) => sum + (fieldComplete(f.key) ? 1 : 0), 0);
    const allQuestComplete = completedQuestFields === TOTAL_QUEST_FIELDS;
    const headerTagStyles = uniqueCategoricalBadgeStyles([
        ...(profile.mentorProfile?.isActive ? ["Mentor"] : []),
        ...activeRoles.map((role) => role.position.title),
    ]);
    const mentorAvailabilityForDisplay = profile.isOwner
        ? (mentorAvailabilitySlots.length > 0
            ? mentorAvailabilitySlots
            : (profile.mentorProfile?.availability ?? []))
        : (profile.mentorProfile?.availability ?? []);

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
                                onChange={(img) => {
                                    const nextImage = img ?? DEFAULT_IMAGE;
                                    const currentKey = normalizeToS3Key(editImage);
                                    const nextKey = normalizeToS3Key(nextImage);
                                    if (currentKey && currentKey !== nextKey) {
                                        setPendingCleanupKeys((prev) =>
                                            prev.includes(currentKey) ? prev : [...prev, currentKey]
                                        );
                                    }
                                    setEditImage(nextImage);
                                }}
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
                                {profile.mentorProfile?.isActive && (
                                    <Badge style={headerTagStyles.get("Mentor") ?? categoricalBadgeStyle("Mentor")}>
                                        Mentor
                                    </Badge>
                                )}
                                {activeRoles.map((role) => (
                                    <Badge
                                        key={role.id}
                                        style={headerTagStyles.get(role.position.title) ?? categoricalBadgeStyle(role.position.title)}
                                    >
                                        {role.position.title}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {profile.email && !editing && (
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                        )}
                        {!editing && (
                            <p className="text-sm text-muted-foreground">
                                {profile.major?.trim() || "Major not set"}{" "}
                                {"\u00b7"}{" "}
                                {profile.graduationTerm && profile.graduationYear
                                    ? `${prettifyTerm(profile.graduationTerm)} ${profile.graduationYear}`
                                    : "Graduation not set"}
                                {" \u00b7 "}
                                Co-op: {profile.coopSummary?.trim() || "Not set"}
                            </p>
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
            {profile.isOwner && !allQuestComplete && (
                <div>
                    <Card
                        depth={2}
                        className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5"
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 mt-0.5">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-sm">Profile Quest</h3>
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px]"
                                        style={categoricalBadgeStyle("profile-quest-progress")}
                                    >
                                        {completedQuestFields} / {TOTAL_QUEST_FIELDS} fields
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Complete your profile to unlock your membership. Each field gets you closer.
                                </p>

                                {/* Progress bar */}
                                <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                                    <div
                                        className="h-full transition-all duration-500 rounded-full bg-primary"
                                        style={{ width: `${(completedQuestFields / TOTAL_QUEST_FIELDS) * 100}%` }}
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
                                            </div>
                                        );
                                    })}
                                </div>

                                {!editing && (
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

                    {/* Mentor profile */}
                    {profile.mentorProfile && (
                        <section>
                            <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                Mentor Profile
                            </h2>
                            <Card depth={2} className="p-4 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge style={categoricalBadgeStyle(profile.mentorProfile.isActive ? "Active Mentor" : "Inactive Mentor")}>
                                        {profile.mentorProfile.isActive ? "Active Mentor" : "Inactive Mentor"}
                                    </Badge>
                                    <Badge variant="outline" style={categoricalBadgeStyle(`expires-${profile.mentorProfile.expirationDate}`)}>
                                        Expires{" "}
                                        {new Date(profile.mentorProfile.expirationDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </Badge>
                                    {profile.isOwner && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="ml-auto"
                                            onClick={() => setMentorEditing((previous) => !previous)}
                                            disabled={mentorLoading}
                                        >
                                            {mentorEditing ? "View" : "Edit"}
                                        </Button>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Assigned Shifts</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.mentorProfile.shifts.length > 0 ? (
                                            profile.mentorProfile.shifts.map((shift) => (
                                                <Badge
                                                    key={shift.id}
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={categoricalBadgeStyle(`shift-${shift.label}`)}
                                                >
                                                    {shift.label}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm font-medium">No shifts assigned yet</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-1">Mentoring Head Contact</p>
                                    {profile.mentorProfile.mentoringHead ? (
                                        <p className="font-medium">
                                            {profile.mentorProfile.mentoringHead.name} (
                                            {profile.mentorProfile.mentoringHead.email})
                                        </p>
                                    ) : (
                                        <p className="font-medium">Not assigned right now</p>
                                    )}
                                </div>
                                {profile.isOwner && profile.mentorProfile.isActive && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Headcount Forms</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href="/mentoring/headcount/mentors">30-minute Form</Link>
                                            </Button>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href="/mentoring/headcount/mentees">55-minute Form</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {!mentorEditing || !profile.isOwner ? (
                                    <>
                                        {profile.mentorProfile.latestApplication ? (
                                            <>
                                                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Semester:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.semester.name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Application Status:</span>{" "}
                                                        <span className="font-medium">
                                                            {normalizeMentorApplicationStatus(
                                                                profile.mentorProfile.latestApplication.status,
                                                                profile.mentorProfile.isActive
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Discord:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.discordUsername || "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Pronouns:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.pronouns || "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Major:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.major || "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Year Level:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.yearLevel || "—"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Previous Semesters:</span>{" "}
                                                        <span className="font-medium">
                                                            {profile.mentorProfile.latestApplication.previousSemesters}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-2">Courses</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.mentorProfile.latestApplication.courses.length > 0 ? (
                                                            profile.mentorProfile.latestApplication.courses.map((course) => (
                                                                <Badge
                                                                    key={course}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                    style={categoricalBadgeStyle(course)}
                                                                >
                                                                    {course}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm font-medium">Not set</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Other Skills</p>
                                                        <p className="font-medium whitespace-pre-wrap">
                                                            {profile.mentorProfile.latestApplication.skillsText || "Not set"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Tools Comfortable With</p>
                                                        <p className="font-medium whitespace-pre-wrap">
                                                            {profile.mentorProfile.latestApplication.toolsComfortable || "Not set"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Tools Currently Learning</p>
                                                        <p className="font-medium whitespace-pre-wrap">
                                                            {profile.mentorProfile.latestApplication.toolsLearning || "Not set"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground mb-1">Why Mentor</p>
                                                        <p className="font-medium whitespace-pre-wrap">
                                                            {profile.mentorProfile.latestApplication.whyMentor || "Not set"}
                                                        </p>
                                                    </div>
                                                    {profile.mentorProfile.latestApplication.comments && (
                                                        <div>
                                                            <p className="text-muted-foreground mb-1">Comments</p>
                                                            <p className="font-medium whitespace-pre-wrap">
                                                                {profile.mentorProfile.latestApplication.comments}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Mentor record exists, but no application details are available yet.
                                            </p>
                                        )}

                                        <div className="space-y-2 border-t border-border/60 pt-4">
                                            <p className="text-sm text-muted-foreground">Current Availability</p>
                                            <Card depth={3} className="neo:border-0">
                                                <CardContent className="p-3">
                                                <AvailabilityGrid
                                                    value={mentorAvailabilityForDisplay}
                                                    onChange={() => {}}
                                                    readOnly
                                                />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge style={categoricalBadgeStyle(activeMentorSemester ? `semester-${activeMentorSemester.name}` : "semester-none")}>
                                                {activeMentorSemester
                                                    ? `Active semester: ${activeMentorSemester.name}`
                                                    : "No active semester"}
                                            </Badge>
                                            {editableApplication && (
                                                <Badge variant="outline" style={categoricalBadgeStyle(`editing-${editableApplication.semester.name}-${displayedEditableStatus}`)}>
                                                    {editableApplication.semester.name}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="mentor-discord">Discord username</Label>
                                                <Input
                                                    id="mentor-discord"
                                                    value={discordUsername}
                                                    onChange={(event) => setDiscordUsername(event.target.value)}
                                                    placeholder="username#1234 or username"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pronouns</Label>
                                                <Select value={pronouns} onValueChange={setPronouns}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select pronouns" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PRONOUNS.map((value) => (
                                                            <SelectItem key={value} value={value}>{value}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {pronouns === "Other" && (
                                                    <Input
                                                        value={pronounsOther}
                                                        onChange={(event) => setPronounsOther(event.target.value)}
                                                        placeholder="Please specify"
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Major</Label>
                                                <Select value={mentorMajor} onValueChange={setMentorMajor}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select major" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MAJORS.map((value) => (
                                                            <SelectItem key={value} value={value}>{value}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {mentorMajor === "Other" && (
                                                    <Input
                                                        value={mentorMajorOther}
                                                        onChange={(event) => setMentorMajorOther(event.target.value)}
                                                        placeholder="Please specify"
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Year level</Label>
                                                <Select value={yearLevel} onValueChange={setYearLevel}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select year level" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {YEAR_LEVELS.map((value) => (
                                                            <SelectItem key={value} value={value}>{value}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {yearLevel === "Other" && (
                                                    <Input
                                                        value={yearLevelOther}
                                                        onChange={(event) => setYearLevelOther(event.target.value)}
                                                        placeholder="Please specify"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Courses</Label>
                                            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto border rounded-md p-3">
                                                {MENTOR_COURSES.map((course) => (
                                                    <div key={course.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`mentor-course-${course.id}`}
                                                            checked={selectedCourses.includes(course.id)}
                                                            onCheckedChange={() => handleMentorCourseToggle(course.id)}
                                                        />
                                                        <label htmlFor={`mentor-course-${course.id}`} className="text-sm cursor-pointer">
                                                            {course.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label htmlFor="mentor-why">Why mentor?</Label>
                                                <Textarea
                                                    id="mentor-why"
                                                    value={whyMentor}
                                                    onChange={(event) => setWhyMentor(event.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mentor-skills">Other skills</Label>
                                                <Textarea
                                                    id="mentor-skills"
                                                    value={skillsText}
                                                    onChange={(event) => setSkillsText(event.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mentor-tools-comfortable">Tools comfortable with</Label>
                                                <Textarea
                                                    id="mentor-tools-comfortable"
                                                    value={toolsComfortable}
                                                    onChange={(event) => setToolsComfortable(event.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mentor-tools-learning">Tools currently learning</Label>
                                                <Textarea
                                                    id="mentor-tools-learning"
                                                    value={toolsLearning}
                                                    onChange={(event) => setToolsLearning(event.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Previous mentoring semesters</Label>
                                                <Select value={previousSemesters} onValueChange={setPreviousSemesters}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PREVIOUS_SEMESTERS.map((value) => (
                                                            <SelectItem key={value} value={value}>{value}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label htmlFor="mentor-comments">Comments</Label>
                                                <Textarea
                                                    id="mentor-comments"
                                                    value={mentorComments}
                                                    onChange={(event) => setMentorComments(event.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                onClick={handleSaveMentorAnswers}
                                                disabled={mentorSavingAnswers || !editableApplication}
                                            >
                                                {mentorSavingAnswers ? "Saving answers..." : "Save Answers"}
                                            </Button>
                                            {canResubmitForActiveSemester && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleResubmitMentorApplication}
                                                    disabled={mentorResubmitting || !activeMentorSemester}
                                                >
                                                    {mentorResubmitting
                                                        ? "Resubmitting..."
                                                        : `Resubmit for ${activeMentorSemester?.name ?? "active semester"}`}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-2 border-t border-border/60 pt-4">
                                            <Label>Availability</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Updates here notify the mentoring head and remove incompatible scheduled shifts.
                                            </p>
                                            <Card depth={3} className="neo:border-0">
                                                <CardContent className="p-3">
                                                <AvailabilityGrid value={mentorAvailabilitySlots} onChange={setMentorAvailabilitySlots} />
                                                </CardContent>
                                            </Card>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSaveMentorAvailability}
                                                disabled={mentorSavingAvailability || !activeMentorSemester}
                                            >
                                                {mentorSavingAvailability ? "Saving availability..." : "Save Availability"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] uppercase tracking-wide"
                                                        style={categoricalBadgeStyle(parsed.label)}
                                                    >
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
