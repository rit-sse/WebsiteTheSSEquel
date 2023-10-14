import Image from 'next/image'
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


export default function Committees() {
  // The default height and width for the placeholder dummy photo
  const placeholder_w = 540;
  const placeholder_h = 400;

  // the image being used in all ZCards currently
  const placeholder_img = (
    <Image
      src={`https://dummyimage.com/${placeholder_w}x${placeholder_h}`}
      alt="Placeholder"
      width={placeholder_w}
      height={placeholder_h}
      className="w-full h-auto rounded-md"
    />
  );

  return (
    <>
      <section>
        <div className="flex flex-col items-center max-w-screen-xl">            
            <div className="mx-auto px-4 sm: py-16 md:pb-8 max-w-2xl">
                <div className="text-center flex flex-col items-center w-full">
                    <h1
                    className="bg-gradient-to-t from-primary to-secondary bg-clip-text
                                text-4xl/[3rem] font-extrabold text-transparent md:text-5xl/[4rem]"
                    >
                    Committees
                    </h1>

                    <p className="mx-auto mt-4 text-xl/relaxed">
                    The Society of Software Engineers delegates responsibility for tasks with committees. These
                    committees play pivotal roles in organizing events, facilitating projects, providing platforms for
                    knowledge exchange, and more. Together we create opportunities for members to connect,
                    collaborate, and learn from one another.

                    </p>
                </div>
            </div>

            <div id='Committee Slots' className='pt-4'>
              <ZCard imageSide='left'>
                {placeholder_img}
                <CommitteeSlot
                  textSide='left'
                  name='Events'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
              </ZCard>

              <ZCard imageSide='right'>
                <CommitteeSlot
                  textSide='right'
                  name='Talks'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
                {placeholder_img}
              </ZCard>

              <ZCard imageSide='left'>
                {placeholder_img}
                <CommitteeSlot
                  textSide='left'
                  name='Public Relations'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
              </ZCard>

              <ZCard imageSide='right'>
                <CommitteeSlot
                  textSide='right'
                  name='Mentoring'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
                  {placeholder_img}
              </ZCard>

              <ZCard imageSide='left'>
                {placeholder_img}
                <CommitteeSlot
                  textSide='left'
                  name='Marketing'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
              </ZCard>

              <ZCard imageSide='right'>
                <CommitteeSlot
                  textSide='right'
                  name='Student Outreach'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
                  {placeholder_img}
              </ZCard>

              <ZCard imageSide='left'>
                {placeholder_img}
                <CommitteeSlot
                  textSide='left'
                  name='Tech Committee'
                  description='This is a description of the committee. Lorem ipsum dolor sit amet,
                                consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                                sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                                porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                                Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                                Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.'
                  />
              </ZCard>
            </div>
        </div>
      </section>
    </>
  );
}