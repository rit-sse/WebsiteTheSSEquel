import { GoLinkDelete, GoLinkEdit } from "@/components/common/Icons";
import { useSession } from "next-auth/react";
import { useState } from "react";

export interface GoLinkModalProps {
    goUrl: string;
    url: string;
    description: string;
    pinned: boolean;
}

export const EditAndDelete: React.FC<GoLinkModalProps> = ({ goUrl, url, description, pinned}) =>  {
    const { data: session } = useSession();
    const [title, setTitle] = useState(goUrl); 
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

    
    if(session) {
        const editModalId = `edit-golink-${url}`; // Dynamic ID for edit modal
        const deleteModalId = `delete-golink-${url}`; // Dynamic ID for delete modal
        return (
            <>
                <form>
                    <div className="flex flex-row">
                        <div className="pr-1">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(document) {
                                        (document.getElementById(`edit-golink-${url}`) as HTMLFormElement).showModal();
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
                                        (document.getElementById(`delete-golink-${url}`) as HTMLFormElement).showModal();
                                    }
                                }}
                                className="rounded-md hover:scale-150">
                                <GoLinkDelete />
                            </button>
                        </div>
                    </div>
                </form>
                <dialog id={editModalId} className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold py-4 text-xlg">Create GoLink</h3>

                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Go Link Title: 
                            <input type="text" className="grow text-gray-900" placeholder="The SSE Website" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                                        // handleEdit();
                                    }}>
                                        Edit
                                    </button>
                                </form>
                            </div>

                            <span className="w-2"></span>

                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn" onClick={() => {
                                        handleCancel(); 
                                        (document.getElementById('create-golink') as HTMLDialogElement).close(); 
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
                                    <button className="btn">
                                        Delete
                                    </button>
                                </form>
                            </div>

                            <span className="w-2"></span>

                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn">
                                        Cancel
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </dialog>
            </>
        )
    }
}

export default EditAndDelete;