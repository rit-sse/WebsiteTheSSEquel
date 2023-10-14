interface ExternalHyperlinkTextProps {
    route: string;
    text: string;
}

const ExternalHyperlinkText: React.FC<ExternalHyperlinkTextProps> = ({
    route,
    text,
}) => (
    <a
        aria-label={text}
        href={route}
        target="_blank"
        rel="noreferrer"
        className="whitespace-nowrap text-center text-primary 
               hover:underline focus:underline transition-all outline-offset-4"
    >
        {text}
    </a>
);

export default ExternalHyperlinkText;
