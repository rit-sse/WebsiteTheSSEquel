import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";
import { useSession } from "next-auth/react";

export const GoLinkButton: React.FC = () =>  {
    const { data: session } = useSession()
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
                            <input type="text" className="grow text-gray-900" placeholder="The SSE Website" />
                        </label>
                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Go Link URL: 
                            <input type="text" className="grow" placeholder="sse.rit.edu" />
                        </label>

                        <textarea className="textarea textarea-bordered w-full" placeholder="Description (keep it short please)"></textarea>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">Pinned</span> 
                                <input type="checkbox" className="checkbox" />
                            </label>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="label-text">Officer (Won't be publicly shown)</span> 
                                <input type="checkbox" className="checkbox" />
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
                                    <button className="btn">
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