import { GoLinkStar } from "@/components/common/Icons";

export default function PinnedGoLink({goUrl, url, description} : {goUrl: string, url: string, description: string}) {
    return (
        <a
            href = {url}
            target = "_blank"
            className ="
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
            mx-2"
            >
                <div className="flex items-center">
                    {/* {<GoLinkStar/>} */}
                    <p className="font-bold text-2xl">
                        {goUrl}
                    </p>
                </div>
                {/* <div className = "flex-grow overflow-auto whitespace-normal w-96">
                    <p className = "font-bold text-2xl">
                        <GoLinkStar />
                        {goUrl}
                    </p>
                    { <p className = "text-base">{description}</p> }

                </div> */}


            </a>
    )
}