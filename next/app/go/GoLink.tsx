export default function GoLink({
    shortlink,
    url,
    description,
} : {
    shortlink: string,
    url: string,
    description: string,
}) {
  return (
    <div className="
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
        <p>Shortlink: <a
            href={url}
            target="_blank"
            className="text-primary hover:underline"
        >{shortlink}</a></p>
        <p>Description: {description}</p>
    </div>
  );
}
