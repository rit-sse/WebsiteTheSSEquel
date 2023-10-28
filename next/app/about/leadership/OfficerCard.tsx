import { GitHub, LinkedIn, Email } from "../../../components/common/Icons";

interface OfficerCardProps {
  item: {
    avatar: string;
    name: string;
    title: string;
    desc: string;
    linkedin: string;
    github: string;
    email: string;
  };
}

export default function OfficerCard({ item }: OfficerCardProps) {
  let iconColor: string = "";

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
            <LinkedIn color={iconColor} />
          </a>
          <a href={item.github}>
            <GitHub color={iconColor} />
          </a>
          <a href={item.email}>
            <Email color={iconColor} />
          </a>
        </div>
      </div>
    </div>
  );
}
