"use client"

import { useEffect, useState } from "react";
import { CreateGoLinkProps } from "./page";
import { Card } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const GoLinkButton: React.FC<CreateGoLinkProps> = ({ fetchData }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [pinned, setPinned] = useState(false);
  const [officer, setOfficer] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);

  const handleSetTitle = (givenTitle: string) => {
    const formatted = givenTitle.toLowerCase().split(" ").join("-");
    const special_chars_regexp = /[<>~`!@#$%^&*()|_=+[\]{}:;,./\\?0-9]+/g;
    const matches = formatted.match(special_chars_regexp);

    if (matches != null) {
      alert("Special Characters and Numbers are invalid for names.");
      setTitle(formatted.substring(0, formatted.length - 1));
    } else {
      setTitle(formatted);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setPinned(false);
    setOfficer(false);
    setOpen(false);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/golinks", {
        method: "POST",
        body: JSON.stringify({
          golink: title,
          url: url,
          description: description,
          isPinned: pinned,
          isPublic: !officer,
        }),
      });

      if (response.ok) {
        handleCancel();
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create golink:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/authLevel").then((r) => r.json());
      setIsOfficer(data.isOfficer);
    })();
  }, []);

  if (!isOfficer) return null;

  return (
    <>
      <button onClick={() => setOpen(true)}>
        <Card 
          depth={2}
          className="p-4 h-full flex items-center justify-center
                     transition-all duration-150 ease-out
                     neo:hover:translate-x-[2px] neo:hover:translate-y-[2px] neo:hover:shadow-none
                     clean:hover:shadow-lg clean:hover:scale-[1.01]
                     border-dashed"
        >
          <span className="text-lg font-display font-bold text-muted-foreground">+ Create Go Link</span>
        </Card>
      </button>

      <Modal open={open} onOpenChange={setOpen} title="Create GoLink">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="golink-title">Go Link Title</Label>
            <Input
              id="golink-title"
              placeholder="The SSE Website"
              value={title}
              onChange={(e) => handleSetTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="golink-url">Go Link URL</Label>
            <Input
              id="golink-url"
              placeholder="sse.rit.edu"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="golink-desc">Description</Label>
            <Textarea
              id="golink-desc"
              placeholder="Description (keep it short please)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="golink-pinned"
              checked={pinned}
              onCheckedChange={(checked) => setPinned(checked === true)}
            />
            <Label htmlFor="golink-pinned" className="cursor-pointer">Pinned</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="golink-officer"
              checked={officer}
              onCheckedChange={(checked) => setOfficer(checked === true)}
            />
            <Label htmlFor="golink-officer" className="cursor-pointer">Officer (Won&apos;t be publicly shown)</Label>
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

export default GoLinkButton;
