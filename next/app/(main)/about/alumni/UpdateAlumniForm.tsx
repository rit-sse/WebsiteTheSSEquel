"use client"

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/common/ImageUpload";
import { AlumniMember } from "./alumni";

interface UpdateAlumniFormProps {
  alumniMember: AlumniMember;
}

/** Extracts just the username from a linkedin.com/in/... URL or returns as-is */
function extractUsername(url: string | undefined, prefix: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const parts = u.pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (prefix === "linkedin") {
      const idx = parts.indexOf("in");
      return idx !== -1 && parts[idx + 1] ? parts[idx + 1] : parts[parts.length - 1] || url;
    }
    return parts[0] || url;
  } catch {
    return url;
  }
}

export default function UpdateAlumniForm({ alumniMember }: UpdateAlumniFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(alumniMember.name);
  const [quote, setQuote] = useState(alumniMember.quote || "");
  const [previous_roles, setPreviousRoles] = useState(alumniMember.previous_roles || "");
  const [description, setDescription] = useState(alumniMember.description || "");
  const [linkedin, setLinkedin] = useState(extractUsername(alumniMember.linkedin, "linkedin"));
  const [github, setGithub] = useState(extractUsername(alumniMember.github, "github"));
  const [email, setEmail] = useState(alumniMember.email);
  const [start_date, setStartDate] = useState(alumniMember.start_date);
  const [end_date, setEndDate] = useState(alumniMember.end_date);
  const [image, setImage] = useState<string | null>(
    alumniMember.image && alumniMember.image !== "https://source.boringavatars.com/beam/"
      ? alumniMember.image
      : null
  );
  const [showEmail, setShowEmail] = useState(alumniMember.showEmail ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancel = () => {
    setError("");
    setSuccess(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    if (!name || !email || !start_date || !end_date) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/alumni-requests", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          linkedIn: linkedin,
          gitHub: github,
          description,
          quote,
          previous_roles,
          start_date,
          end_date,
          image: image || undefined,
          showEmail,
          alumniId: Number(alumniMember.alumni_id)
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => handleCancel(), 2500);
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to submit update request");
      }
    } catch (err) {
      console.error("Failed to submit update request:", err);
      setError("An error occurred while submitting your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <PenLine className="h-3.5 w-3.5" />
        Request Update
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Request an Update"
        description={`Submit updated information for ${alumniMember.name}. Changes will be reviewed by SSE officers before being applied.`}
        className="max-w-xl max-h-[90vh]"
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Update Requested!</h3>
            <p className="text-muted-foreground">
              Your changes will be reviewed by an officer. Thank you!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="update-name">Name *</Label>
                <Input
                  id="update-name"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-email">Email *</Label>
                <Input
                  id="update-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <Checkbox
                  id="update-showEmail"
                  checked={showEmail}
                  onCheckedChange={(checked) => setShowEmail(checked === true)}
                />
                <div className="space-y-0.5 leading-none">
                  <Label htmlFor="update-showEmail" className="text-sm font-medium cursor-pointer">
                    I would like to receive emails at this address
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your email will be displayed publicly on your alumni card.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-start">Start Date *</Label>
                <Input
                  id="update-start"
                  placeholder="e.g., Fall 2020"
                  value={start_date}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-end">Graduation Date *</Label>
                <Input
                  id="update-end"
                  placeholder="e.g., Spring 2024"
                  value={end_date}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-roles">Previous Roles in SSE</Label>
                <Input
                  id="update-roles"
                  placeholder="e.g., President, Tech Committee Head"
                  value={previous_roles}
                  onChange={(e) => setPreviousRoles(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Profile Image</Label>
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  initials={name ? name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "?"}
                  avatarSize="h-16 w-16"
                  compact
                  hint="JPG, PNG, or GIF up to 5 MB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-quote">Quote</Label>
                <Input
                  id="update-quote"
                  placeholder="A memorable quote or message"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-linkedin">LinkedIn</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="update-linkedin"
                    placeholder="username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="neo:rounded-l-none clean:rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-github">GitHub</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                    github.com/
                  </span>
                  <Input
                    id="update-github"
                    placeholder="username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="neo:rounded-l-none clean:rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-desc">Description</Label>
                <Textarea
                  id="update-desc"
                  placeholder="Tell us about yourself"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}

            <ModalFooter>
              <Button variant="neutral" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Update Request"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
