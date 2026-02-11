
interface ButtonProps {
    textContent: string;
    className?: string;
    onClick: () => void;
}

export default function Button({ textContent, className, onClick }: ButtonProps) {
    return (
        <button
            aria-label={textContent}
            className={`rounded-[10px] px-3 py-1 m-3 bg-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-primary-foreground font-medium transition-colors ${className}`}
            onClick={() => onClick()}
        >
            {textContent}
        </button>
    );
}