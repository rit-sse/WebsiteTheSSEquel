"use client"

import { ExternalLink, Star, Settings, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface GoLinkProps {
  id: number;
  goUrl: string;
  url: string;
  description: string;
  pinned: boolean;
  officer: boolean;
  fetchData: () => Promise<void>;
}

const GoLink: React.FC<GoLinkProps> = ({
  id,
  goUrl,
  url,
  description,
  pinned,
  officer,
  fetchData,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitle, setTitle] = useState(goUrl);
  const [newUrl, setUrl] = useState(url);
  const [newDescription, setDescription] = useState(description);
  const [newPinned, setPinned] = useState(pinned);
  const [newOfficer, setOfficer] = useState(officer);

  const handleCancel = () => {
    setTitle(goUrl);
    setUrl(url);
    setDescription(description);
    setPinned(pinned);
    setOfficer(officer);
  };

  const handleEdit = async () => {
    try {
      const response = await fetch("api/golinks", {
        method: "PUT",
        body: JSON.stringify({
          id: id,
          golink: newTitle,
          url: newUrl,
          description: newDescription,
          isPinned: newPinned,
          isPublic: !newOfficer,
        }),
      });

      if (response.ok) {
        setEditOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to edit golink:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/golinks", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setDeleteOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete golink:", error);
    }
  };

  return (
    <>
      <a href={"/go/" + goUrl} target="_blank">
        <Card 
          depth={2}
          className="flex p-4 h-full transition-all duration-150 ease-out
                     neo:hover:translate-x-[2px] neo:hover:translate-y-[2px] neo:hover:shadow-none
                     clean:hover:shadow-lg clean:hover:scale-[1.01]"
        >
          <div className="flex-grow overflow-hidden">
            <div className="flex items-center gap-2">
              {pinned && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
              <p className="font-bold font-display text-lg truncate">{goUrl}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
          <div className="flex items-start ml-3 gap-1">
            <EditAndDelete
              id={id}
              goUrl={goUrl}
              url={url}
              description={description}
              pinned={pinned}
              officer={officer}
              fetchData={fetchData}
              onEditClick={() => setEditOpen(true)}
              onDeleteClick={() => setDeleteOpen(true)}
            />
            <ExternalLink className="h-5 w-5 text-primary" />
          </div>
        </Card>
      </a>

      {/* Edit Modal */}
      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit GoLink">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-title-${id}`}>Go Link Title</Label>
            <Input
              id={`edit-title-${id}`}
              placeholder="The SSE Website"
              value={newTitle}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-url-${id}`}>Go Link URL</Label>
            <Input
              id={`edit-url-${id}`}
              placeholder="localhost:3000"
              value={newUrl}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-desc-${id}`}>Description</Label>
            <Textarea
              id={`edit-desc-${id}`}
              placeholder="Description (keep it short please)"
              value={newDescription}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`edit-pinned-${id}`}
              checked={newPinned}
              onCheckedChange={(checked) => setPinned(checked === true)}
            />
            <Label htmlFor={`edit-pinned-${id}`} className="cursor-pointer">Pinned</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`edit-officer-${id}`}
              checked={newOfficer}
              onCheckedChange={(checked) => setOfficer(checked === true)}
            />
            <Label htmlFor={`edit-officer-${id}`} className="cursor-pointer">Officer (Won&apos;t be publicly shown)</Label>
          </div>
        </div>

        <ModalFooter>
          <Button variant="neutral" onClick={() => { handleCancel(); setEditOpen(false); }}>Cancel</Button>
          <Button onClick={handleEdit}>Edit</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete GoLink">
        <p className="text-foreground">Are you sure you want to delete this GoLink?</p>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete}>Delete</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

interface EditAndDeleteProps extends GoLinkProps {
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const EditAndDelete: React.FC<EditAndDeleteProps> = ({
  id,
  onEditClick,
  onDeleteClick,
}) => {
  const { data: session } = useSession();
  const [isOfficer, setIsOfficer] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/authLevel").then((r) => r.json());
      setIsOfficer(data.isOfficer);
    })();
  }, []);

  if (!isOfficer) return null;

  return (
    <div className="flex flex-row">
      <div className="pr-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            onEditClick();
          }}
          className="rounded-md hover:scale-110 transition-transform"
          aria-label="Edit go link"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>
      <div className="pr-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            onDeleteClick();
          }}
          className="rounded-md hover:scale-110 transition-transform text-destructive"
          aria-label="Delete go link"
        >
          <Trash2 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default GoLink;
