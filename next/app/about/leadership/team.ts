interface TeamMember {
  avatar: string;
  name: string;
  title: string;
  desc: string;
  linkedin?: string; 
  github?: string;
  email?: string;
}

export interface Team {
  primary_officers: TeamMember[];
  committee_heads: TeamMember[];
}

export const teamData = {
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