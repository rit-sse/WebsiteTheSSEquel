"use client"

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddProjectModalProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

interface User {
  id: number;
  name: string;
}

const AddProjectModal = ({ enabled, setEnabled }: AddProjectModalProps) => {
  const [titleText, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectUser, setUser] = useState<string>("");
  const [progress, setProgress] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [contentURL, setContentURL] = useState("");
  const [projectImage, setProjectImage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/user")
      .then(resp => resp.json())
      .then(setUsers);
  }, []);

  const handleClose = () => {
    setEnabled(false);
  };

  const upload = () => {
    const invalidFields = [];
    if (titleText.trim() === "") invalidFields.push("title");
    if (description.trim() === "") invalidFields.push("description");
    if (progress.trim() === "") invalidFields.push("progress");

    if (invalidFields.length > 0) {
      toast.error(`Required fields are empty: ${invalidFields.join(", ")}`);
      return;
    }

    const selectUserID = selectUser ? parseInt(selectUser) : 1;

    const payload = {
      title: titleText,
      description: description,
      leadid: selectUserID,
      progress: progress,
      repoLink: repoLink,
      contentURL: contentURL,
      projectImage: projectImage,
      completed: completed,
    };

    fetch("/api/project", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    }).then(() => {
      handleClose();
      location.reload();
    });
  };

  return (
    <Modal 
      open={enabled} 
      onOpenChange={setEnabled} 
      title="Add Project"
      className="max-w-2xl max-h-[90vh]"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label htmlFor="project-title">Title *</Label>
          <Input
            id="project-title"
            value={titleText}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-description">Description *</Label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project description"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Select Lead</Label>
          <Select value={selectUser} onValueChange={setUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lead" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-progress">Progress *</Label>
          <Input
            id="project-progress"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder="Project progress"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-repo">Repository Link</Label>
          <Input
            id="project-repo"
            value={repoLink}
            onChange={(e) => setRepoLink(e.target.value)}
            placeholder="Repository URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-content">Content URL</Label>
          <Input
            id="project-content"
            value={contentURL}
            onChange={(e) => setContentURL(e.target.value)}
            placeholder="Content URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-image">Project Image URL</Label>
          <Input
            id="project-image"
            value={projectImage}
            onChange={(e) => setProjectImage(e.target.value)}
            placeholder="Image URL"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="project-completed"
            checked={completed}
            onCheckedChange={(checked) => setCompleted(checked === true)}
          />
          <Label htmlFor="project-completed" className="cursor-pointer">Completed</Label>
        </div>
      </div>

      <ModalFooter>
        <Button variant="neutral" onClick={handleClose}>Cancel</Button>
        <Button onClick={upload}>Add</Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddProjectModal;
