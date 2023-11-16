
interface HoverBoldButtonProps {
    text: string;
    dataLabel?: string;
    onClick: () => void;
    className?: string;
}

export default function HoverBoldButton({ text, dataLabel, onClick, className }: HoverBoldButtonProps) {
    return (
        <button
            onClick={() => onClick()}
            data-label={dataLabel}
            aria-label={text}
            className={`flex-grow bold-pseudo cursor-pointer px-3 py-2
                        hover:text-primary focus:text-primary
                        hover:font-semibold transition-all ${className}`}
        >
            <span>{text}</span>
        </button>
    );
}