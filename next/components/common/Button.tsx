
interface ButtonProps {
    textContent: string;
    className?: string;
    onClick: () => void;
}

export default function Button({ textContent, className, onClick }: ButtonProps) {
    return (
        <button
            aria-label={textContent}
            className={`rounded-[10px] px-3 py-1 m-3 bg-primary hover:bg-primary-focus focus:bg-primary-focus text-primary-content font-medium ${className}`}
            onClick={() => onClick()}
        >
            {textContent}
        </button>
    );
}