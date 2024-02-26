import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";
import { useSession } from "next-auth/react";

export const GoLinkButton: React.FC = () =>  {
    const { data: session } = useSession()
    if(session){
        return (
            <button 
            onClick={(func) =>{
                func.preventDefault();
                if(document) {
                    (document.getElementById('make_new_link') as HTMLFormElement).showModal();
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
            >Make New Go Link
            <dialog id="make_new_link" className="modal">
                <div className="modal-box">
                    <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Make New Go Link</h3>
                    <p className="py-4">Press ESC key or click on ✕ button to close</p>
                </div>
            </dialog>
            </button>
            
        );
    }
}

export default GoLinkButton;