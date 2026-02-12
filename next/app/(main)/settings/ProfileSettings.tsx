"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ImageUpload from "@/components/common/ImageUpload";
import { isS3Key } from "@/lib/s3Utils";

const DEFAULT_IMAGE = "https://source.boringavatars.com/beam/";

interface UserProfile {
    id: number;
    name: string;
    email: string;
    image: string;
    profileImageKey: string | null;
    linkedIn: string | null;
    gitHub: string | null;
    description: string | null;
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

/** Strip a full LinkedIn URL down to just the username/slug */
function extractLinkedInUsername(val: string): string {
    if (!val) return "";
    try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        const parts = url.pathname.replace(/\/$/, "").split("/");
        // linkedin.com/in/username -> "username"
        const inIdx = parts.indexOf("in");
        if (inIdx !== -1 && parts[inIdx + 1]) return parts[inIdx + 1];
        return parts[parts.length - 1] || val;
    } catch {
        return val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");
    }
}

/** Strip a full GitHub URL down to just the username */
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

export default function ProfileSettings() {
    const { data: session } = useSession();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [linkedIn, setLinkedIn] = useState("");
    const [gitHub, setGitHub] = useState("");
    const [image, setImage] = useState(DEFAULT_IMAGE);

    const [original, setOriginal] = useState<UserProfile | null>(null);
    const oauthImage = session?.user?.image ?? null;

    useEffect(() => {
        if (!session?.user?.email) return;
        (async () => {
            try {
                const res = await fetch("/api/user");
                if (!res.ok) return;
                const users: UserProfile[] = await res.json();
                const me = users.find((u) => u.email === session.user?.email);
                if (me) {
                    setUserId(me.id);
                    setName(me.name);
                    setDescription(me.description ?? "");
                    setLinkedIn(extractLinkedInUsername(me.linkedIn ?? ""));
                    setGitHub(extractGitHubUsername(me.gitHub ?? ""));
                    setImage(me.image ?? DEFAULT_IMAGE);
                    setOriginal(me);
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        })();
    }, [session]);

    // ── Image helpers ──

    /** The image to display: custom upload > OAuth > null */
    function getDisplayImage(): string | null {
        if (image && image !== DEFAULT_IMAGE) {
            return image; // Already a full URL from the API
        }
        if (oauthImage) return oauthImage;
        return null;
    }

    // Check if the user has uploaded a custom image (S3 key or contains our bucket name)
    const isCustomUpload = !!(image && image !== DEFAULT_IMAGE &&
        (isS3Key(image) || (image.includes('.s3.') && image.includes('.amazonaws.com'))));

    const handleImageChange = (newImage: string | null) => {
        setImage(newImage ?? original?.image ?? DEFAULT_IMAGE);
    };

    // ── Save / Reset ──

    const handleSave = async () => {
        if (!userId) {
            toast.error("User not found. Please reload the page.");
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = { id: userId };

            if (name !== original?.name) payload.name = name;
            if (description !== (original?.description ?? "")) payload.description = description;

            // Store usernames only — the display layer adds the URL
            const originalLi = extractLinkedInUsername(original?.linkedIn ?? "");
            const originalGh = extractGitHubUsername(original?.gitHub ?? "");
            if (linkedIn !== originalLi) payload.linkedIn = linkedIn;
            if (gitHub !== originalGh) payload.gitHub = gitHub;
            if (image !== (original?.image ?? DEFAULT_IMAGE)) {
                // If the image is a full S3 URL, it hasn't changed. 
                // If it's a key (from a new upload), send that.
                payload.image = isS3Key(image) ? image : original?.profileImageKey ?? image;
            }

            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.text()) || "Save failed");

            const updated = await res.json();
            setOriginal({
                id: updated.id,
                name: updated.name,
                email: updated.email,
                image: updated.image,
                profileImageKey: updated.profileImageKey ?? null,
                linkedIn: updated.linkedIn,
                gitHub: updated.gitHub,
                description: updated.description,
            });
            toast.success("Profile saved successfully.");
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!original) return;
        setName(original.name);
        setDescription(original.description ?? "");
        setLinkedIn(extractLinkedInUsername(original.linkedIn ?? ""));
        setGitHub(extractGitHubUsername(original.gitHub ?? ""));
        setImage(original.image ?? DEFAULT_IMAGE);
    };

    const hasChanges = original && (
        name !== original.name ||
        description !== (original.description ?? "") ||
        linkedIn !== extractLinkedInUsername(original.linkedIn ?? "") ||
        gitHub !== extractGitHubUsername(original.gitHub ?? "") ||
        image !== (original.image ?? DEFAULT_IMAGE)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const displayImage = getDisplayImage();

    return (
        <div className="flex flex-col gap-8">
            {/* ── Profile picture ── */}
            <Card depth={1}>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                </CardHeader>
                <CardContent>
                    <ImageUpload
                        value={displayImage}
                        onChange={handleImageChange}
                        initials={getInitials(name)}
                        avatarSize="h-24 w-24"
                        showRemove={isCustomUpload}
                    />
                    {!isCustomUpload && displayImage && (
                        <p className="text-xs text-muted-foreground mt-4">
                            Currently using your Google profile picture.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── Profile info ── */}
            <Card depth={1}>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Bio</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell people a bit about yourself..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="gitHub">GitHub</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                                        github.com/
                                    </span>
                                    <Input
                                        id="gitHub"
                                        value={gitHub}
                                        onChange={(e) => setGitHub(e.target.value)}
                                        placeholder="username"
                                        className="neo:rounded-l-none clean:rounded-l-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="linkedIn">LinkedIn</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                                        linkedin.com/in/
                                    </span>
                                    <Input
                                        id="linkedIn"
                                        value={linkedIn}
                                        onChange={(e) => setLinkedIn(e.target.value)}
                                        placeholder="username"
                                        className="neo:rounded-l-none clean:rounded-l-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 pb-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                >
                    Reset
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>
        </div>
    );
}
