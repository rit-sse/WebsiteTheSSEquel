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
            <div className="ml-3">
                <span className="float-right">
                    <GoLinkIcon />
                </span>
                <span className="float-right">
                    <EditAndDelete />
                </span>
            </div>
        </a>
    );
}

const EditAndDelete: React.FC = () => {
    const { data: session } = useSession();
    if(session) {
        return (
            <form>
                <div className="flex flex-row">
                    <div className="pr-1">
                        <button className="rounded-md hover:scale-150">
                            <GoLinkEdit />
                        </button>
                    </div>
                    <div className="pr-1">
                        <button className="rounded-md hover:scale-150">
                            <GoLinkDelete />
                        </button>
                    </div>
                </div>
            </form>
        )
    }
}

export default GoLink;
