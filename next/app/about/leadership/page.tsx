// import MemberCard from './MemberCard/page';
import { GitHub, LinkedIn, Email } from "../../../components/common/Icons";
export default function Leadership() {
  const team = {
    primary_officers: [
      {
        avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
        name: "Jonathan Cruz",
        title: "President",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/3.jpg",
        name: "Dominique Smith-Rodriguez",
        title: "Vice President",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/4.jpg",
        name: "Brendan Young",
        title: "Treasurer",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
        name: "Fabi Marrufo Lopez",
        title: "Secretary",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
    ],
    committee_heads: [
      {
        avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
        name: "Joe Baillie",
        title: "Tech Apprentice",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
        name: "Tess Hacker",
        title: "Talks",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/3.jpg",
        name: "Adam Gilbert",
        title: "Events",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/4.jpg",
        name: "Jakob Langtry",
        title: "Public Relations",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/5.jpg",
        name: "Eloise Christian",
        title: "Mentoring",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/6.jpg",
        name: "Kaelyn Beeman",
        title: "Marketing",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
        email: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/7.jpg",
        name: "Emily Chrisostomo",
        title: "Student Outreach",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
      },
      {
        avatar: "https://randomuser.me/api/portraits/lego/8.jpg",
        name: "Ryan Webb",
        title: "Tech",
        desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
        linkedin: "javascript:void(0)",
        github: "javascript:void(0)",
      },
    ],
  };

  return (
    <>
      <section className="mt-16">
        <div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
          <div className="content-center">
            {/* Meet our team */}
            <div className="max-w-xl mx-auto">
              <h1
                className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
              >
                Meet our team
              </h1>
              <p className="mt-3 text-xl leading-8">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Lorem,
                ipsum dolor sit amet consectetur adipisicing elit. Lorem, ipsum
                dolor sit amet consectetur.
              </p>
            </div>
          </div>

          {/* Primary Officers */}
          <div className="my-20">
            <h3 className="text-xl font-extrabold text-primary-focus sm:text-3xl my-12">
              Primary Officers
            </h3>
            <div className="">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.primary_officers.map((item, idx) => (
                  <MemberCard key={idx} item={item} />
                ))}
              </div>
            </div>
          </div>
          {/* Committee Heads */}
          <div className="mt-20">
            <h3 className="text-xl font-extrabold text-primary-focus sm:text-3xl mb-12">
              Committee Heads
            </h3>
            <div className="">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {team.committee_heads.map((item, idx) => (
                  <MemberCard key={idx} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const MemberCard = ({ item }) => {
  return (
    <div className="mt-4">
      <div className="w-24 h-24 mx-auto">
        <img src={item.avatar} className="w-full h-full rounded-full" alt="" />
      </div>
      <div className="mt-2">
        <h4 className="font-bold sm:text-lg text-primary-focus">{item.name}</h4>
        <p className="font-semibold">{item.title}</p>
        <p className="mt-2 px-2">{item.desc}</p>
        <div className="mt-4 flex justify-center gap-4 text-gray-400">
          <a href={item.linkedin}>
            <LinkedIn />
          </a>
          <a href={item.github}>
            <GitHub />
          </a>
          <a href={item.email}>
            <Email />
          </a>
        </div>
      </div>
    </div>
  );
};
