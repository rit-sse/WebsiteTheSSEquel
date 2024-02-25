import { GoLinkIcon } from "@/components/common/Icons";
import { GoLinkStar } from "@/components/common/Icons";

export const GoLinkButton: React.FC = () =>  {
    return (
        <button className="

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
        text-xl
        ">Make New Go Link </button>
    );
}

export default GoLinkButton;