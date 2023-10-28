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
    <div>
        <p>Shortlink: {shortlink}</p>
        <p>URL: {url}</p>
        <p>Description: {description}</p>
    </div>
  );
}
