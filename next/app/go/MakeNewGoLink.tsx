import { useSession } from "next-auth/react";
import { useState } from "react";
import { CreateGoLinkProps } from "./page";

export const GoLinkButton: React.FC<CreateGoLinkProps> = ({fetchData}) =>  {
    const { data: session } = useSession()
    const [title, setTitle] = useState(""); 
    const [url, setUrl] = useState(""); 
    const [description, setDescription] = useState(""); 
    const [pinned, setPinned] = useState(false); 
    const [officer, setOfficer] = useState(false); 
    
    const handleSetTitle = (givenTitle: string) => {
        const title = givenTitle.toLowerCase().split(' ').join('-')
        setTitle(title)
    }

    const handleCancel = () => {
        setTitle(""); 
        setUrl(""); 
        setDescription(""); 
        setPinned(false);  
        setOfficer(false); 
    };

    const handleCreate = async () => {
        try {            
            const response = await fetch('http://localhost:3000/api/golinks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // In body, make sure parameter names MATCH the ones in api/golinks/route.ts for the POST request
                // Left is backend parameter names, right is our front end names
                // golink = backend parameter name --- title = frontend parameter name
                //
                // I messed up when I did this with the edit API call, it wasn't saving the title because of that.
                body: JSON.stringify({
                    golink: title,
                    url: url,
                    description: description,
                    isPinned: pinned,
                    isPublic: !officer // If it is officer, it is not public
                }),
            });

            if (response.ok) {
                handleCancel(); 
                (document.getElementById('create-golink') as HTMLDialogElement).close(); 
                fetchData();
            }
        } catch (error) {}
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
                            <input type="text" className="grow text-gray-900" placeholder="The SSE Website" value={title} onChange={(e) => handleSetTitle(e.target.value)} />
                        </label>
                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Go Link URL: 
                            <input type="text" className="grow text-gray-900" placeholder="sse.rit.edu" value={url} onChange={(e) => setUrl(e.target.value)} />
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
                                    <button className="btn" onClick={() => {
                                        handleCreate();
                                        // In handleCreate, if it goes well it will close the Modal.
                                    }}>
                                        Create
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
            </>
            
        );
    }
}

export default GoLinkButton;