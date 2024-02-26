import Button from "@/components/common/Button";
import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";
import { GoLinkEdit } from "@/components/common/Icons";
import { GoLinkDelete } from "@/components/common/Icons";
import { useSession } from "next-auth/react";
export interface GoLinkProps {
    goUrl: string;
    url: string;
    description: string;
    pinned: boolean;
}

const GoLink: React.FC<GoLinkProps> = ({ goUrl, url, description, pinned }) => {

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
                    <EditAndDelete />
                </span>
                <span className="float-right">
                    <GoLinkIcon />
                </span>
            </div>
        </a>
        <dialog id="edit-go-link" className="modal">
            <div className="modal-box">
                <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
                <h3 className="font-bold text-lg">Hello!</h3>
                <p className="py-4">Press ESC key or click on ✕ button to close</p>
            </div>
        </dialog>
        <dialog id="delete-go-link" className="modal">
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
                    <form>
                        <button className="btn">
                            Delete
                        </button>
                    </form>
                    <span className="w-2"></span>
                    <form>
                        <button className="btn">
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </dialog>
        </>
    );
}

const EditAndDelete: React.FC = () => {
    const { data: session } = useSession();
    if(session) {
        return (
            <form>
                <div className="flex flex-row">
                    <div className="pr-1">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                if(document) {
                                    (document.getElementById('edit-go-link') as HTMLFormElement).showModal();
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
                                    (document.getElementById('delete-go-link') as HTMLFormElement).showModal();
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
