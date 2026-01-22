"use client"

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const [image, setImage] = useState("");
  const [isOfficer, setIsOfficer] = useState(false);

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
    setImage("");
    setOpen(false);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/alumni", {
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
          image
        })
      });

      if (response.ok) {
        handleCancel();
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create alumni:", error);
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

      <Modal open={open} onOpenChange={setOpen} title="Create Alumni" className="max-w-xl max-h-[90vh]">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="alumni-name">Name *</Label>
            <Input
              id="alumni-name"
              placeholder="Name (required)"
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
              placeholder="Email (required)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-start">Start Date *</Label>
            <Input
              id="alumni-start"
              placeholder="(required) e.g., Fall 2023"
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-end">Graduation Date *</Label>
            <Input
              id="alumni-end"
              placeholder="(required) e.g., Spring 2024"
              value={end_date}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-image">Image URL *</Label>
            <Input
              id="alumni-image"
              placeholder="Image link (full web URL)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-quote">Quote</Label>
            <Input
              id="alumni-quote"
              placeholder="Quote..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-roles">Previous Roles</Label>
            <Input
              id="alumni-roles"
              placeholder="Previous Roles..."
              value={previous_roles}
              onChange={(e) => setPreviousRoles(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-linkedin">LinkedIn</Label>
            <Input
              id="alumni-linkedin"
              placeholder="LinkedIn..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-github">GitHub</Label>
            <Input
              id="alumni-github"
              placeholder="GitHub..."
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alumni-desc">Description</Label>
            <Textarea
              id="alumni-desc"
              placeholder="Description (keep it short please)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="neutral" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CreateAlumniButton;
