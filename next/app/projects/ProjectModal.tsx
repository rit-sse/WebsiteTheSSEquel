"use client"

import React, { useEffect, useState } from "react";
import { Project } from "./projects";
import ProjectLink from "./ProjectLink";
import Image from "next/image";
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

interface ProjectModalInterface {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  project: Project;
  isOfficer: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const ProjectModal = ({ enabled, setEnabled, project, isOfficer }: ProjectModalInterface) => {
  const [lead, setLead] = useState({ name: "", email: "" });
  const [editMode, setEditMode] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Edit mode states
  const [projectTitle, setProjectTitle] = useState(project.title);
  const [leadid, setLeadID] = useState<string>(project.leadid?.toString() || "");
  const [desc, setDescription] = useState(project.description);
  const [repoLink, setRepoLink] = useState(project.repoLink);
  const [contentURLLink, setContentURL] = useState(project.contentURL);
  const [imageLink, setImageLink] = useState(project.projectImage);
  const [completed, setCompleted] = useState(project.completed);

  const projectBackground =
    !project.projectImage || project.projectImage === ""
      ? "images/SSEProjectPlaceholder.png"
      : project.projectImage;

  useEffect(() => {
    fetch("/api/user")
      .then((resp) => resp.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    if (project.leadid) {
      fetch("/api/user/" + project.leadid)
        .then((resp) => resp.json())
        .then((resp: User) => {
          setLead({ name: resp.name, email: resp.email });
        });
    }
  }, [project.leadid]);

  // Reset edit values when project changes
  useEffect(() => {
    setProjectTitle(project.title);
    setLeadID(project.leadid?.toString() || "");
    setDescription(project.description);
    setRepoLink(project.repoLink);
    setContentURL(project.contentURL);
    setImageLink(project.projectImage);
    setCompleted(project.completed);
  }, [project]);

  const handleClose = () => {
    setEnabled(false);
    setEditMode(false);
  };

  const editProject = () => {
    const selectUserID = leadid ? parseInt(leadid) : project.leadid;

    const payload = {
      id: project.id,
      title: projectTitle,
      description: desc,
      repoLink: repoLink,
      contentURL: contentURLLink,
      leadid: selectUserID,
      projectImage: imageLink ?? "",
      completed: completed,
    };

    fetch("/api/project", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    }).then(() => {
      handleClose();
      location.reload();
    });
  };

  const deleteProject = () => {
    fetch("/api/project", {
      method: "DELETE",
      body: JSON.stringify({ id: project.id }),
    }).then(() => {
      handleClose();
      location.reload();
    });
  };

  return (
    <Modal
      open={enabled}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setEnabled(true);
      }}
      title={editMode ? "Edit Project" : project.title}
      className="max-w-4xl max-h-[90vh]"
    >
      <div className="flex flex-col md:flex-row gap-6 max-h-[60vh] overflow-y-auto">
        {/* Project Image */}
        <div className="relative h-64 md:h-auto md:w-1/2 overflow-hidden rounded-base">
          <Image
            src={projectBackground}
            alt={project.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 backdrop-blur-[15px] bg-black/25" />
          <Image
            src={projectBackground}
            alt={project.title}
            fill
            className="object-contain z-10"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lead</Label>
                <Select value={leadid} onValueChange={setLeadID}>
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
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={desc}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-repo">Repository Link</Label>
                <Input
                  id="edit-repo"
                  value={repoLink}
                  onChange={(e) => setRepoLink(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content Link</Label>
                <Input
                  id="edit-content"
                  value={contentURLLink}
                  onChange={(e) => setContentURL(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Project Image URL</Label>
                <Input
                  id="edit-image"
                  value={imageLink ?? ""}
                  onChange={(e) => setImageLink(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-completed"
                  checked={completed}
                  onCheckedChange={(checked) => setCompleted(checked === true)}
                />
                <Label htmlFor="edit-completed" className="cursor-pointer">Completed</Label>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl">
                <span className="font-bold">Lead:</span> {lead.name}
              </p>
              <p className="text-xl">
                <span className="font-bold">Contact:</span> {lead.email}
              </p>
              <p className="text-lg max-h-[150px] overflow-auto">{project.description}</p>

              <ProjectLink url={"mailto:" + lead.email} text="Email" />
              {project.repoLink && <ProjectLink url={project.repoLink} text="Repo Link" />}
              {project.contentURL && <ProjectLink url={project.contentURL} text="Content URL Link" />}
            </>
          )}
        </div>
      </div>

      <ModalFooter>
        {editMode ? (
          <>
            <Button variant="neutral" onClick={deleteProject}>Delete</Button>
            <Button onClick={editProject}>Save</Button>
          </>
        ) : (
          <>
            {isOfficer && (
              <Button variant="neutral" onClick={() => setEditMode(true)}>Edit</Button>
            )}
            <Button onClick={handleClose}>Close</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ProjectModal;
