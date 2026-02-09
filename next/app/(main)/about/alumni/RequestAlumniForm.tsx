"use client"

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/common/ImageUpload";

interface RequestAlumniFormProps {
  onSuccess?: () => void;
}

export default function RequestAlumniForm({ onSuccess }: RequestAlumniFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [previous_roles, setPreviousRoles] = useState("");
  const [description, setDescription] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [email, setEmail] = useState("");
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancel = () => {
    setName("");
    setQuote("");
    setPreviousRoles("");
    setDescription("");
    setLinkedin("");
    setGithub("");
    setEmail("");
    setStartDate("");
    setEndDate("");
    setImage(null);
    setShowEmail(false);
    setError("");
    setSuccess(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    // Validate required fields
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
          showEmail
        })
      });

      if (response.ok) {
        setSuccess(true);
        onSuccess?.();
        // Reset form after short delay to show success message
        setTimeout(() => {
          handleCancel();
        }, 2000);
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit alumni request:", error);
      setError("An error occurred while submitting your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border-2 border-border rounded-lg font-medium hover:bg-secondary/80 transition-colors"
      >
        <UserPlus size={18} />
        Request to be Added
      </button>

      <Modal 
        open={open} 
        onOpenChange={setOpen} 
        title="Request to be Added as Alumni" 
        description="Submit your information to be reviewed by SSE officers. Once approved, you'll appear on the alumni page."
        className="max-w-xl max-h-[90vh]"
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground">
              Thank you for your submission. An officer will review your request soon.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="request-name">Name *</Label>
                <Input
                  id="request-name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-email">Email *</Label>
                <Input
                  id="request-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <Checkbox
                  id="request-showEmail"
                  checked={showEmail}
                  onCheckedChange={(checked) => setShowEmail(checked === true)}
                />
                <div className="space-y-0.5 leading-none">
                  <Label htmlFor="request-showEmail" className="text-sm font-medium cursor-pointer">
                    I would like to receive emails at this address
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your email will be displayed publicly on your alumni card so others can contact you.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-start">Start Date *</Label>
                <Input
                  id="request-start"
                  placeholder="e.g., Fall 2020"
                  value={start_date}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-end">Graduation Date *</Label>
                <Input
                  id="request-end"
                  placeholder="e.g., Spring 2024"
                  value={end_date}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-roles">Previous Roles in SSE</Label>
                <Input
                  id="request-roles"
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
                <Label htmlFor="request-quote">Quote</Label>
                <Input
                  id="request-quote"
                  placeholder="A memorable quote or message"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-linkedin">LinkedIn</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="request-linkedin"
                    placeholder="username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="neo:rounded-l-none clean:rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-github">GitHub</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                    github.com/
                  </span>
                  <Input
                    id="request-github"
                    placeholder="username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="neo:rounded-l-none clean:rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-desc">Description</Label>
                <Textarea
                  id="request-desc"
                  placeholder="Tell us a bit about yourself and your time at SSE"
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
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
