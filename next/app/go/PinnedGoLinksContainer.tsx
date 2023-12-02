import { GoLinksContainerProps } from "@/app/go/page";
import PinnedGoLink from "./PinnedGoLink";

const PinnedGoLinksContainer: React.FC<GoLinksContainerProps> = ({goLinkData}) => {
        const goLinkList = goLinkData.slice(0,7).map((data, index) => (
               <div className="carousel-item" key={index}>
                <PinnedGoLink {...data}/>
                </div>
            ));
        return (
                <div>
                  <div className = "carousel carousel-end max-w-screen-md mx-auto" >
                        {goLinkList}
                  </div> 
                </div>
        )
        
}


export default PinnedGoLinksContainer;