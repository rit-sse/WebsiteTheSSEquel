/*  Creates a div for each committee storing the committee name and description
    Params:
      name(string): the name of the committee
      description(string): a description of the committee
      textSide(string): if the text is on the left or the right of the image
*/
const CommitteeSlot: React.FC<{
    name: string;
    description: string;
    textSide: 'left' | 'right';
  }> = ({ textSide, name, description }) => {
    const textClass = textSide === 'left' ? 'text-left' : 'text-right';
    const generalClasses = 'text-left pt-4 pb-32 md:py-16 md:' + textClass
    const nameClasses = 'bg-clip-text font-bold text-3xl/[3rem]'
    const descriptionClasses = 'mt-4 pb-4 text-xl/relaxed'
  
    return (
      <div className={generalClasses}>
        <h2
          className={nameClasses}
        >
          {name}
        </h2>
  
        <p className={descriptionClasses}>
          {description}
        </p>
      </div>
    );
  };

export default CommitteeSlot;