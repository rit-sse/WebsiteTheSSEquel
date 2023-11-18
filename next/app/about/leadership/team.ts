export interface TeamMember {
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
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Jonathan Cruz",
      title: "President",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Dominique Smith-Rodriguez",
      title: "Vice President",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Brendan Young",
      title: "Treasurer",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Fabi Marrufo Lopez",
      title: "Secretary",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
  ],
  committee_heads: [
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Joe Baillie",
      title: "Tech Apprentice",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Tess Hacker",
      title: "Talks",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Adam Gilbert",
      title: "Events",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Andres Ceinos",
      title: "Projects",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Sadman Islam",
      title: "Career Development",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Jakob Langtry",
      title: "Public Relations",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Eloise Christian",
      title: "Mentoring",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Kaelyn Beeman",
      title: "Marketing",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
      email: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Emily Chrisostomo",
      title: "Student Outreach",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
    },
    {
      avatar: `https://source.boringavatars.com/beam/${Math.floor(Math.random() * 100)}/?colors=A4C7F4,6196D6,6196D6,161F27,F0F4F9`,
      name: "Ryan Webb",
      title: "Tech",
      desc: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, eius amet consectetur.",
      linkedin: "#",
      github: "#",
    },
  ],
} satisfies Team;