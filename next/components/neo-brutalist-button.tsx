"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

interface NeoBrutalistButtonProps {
    text?: string;
    className?: string;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
    variant?: "pink" | "orange" | "blue" | "green";
}

const variantStyles = {
    pink: "bg-accentScale-5",
    orange: "bg-accentScale-3",
    blue: "bg-accentScale-4",
    green: "bg-accentScale-2",
};

const NeoBrutalistButton = ({
    text = "Click Me",
    className,
    onClick,
    href,
    icon,
    variant = "pink",
}: NeoBrutalistButtonProps) => {
    const buttonContent = (
        <>
            <div className="neo-shimmer absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent z-0" />
            <span className="relative z-10 inline-flex items-center gap-2 skew-x-[10deg] text-lg font-medium">
                {icon}
                {text}
            </span>
        </>
    );

    const sharedClasses = cn(
        "neo-brutalist-btn group relative overflow-hidden px-6 py-3 cursor-pointer",
        variantStyles[variant],
        "text-black",
        "skew-x-[-10deg] transition-all duration-100 border-[1.5px] border-black",
        "shadow-[4px_4px_0_0_black] hover:shadow-[8px_8px_0_0_black]",
        "active:shadow-[2px_2px_0_0_black] active:translate-x-[2px] active:translate-y-[2px]",
        className
    );

    if (href) {
        return (
            <Link href={href} className={cn(sharedClasses, "inline-block")}>
                {buttonContent}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={sharedClasses}>
            {buttonContent}
        </button>
    );
};

export default NeoBrutalistButton;
