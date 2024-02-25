import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";

export const GoLinkButton: React.FC = () =>  {
    return (
        <button className="
        btn
        p-4
        h-full
        bg-base-100
        rounded-md
        shadow-md
        hover:shadow-lg
        transition-shadow
        border-2
        border-base-content
        hover:border-info
        ">Make New Go-Link</button>
    );
}

export default GoLinkButton;