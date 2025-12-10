import ReactMarkdown from "react-markdown";

interface MarkdownProps {
    content: string;
}

export default function Markdown({ content }: MarkdownProps) {
    return (
        <ReactMarkdown
            components={{
                p: ({ node, ...props }) => <p className="text-base" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    );
}