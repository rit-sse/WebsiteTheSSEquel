import { Children } from 'react';

/*  An element used with text next to an image to alternate which side the image is on
    Delcarations:
      image(string left or right): declares which side the image will be in relation to the text
*/
const ZCard: React.FC<{
  imageSide: 'left' | 'right';
  children: React.ReactNode;
}> = ({ imageSide, children }) => {
  const [left, right, ...rest] = Children.toArray(children);

  if (rest.length > 0) throw new Error("ZCard can only have two children");

  const classLeft = imageSide === 'left' ? "w-full md:w-1/3" : "w-full md:w-2/3";
  const classRight = imageSide === 'right' ? "w-full md:w-1/3" : "w-full md:w-2/3";
  const flexDirection = imageSide === 'left' ? 'flex-col md:flex-row' : 'flex-col-reverse md:flex-row';

  return (
    <div className={`flex ${flexDirection} items-center gap-24 gap-y-0`}>
      <div className={classLeft}>{left}</div>
      <div className={classRight}>{right}</div>
    </div>
  );
};

export default ZCard;