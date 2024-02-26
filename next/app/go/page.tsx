import GoLinksContainer from "@/app/go/GoLinksContainer";
import PinnedGoLinksContainer from "@/app/go/PinnedGoLinksContainer";
import { GoLinkProps } from "./GoLink";
import goLinkData from "./goLinkData";

export interface GoLinksContainerProps {
    // goLinkData: GoLinkProps[];
}

const GoLinksPage = () => {
    return (
        <>
            {/* <PinnedGoLinksContainer goLinkData ={goLinkData}/> */}
            <GoLinksContainer/>
        </>
    )
}

export default GoLinksPage;