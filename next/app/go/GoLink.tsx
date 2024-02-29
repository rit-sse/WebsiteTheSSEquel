import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";
import { GoLinkEdit } from "@/components/common/Icons";
import { GoLinkDelete } from "@/components/common/Icons";
import { useSession } from "next-auth/react";
import { useState } from "react";

export interface GoLinkProps {
    id: number;
    goUrl: string;
    url: string;
    description: string;
    pinned: boolean;
}

const GoLink: React.FC<GoLinkProps> = ({ id, goUrl, url, description, pinned }) => {
    const [newTitle, setTitle] = useState(goUrl); 
    const [newUrl, setUrl] = useState(url); 
    const [newDescription, setDescription] = useState(description); 
    const [newPinned, setPinned] = useState(pinned); 
    const [officer, setOfficer] = useState(false); 
    
    const handleCancel = () => {
        setTitle(goUrl); 
        setUrl(url); 
        setDescription(description); 
        setPinned(pinned);  
        setOfficer(false); 
    };

    const editModalId = `edit-golink-${id}`; 
    const deleteModalId = `delete-golink-${id}`; 

    const handleEdit = async () => {
        console.log("-------EDITING GOLINK--------")
        try {
            console.log(id)
            console.log(newTitle)
            const response = await fetch(`http://localhost:3000/api/golinks`, {
                method: 'PUT', // Assuming you are using PUT method for editing
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    title: newTitle, 
                    url: newUrl,
                    description: newDescription,
                    isPinned: newPinned,
                    isPublic: !officer
                }),
            });
    
            if (response.ok) {
                console.log('GoLink edited successfully');
                (document.getElementById(editModalId) as HTMLDialogElement).close(); 
            } else {
                console.error('Failed to edit GoLink');
            }
        } catch (error) {
            console.error('Error occurred while editing GoLink:', error);
        }
    }

    const handleDelete = async () => {
        console.log("-------DELETING GOLINK--------")
        try {
            const response = await fetch(`http://localhost:3000/api/golinks`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id
                }),
            });
    
            if (response.ok) {
                console.log('GoLink deleted successfully');
                handleCancel(); 
                (document.getElementById(deleteModalId) as HTMLDialogElement).close(); 
            } else {
                console.error('Failed to delete GoLink');
            }
        } catch (error) {
            console.error('Error occurred while deleting GoLink:', error);
        }
    }


    return (
        <>
            <a
                href={url}
                target="_blank"
                className="
                flex 
                p-4
                bg-base-100
                rounded-md
                shadow-md
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
            ">
                <div
                    className="
                flex-grow 
                overflow-auto
                whitespace-normal
                w-96
            ">
                    <div className="flex items-center">
                        {pinned && <GoLinkStar/>}
                        <p className="font-bold text-xl lg:text-2xl">
                            {goUrl}
                        </p>
                    </div>
                    <p className="text-base">{description}</p>
                </div>
                <div className="flex ml-3">
                    <span className="float-right">
                        <EditAndDelete id={id} goUrl={goUrl} url={url} description={description} pinned={pinned}/>
                    </span>
                    <span className="float-right">
                        <GoLinkIcon />
                    </span>
                </div>
            </a>
            <dialog id={editModalId} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold py-4 text-xlg">Create GoLink</h3>

                    <label className="my-2 input input-bordered flex items-center gap-2">
                        Go Link Title: 
                        <input type="text" className="grow text-gray-900" placeholder="The SSE Website" value={newTitle} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label className="my-2 input input-bordered flex items-center gap-2">
                        Go Link URL: 
                        <input type="text" className="grow text-gray-900" placeholder="sse.rit.edu" value={newUrl} onChange={(e) => setUrl(e.target.value)} />
                    </label>

                    <textarea className="textarea textarea-bordered w-full" placeholder="Description (keep it short please)" value={newDescription} onChange={(e) => setDescription(e.target.value)}></textarea>

                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">Pinned</span> 
                            <input type="checkbox" className="checkbox" checked={newPinned} onChange={(e) => setPinned(e.target.checked)} />
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">Officer (Won't be publicly shown)</span> 
                            <input type="checkbox" className="checkbox" checked={officer} onChange={(e) => setOfficer(e.target.checked)} />
                        </label>
                    </div>

                    <div className="flex">
                        <span className="flex-grow"></span>

                        <div className="modal-action">
                            <form method="dialog">
                                <button className="btn" onClick={() => {
                                    handleEdit();
                                }}>
                                    Edit (Refresh to see results)
                                </button>
                            </form>
                        </div>

                        <span className="w-2"></span>

                        <div className="modal-action">
                            <form method="dialog">
                                <button className="btn" onClick={() => {
                                    handleCancel(); 
                                    (document.getElementById(editModalId) as HTMLDialogElement).close(); 
                                }}>
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
                                <button className="btn" onClick={() => {
                                    handleDelete(); 
                                    (document.getElementById(deleteModalId) as HTMLDialogElement).close(); 
                                }}>
                                    Delete
                                </button>
                            </form>
                        </div>

                        <span className="w-2"></span>

                        <div className="modal-action">
                            <form method="dialog">
                                <button className="btn" onClick={() => {
                                    handleCancel(); 
                                    (document.getElementById(deleteModalId) as HTMLDialogElement).close(); 
                                }}>
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}

const EditAndDelete: React.FC<GoLinkProps> = ({ id, goUrl, url, description, pinned } ) => {
    const { data: session } = useSession();
    if(session) {
        return (
            <form>
                <div className="flex flex-row">
                    <div className="pr-1">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                console.log(`edit-golink-${id}`)
                                if(document) {
                                    (document.getElementById(`edit-golink-${id}`) as HTMLFormElement).showModal();
                                }
                            }}
                            className="rounded-md hover:scale-150">
                            <GoLinkEdit />
                        </button>
                    </div>
                    <div className="pr-1">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                if(document) {
                                    (document.getElementById(`delete-golink-${id}`) as HTMLFormElement).showModal();
                                }
                            }}
                            className="rounded-md hover:scale-150">
                            <GoLinkDelete />
                        </button>
                    </div>
                </div>
            </form>
        )
    }
}

export default GoLink;
