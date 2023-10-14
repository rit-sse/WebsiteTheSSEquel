import { Children } from "react";

const ZCard: React.FC<{
    imageSide: "left" | "right";
    children: React.ReactNode;
  }> = ({ imageSide, children }) => {
    const [left, right, ...rest] = Children.toArray(children);
  
    if (rest.length > 0) throw new Error("ZCard can only have two children");
  
    const classLeft = imageSide === 'left' ? "w-full md:w-1/2" : "w-full md:w-1/2";
    const classRight = imageSide === 'right' ? "w-full md:w-1/2" : "w-full md:w-1/2";
    const flexDirection = imageSide === 'left' ? 'flex-col md:flex-row' : 'flex-col-reverse md:flex-row';
  
    return (
      <div className= {`flex ${flexDirection} items-center gap-24`}>
        <div className={classLeft}>{left}</div>
        <div className={classRight}>{right}</div>
      </div>
    );
  };

  export default ZCard;