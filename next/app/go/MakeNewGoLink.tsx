import { useSession } from "next-auth/react";
import { useState } from "react";

export const GoLinkButton: React.FC = () =>  {
    const { data: session } = useSession()
    const [title, setTitle] = useState(""); 
    const [url, setUrl] = useState(""); 
    const [description, setDescription] = useState(""); 
    const [pinned, setPinned] = useState(false); 
    const [officer, setOfficer] = useState(false); 
    
    const resetValues = () => {
        setTitle(""); 
        setUrl(""); 
        setDescription(""); 
        setPinned(false);  
        setOfficer(false); 
    };


    if(session){
        return (
            <>
                <button 
                onClick={(func) =>{
                    func.preventDefault();
                    if(document) {
                        (document.getElementById('create-golink') as HTMLFormElement).showModal();
                    }
                    }
                }
                className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl"
                >Create Go Link
                </button>

                <dialog id="create-golink" className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold py-4 text-xlg">Create GoLink</h3>

                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Go Link Title: 
                            <input type="text" className="grow text-gray-900" placeholder="The SSE Website" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </label>
                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Go Link URL: 
                            <input type="text" className="grow" placeholder="sse.rit.edu" value={url} onChange={(e) => setUrl(e.target.value)} />
                        </label>

                        <textarea className="textarea textarea-bordered w-full" placeholder="Description (keep it short please)" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">Pinned</span> 
                                <input type="checkbox" className="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
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
                                    <button className="btn">
                                        Create
                                    </button>
                                </form>
                            </div>

                            <span className="w-2"></span>

                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn" onClick={() => {
                                        resetValues(); // Reset values when "Cancel" button is clicked
                                        (document.getElementById('create-golink') as HTMLDialogElement).close(); // Close the modal
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
}

export default GoLinkButton;