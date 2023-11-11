// The default height and width for the placeholder dummy photo
const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`
const defaultDescription = `This is a description of the committee. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                            sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                            porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                            Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                            Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.`

export default [
    {
        imageSrc: defaultImage,
        title: 'General Meeting',
        body: `A great way to get involved is by being on this page! There are many ways to get involved
                    whether you are a computing major or non computing major. This can range from going to general
                    meetings to participating in projects or you can even start a project of your own! Simply walking
                    into the lab and sitting in on a general meeting to understand what is happening is a great way to
                    start. This provides an opportunity to gain insights into our ongoing activities and operations,
                    allowing you to assess potential areas of interest for your engagement. Please feel free to stop by
                    for a meeting every Friday at 3:00 PM in GOL-1670.`
    },
    {
        imageSrc: defaultImage,
        title: 'Mentoring',
        body: `If you have any questions about anything that is related to software engineering, 
                    computer science, computational mathematics, or game design please feel free to come talk to walk 
                    right in and ask one one of our mentors. Mentoring is open Monday to Friday from 10AM to 6PM. You 
                    can check out the mentoring schedule of the times for each mentor. However, if you would like to apply 
                    to help out as a mentor, please reach out to our Mentoring Head, Eloise Christian.`
    },
    {
        imageSrc: defaultImage,
        title: 'Talks',
        body: `We don't always talk about computing related topics, we often delve into diverse topics, such as 
                    the amusing appearances of various aquatic creatures. Our enthusiasm for this particular subject matter has led 
                    to the establishment of Funny Fish Friday, a designated day for engaging in lively conversations about these quirky 
                    aquatic beings. If you would like to give a talk of your own please reach out to our Talk Head, Tess Hacker.`
    },
    {
        imageSrc: defaultImage,
        title: 'Cleaning',
        body: `With all this happening, the lab can get a bit messy. 
                    This is a great opportunity to gain membership here by participating 
                    in lab cleanup sessions!`
    }
]