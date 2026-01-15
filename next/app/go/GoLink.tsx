import ExternalLinkIcon from "@/components/external-link-icon";
import StarIcon from "@/components/star-icon";
import SettingsIcon from "@/components/settings-icon";
import TrashIcon from "@/components/trash-icon";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

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

  const editModalId = `edit-golink-${id}`;
  const deleteModalId = `delete-golink-${id}`;

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
        (document.getElementById(editModalId) as HTMLDialogElement).close();
        fetchData();
      }
    } catch (error) {}
  };

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/golinks", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        handleCancel();
        (document.getElementById(deleteModalId) as HTMLDialogElement).close();
        fetchData();
      }
    } catch (error) {}
  };

  return (
    <>
      <a
        href={"/go/" + goUrl}
        target="_blank"
      >
        <Card 
          depth={2}
          className="flex p-4 h-full transition-all duration-150 ease-out
                     hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          <div className="flex-grow overflow-hidden">
            <div className="flex items-center gap-2">
              {pinned && <StarIcon size={20} isHovered className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
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
            />
            <ExternalLinkIcon size={20} isHovered className="text-primary" />
          </div>
        </Card>
      </a>
      <dialog id={editModalId} className="modal">
        <div className="modal-box">
          <h3 className="font-bold py-4 text-xlg">Create GoLink</h3>

          <label className="my-2 input input-bordered flex items-center gap-2">
            Go Link Title:
            <input
              type="text"
              className="grow text-foreground"
              placeholder="The SSE Website"
              value={newTitle}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="my-2 input input-bordered flex items-center gap-2">
            Go Link URL:
            <input
              type="text"
              className="grow text-foreground"
              placeholder="localhost:3000"
              value={newUrl}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Description (keep it short please)"
            value={newDescription}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Pinned</span>
              <input
                type="checkbox"
                className="checkbox"
                checked={newPinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                Officer (Won&apos;t be publicly shown)
              </span>
              <input
                type="checkbox"
                className="checkbox"
                checked={newOfficer}
                onChange={(e) => setOfficer(e.target.checked)}
              />
            </label>
          </div>

          <div className="flex">
            <span className="flex-grow"></span>

            <div className="modal-action">
              <form method="dialog">
                <button
                  className="btn"
                  onClick={() => {
                    handleEdit();
                  }}
                >
                  Edit
                </button>
              </form>
            </div>

            <span className="w-2"></span>

            <div className="modal-action">
              <form method="dialog">
                <button
                  className="btn"
                  onClick={() => {
                    handleCancel();
                    (
                      document.getElementById(editModalId) as HTMLDialogElement
                    ).close();
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
      <dialog id={deleteModalId} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <p className="font-bold py-4 text-lg">
            Are you sure you want to delete this GoLink?
          </p>
          <div className="flex">
            <span className="flex-grow"></span>

            <div className="modal-action">
              <form method="dialog">
                <button
                  className="btn"
                  onClick={() => {
                    handleDelete();
                    (
                      document.getElementById(
                        deleteModalId
                      ) as HTMLDialogElement
                    ).close();
                  }}
                >
                  Delete
                </button>
              </form>
            </div>

            <span className="w-2"></span>

            <div className="modal-action">
              <form method="dialog">
                <button
                  className="btn"
                  onClick={() => {
                    handleCancel();
                    (
                      document.getElementById(
                        deleteModalId
                      ) as HTMLDialogElement
                    ).close();
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};

const EditAndDelete: React.FC<GoLinkProps> = ({
  id,
  goUrl,
  url,
  description,
  pinned,
}) => {
  const { data: session } = useSession();
  const [isOfficer, setIsOfficer] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetch("/api/authLevel").then((response) =>
        response.json()
      );
      setIsOfficer(data.isOfficer);
    })();
  }, []);

  if (isOfficer) {
    return (
      <form>
        <div className="flex flex-row">
          <div className="pr-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (document) {
                  (
                    document.getElementById(
                      `edit-golink-${id}`
                    ) as HTMLFormElement
                  ).showModal();
                }
              }}
              className="rounded-md hover:scale-110 transition-transform"
              aria-label="Edit go link"
            >
              <SettingsIcon size={24} isHovered duration={2} />
            </button>
          </div>
          <div className="pr-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (document) {
                  (
                    document.getElementById(
                      `delete-golink-${id}`
                    ) as HTMLFormElement
                  ).showModal();
                }
              }}
              className="rounded-md hover:scale-110 transition-transform text-destructive"
              aria-label="Delete go link"
            >
              <TrashIcon size={24} isHovered />
            </button>
          </div>
        </div>
      </form>
    );
  }
};

export default GoLink;
