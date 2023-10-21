import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';
import { getPostData } from "@/lib/posts";

export default async function PrimaryOfficersPolicy() {
    const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/primary-officers-policy.md");

  //console.log(postData.props.htmlContent);

  return (
    <>
      <div></div>

      <div dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
    </>
  );

    /*return(<>
        <section className="text-slate-200">
            <div className="text-center flex flex-col items-center w-full max-w-xl">
              <h1
                className="bg-gradient-to-r from-primary to-secondary bg-clip-text
                           text-4xl/[3rem] font-extrabold text-transparent sm:text-5xl/[4rem]"
              >
                Primary Officer's Policy
              </h1>
            </div>
        </section>
        <div className="text-left">
            <h2 className="font-bold text-xl mt-6">
                Introduction
            </h2>
              <p className="text-left mx-auto mt-1 max-w-2xl">
              The Primary Officers' Policy is a living document that chronicles 
              the rules and procedures of the Society of Software Engineers. It is required by the SSE Constitution.
              </p>
              <br></br>
              <h2 className="font-bold text-xl">
                Goals
            </h2>
              <p className="text-left mx-auto mt-1 max-w-2xl">
              Our primary goals for the 2023/2024 academic year are to:
              <br></br>
              Continue to strengthen the areas of the Society that have been successful
              <br></br>
              Strengthen the Society's image within RIT, the Software Engineering Department, and software engineering communities
              <br></br>
              Continue to grow the Society's membership, especially with new students
              <br></br>
              Continue to provide quality mentoring services
              <br></br>
              Encourage a transparent organization
              </p>
              <br></br>

              <h2 className="font-bold text-xl">
                Primary Officer Responsibilities
            </h2>
            <p className="font-bold text-lg mt-1">
                President
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Run the Society
            <br></br>
            Interact with Software Engineering department and the GCCIS leadership
            </p>
            <p className="font-bold text-lg mt-1">
                Vice President
            </p>
        
            Help the President run the Society
            <br></br>
            Work with committees on a regular basis to help them succeed
            <p className="font-bold text-lg mt-1">
                Treasurer
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Track current funds for SSE main bank account and projects bank account
            <br></br>
            Approve all financial transactions for the organization
            <br></br>
            Maintain who is allowed to make transactions with the SSE procurement card
            <br></br>
            Make bank deposits on a regular basis
            <br></br>
            Oversee all committee positions that make regular transactions
            <br></br>
            Organize the design and sale of merchandise with the Society's branding
            </p>
            <p className="font-bold text-lg mt-1">
                Secretary
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Document the Society
            <br></br>
            Track membership
            <br></br>
            Keep the Society's members informed with current events and news
            <br></br>
            Manage the Society's brand throughout RIT
            </p>
            <br></br>
            <h2 className="font-bold text-xl">
                Committees
            </h2>
            <p className="text-left mx-auto mt-1 max-w-2xl">
            The SSE currently has officers in charge of the following committees:
            </p>
            <p className="font-bold text-lg mt-1">
                Mentoring
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Continue working with mentors and Lab Ops to keep the lab clean
            <br></br>
            Work with mentors for a less-direct tutoring method that stresses teaching methods and knowledge over information to a specific application
            <br></br>
            Handle the mentoring schedule
            <br></br>
            Work with mentors to update and create review session tests
            <br></br>
            Maintain the test cabinet
            <br></br>
            Collaborate with professors to ensure practice tests are in line with the current curriculum
            <br></br>
            Collect statistics for review sessions and mentoring hours
            </p>
            <p className="font-bold text-lg mt-1">
                Public Relations
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Create and maintain relationships with companies and recruiters
            <br></br>
            Maintain alumni relations
            <br></br>
            Organize and lead a committee of members to assist with these goals
            </p>
            <p className="font-bold text-lg mt-1">
                Student Outreach
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Coordinate the Society's section of Academic Day (Orientation)
            <br></br>
            Manage, organize, and carry out open houses and prospective student events
            <br></br>
            Organize and prepare a committee of students to represent the Society at these events
            </p>
            <p className="font-bold text-lg mt-1">
                Technology
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Maintain our infrastructure
            <br></br>
            Organize a committee of students to aid in the development and maintenance of the technology stack
            <br></br>
            Support projects and other technology needs within the Society
            </p>
            <p className="font-bold text-lg mt-1">
                Events
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Build a committee to help run events
            <br></br>
            Be present for as many events as possible
            <br></br>
            Keep members informed about events that are happening
            <br></br>
            Host a variety of events that cater to the current members' interests
            </p>
            <p className="font-bold text-lg mt-1">
                Winter Ball
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Plan and execute a formal social event to take place at the end of the fall semester
            <br></br>
            Organize and lead a committee of event planners to support them doing this
            </p>
            <p className="font-bold text-lg mt-1">
                Laboratory Operations
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Set up a routine and guidelines for keeping the lab neat and orderly
            <br></br>
            Build a committee dedicated to organizing the lab
            <br></br>
            Get supplies for the lab when needed
            </p>
            <p className="font-bold text-lg mt-1">
                Projects
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Handle project proposals
            <br></br>
            Liaison between individual project heads and the Society
            <br></br>
            Have weekly meetings for larger projects and bi-monthly meetings for smaller projects
            <br></br>
            Coordinate projects and volunteers for Imagine RIT
            </p>
            <p className="font-bold text-lg mt-1">
                Talks
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Coordinate frequent talk presentations
            <br></br>
            Have all talks recorded and posted to Facebook
            </p>
            <p className="font-bold text-lg mt-1">
                Career Development
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Ongoing mock interviews
            <br></br>
            Resume reviews
            <br></br>
            Highlight alternative paths and career options for people in computing
            <br></br>
            Slides in meetings for conferences, networking events
            <br></br>
            Slides with blurb from a co-op student about their experience
            </p>
            <p className="font-bold text-lg mt-1">
                Marketing
            </p>
            <p className="text-left mx-auto max-w-2xl">
            Post Slack announcements
            <br></br>
            Maintain social media (FB, twitter, instagram)
            <br></br>
            Collect pictures
            <br></br>
            Design and post posters
            </p>
            <br></br>
            <h2 className="font-bold text-xl">
                Membership
            </h2>
              <p className="text-left mx-auto mt-1 max-w-2xl">
              Each prospective member must complete one “significant contribution” to the Society, which includes but is not limited to:
              <br></br>
              Serving as a Primary Officer or Committee Head
              <br></br>
              Serving as a mentor
              <br></br>
              Significantly assisting with events, including Winter Ball
              <br></br>
              Actively contributing to a project
              <br></br>
              Helping clean the lab with Lab Ops
              <br></br>
              Participating in an Open House
              <br></br>
              Giving a talk
              <br></br>
              Donating exams
              <br></br>
              Contributing to the website
              <br></br>
              Giving mock interviews
              <br></br>
              Other donations not listed made to the Society as deemed appropriate by the Primary Officers
              <br></br>
              <br></br>
              For activities that occur within a committee, the Committee Head shall determine whether the individual's contribution is significant enough to warrant membership. Committee Heads shall not receive membership for individual tasks directly related to their appointed job.
              </p>
              <br></br>
              <h2 className="font-bold text-xl">
                Alumni Membership Application
            </h2>
              <p className="text-left mx-auto mt-1 max-w-2xl">
              Alumni may apply for Alumni Membership by contacting the Secretary
              </p>
            


        </div>
        </>
    )
    */
            
}