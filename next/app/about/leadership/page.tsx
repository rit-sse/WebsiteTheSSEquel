import { GitHub, LinkedIn, Email } from '../../../components/common/Icons';

export default function Leadership() {

    const team = {
        'primary_officers': [
            {
                avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
                name: "Jonathan Cruz",
                title: "President",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/3.jpg",
                name: "Dominique Smith-Rodriguez",
                title: "Vice President",
                // desc: "Lorem Ipsum is simply dummy text of the printing.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/4.jpg",
                name: "Brendan Young",
                title: "Treasurer",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
                name: "Fabi Marrufo Lopez",
                title: "Secretary",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
        ],
        'committee_heads': [
            {
                avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
                name: "Joe Baillie",
                title: "Tech Apprentice",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/2.jpg",
                name: "Tess Hacker",
                title: "Talks",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/3.jpg",
                name: "Adam Gilbert",
                title: "Events",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/4.jpg",
                name: "Jakob Langtry",
                title: "Public Relations",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },
            {
                avatar: "https://randomuser.me/api/portraits/lego/5.jpg",
                name: "Eloise Christian",
                title: "Mentoring",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },            {
                avatar: "https://randomuser.me/api/portraits/lego/6.jpg",
                name: "Kaelyn Beeman",
                title: "Marketing",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
                email: "javascript:void(0)"
            },            {
                avatar: "https://randomuser.me/api/portraits/lego/7.jpg",
                name: "Emily Chrisostomo",
                title: "Student Outreach",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
            },            {
                avatar: "https://randomuser.me/api/portraits/lego/8.jpg",
                name: "Ryan Webb",
                title: "Tech",
                // desc: "Lorem Ipsum is simply dummy text of the printing and typesettin industry.",
                linkedin: "javascript:void(0)",
                github: "javascript:void(0)",
            },
        ]
}
    
    return (
      <>
        <section className="text-slate-200">
            <div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
                <div className="content-center">
                    {/* Meet our team */}
                    <div className="max-w-xl mx-auto">
                        <h3 className="text-3xl font-semibold sm:text-5xl">
                            Meet our team
                        </h3>
                        <p className="text-gray-400 mt-3">
                            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Lorem, ipsum dolor sit amet consectetur adipisicing elit.  Lorem, ipsum dolor sit amet consectetur.
                        </p>
                    </div>

                    {/* Primary Officers */}
                    <div className="my-12">
                        <h3 className="text-xl font-semibold sm:text-3xl m-6">
                                Primary Officers
                        </h3>
                        <div className="mt-12">
                            <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                                {
                                    team.primary_officers.map((item, idx) => (
                                        <li key={idx}>
                                            <div className="w-24 h-24 mx-auto">
                                                <img
                                                    src={item.avatar}
                                                    className="w-full h-full rounded-full"
                                                    alt=""
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <h4 className="text-gray-200 font-semibold sm:text-lg">{item.name}</h4>
                                                <p className="text-indigo-300">{item.title}</p>
                                                <p className="text-gray-300 mt-2 px-2">{item.desc}</p>
                                                <div className="mt-4 flex justify-center gap-4 text-gray-400">
                                                    <a href={item.linkedin}><LinkedIn/></a>
                                                    <a href={item.github}><GitHub/></a>
                                                    <a href={item.email}><Email/></a>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Committee Heads */}
                <div className="">
                    <h3 className="text-xl font-semibold sm:text-3xl m-6">
                        Committee Heads
                    </h3>
                    <div className="mt-12">
                        <ul className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                            {
                                team.committee_heads.map((item, idx) => (
                                    <li key={idx}>
                                        <div className="w-24 h-24 mx-auto">
                                            <img
                                                src={item.avatar}
                                                className="w-full h-full rounded-full"
                                                alt=""
                                            />
                                        </div>
                                        <div className="mt-2">
                                            <h4 className="text-gray-200 font-semibold sm:text-lg">{item.name}</h4>
                                            <p className="text-indigo-300">{item.title}</p>
                                            <p className="text-gray-300 mt-2 px-2">{item.desc}</p>
                                            <div className="mt-4 flex justify-center gap-4 text-gray-400">
                                                <a href={item.linkedin}><LinkedIn/></a>
                                                <a href={item.github}><GitHub/></a>
                                                <a href={item.email}><Email/></a>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            </div>
        </section>
      </>
    );
  }