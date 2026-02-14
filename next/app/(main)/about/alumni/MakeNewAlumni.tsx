"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUpload from "@/components/common/ImageUpload";

interface CreateAlumniProps {
  fetchData: () => Promise<void>;
}

export const CreateAlumniButton: React.FC<CreateAlumniProps> = ({ fetchData }) => {
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
  const [showEmail, setShowEmail] = useState(true);
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [isOfficer, setIsOfficer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/authLevel").then((r) => r.json());
      setIsOfficer(data.isOfficer);
    })();
  }, []);

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
    setShowEmail(true);
    setReceiveEmails(true);
    setError("");
    setOpen(false);
  };

  const handleCreate = async () => {
    setError("");
    setIsSubmitting(true);

    if (!name || !email || !start_date || !end_date) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          linkedIn: linkedin || undefined,
          gitHub: github || undefined,
          description: description || undefined,
          quote: quote || undefined,
          previous_roles: previous_roles || undefined,
          start_date,
          end_date,
          image: image || undefined,
          showEmail,
          receiveEmails,
        }),
      });

      if (response.ok) {
        handleCancel();
        fetchData();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to create alumni");
      }
    } catch (err) {
      console.error("Failed to create alumni:", err);
      setError("An error occurred while creating the alumni");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOfficer) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus size={18} />
        Add Alumni
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Create Alumni"
        description="Add a new alumnus to the alumni page. Fill in their information; once created they will appear immediately."
        className="max-w-2xl max-h-[90vh]"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="alumni-name">Name *</Label>
            <Input
              id="alumni-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-email">Email *</Label>
            <Input
              id="alumni-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="alumni-receiveEmails"
                checked={receiveEmails}
                onCheckedChange={(checked) => setReceiveEmails(checked === true)}
              />
              <div className="space-y-0.5 leading-none">
                <Label htmlFor="alumni-receiveEmails" className="text-sm font-medium cursor-pointer">
                  Receive emails from SSE officers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Our alumni are the most important part of this club and we&apos;re working hard to reconnect everyone. We&apos;ll only reach out sparingly — but it means a lot.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="alumni-showEmail"
                checked={showEmail}
                onCheckedChange={(checked) => setShowEmail(checked === true)}
              />
              <div className="space-y-0.5 leading-none">
                <Label htmlFor="alumni-showEmail" className="text-sm font-medium cursor-pointer">
                  Show email publicly on alumni card
                </Label>
                <p className="text-xs text-muted-foreground">
                  Their email will be visible on their card so fellow alumni can reconnect.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-start">Start Date *</Label>
            <Input
              id="alumni-start"
              placeholder="e.g., Fall 2020"
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-end">Graduation Date *</Label>
            <Input
              id="alumni-end"
              placeholder="e.g., Spring 2024"
              value={end_date}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-roles">Previous Roles in SSE</Label>
            <Input
              id="alumni-roles"
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
              initials={name ? name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "?"}
              avatarSize="h-16 w-16"
              compact
              hint="JPG, PNG, or GIF up to 5 MB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-quote">Quote</Label>
            <Input
              id="alumni-quote"
              placeholder="A memorable quote or message"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">This will show up on their alumni card.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-linkedin">LinkedIn</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                linkedin.com/in/
              </span>
              <Input
                id="alumni-linkedin"
                placeholder="username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="neo:rounded-l-none clean:rounded-l-none"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Label htmlFor="alumni-github" className="text-sm font-medium">
              GitHub <span className="text-xs font-normal text-primary ml-1">Highly recommended</span>
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted neo:rounded-l-base neo:border-2 neo:border-r-0 neo:border-border clean:rounded-l-md clean:border clean:border-r-0 clean:border-border/50">
                github.com/
              </span>
              <Input
                id="alumni-github"
                placeholder="username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="neo:rounded-l-none clean:rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We pull their location, company, website, top repos, languages, and organizations from GitHub. Their card stays up to date automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-desc">Testimonial</Label>
            <Textarea
              id="alumni-desc"
              placeholder="Share their experience at SSE — what it meant to them, how it helped their career, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">This may be featured on the SSE homepage.</p>
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <ModalFooter>
          <Button variant="neutral" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CreateAlumniButton;
