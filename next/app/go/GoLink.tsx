export default function GoLink({
    goUrl,
    url,
    description,
    canEdit = false,
} : {
    goUrl: string,
    url: string,
    description: string,
    canEdit: boolean,
}) {
  return (
    <a
        href={url}
        target="_blank"
        className="
            flex flex-col
            p-4
            bg-base-100
            rounded-md
            shadow-md
            hover:shadow-lg
            transition-shadow
            border-2
            border-base-content
    ">
        <p
            className="font-bold text-2xl"
        >{goUrl}</p>
        <p className="text-base">{description}</p>
    </a>
  );
}
