"use client"

import { GoLinksContainerProps } from "@/app/go/page";
import PinnedGoLink from "./PinnedGoLink";

const PinnedGoLinksContainer: React.FC<GoLinksContainerProps> = ({ goLinkData }) => {
    const goLinkList = goLinkData.slice(0, 7).map((data, index) => (
        <div className="carousel-item" key={index} id={`item-${index}`}>
            <PinnedGoLink {...data} />
        </div>
    ));

    return (
        <>
            <div className="carousel carousel-center max-w-screen-md mx-auto" >
                {goLinkList}
            </div>
            <div className="flex justify-center w-full py-2 gap-2">
                {goLinkData.slice(0, 7).map((_, index) => (
                    <a href={`#item-${index}`} className="btn btn-xs" id={`carousel-item-${index}`} key={index} onClick={e => {
                        setTimeout(() => {
                            const targetPos = document.getElementById(`carousel-item-${index}`)!.offsetTop;
                            const navbarHeight = document.getElementById('navbar')!.offsetHeight;
                            window.scrollTo(0, targetPos - 100 * navbarHeight)
                        }, 1);
                    }} >
                        {index + 1}
                    </a>
                ))}
            </div>
        </>
    )

}


export default PinnedGoLinksContainer;