import GoLinksContainer from "@/app/go/GoLinksContainer";
import PinnedGoLinksContainer from "@/app/go/PinnedGoLinksContainer";
import { GoLinkProps } from "./GoLink";
import goLinkData from "./GoLinkData";

export interface GoLinksContainerProps {
    goLinkData: GoLinkProps[];
}

const GoLinksPage = () => {
    return (
        <>
            {/* <PinnedGoLinksContainer goLinkData ={goLinkData}/> */}
            <GoLinksContainer goLinkData={goLinkData} />
        </>
    )
}

export default GoLinksPage;