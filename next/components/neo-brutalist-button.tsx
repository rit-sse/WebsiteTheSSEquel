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
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  /**
   * - "default" (home-page CTA size): px-6 py-3 text-lg, ~h-12
   * - "sm": sized to fit inline with a standard shadcn Input (h-9)
   */
  size?: "default" | "sm";
}

const variantStyles = {
  pink: "bg-[#ff90e8]",
  orange: "bg-[#ffb347]",
  blue: "bg-[#87ceeb]",
  green: "bg-[#98fb98]",
};

const NeoBrutalistButton = ({
  text = "Click Me",
  className,
  onClick,
  href,
  icon,
  variant = "pink",
  disabled = false,
  type = "button",
  ariaLabel,
  size = "default",
}: NeoBrutalistButtonProps) => {
  const isSm = size === "sm";
  const buttonContent = (
    <>
      <div className="neo-shimmer absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent z-0" />
      <span
        className={cn(
          "relative z-10 inline-flex items-center gap-2 skew-x-[10deg] font-medium",
          isSm ? "text-sm" : "text-lg"
        )}
      >
        {icon}
        {text}
      </span>
    </>
  );

  const sharedClasses = cn(
    "neo-brutalist-btn group relative overflow-hidden cursor-pointer",
    isSm ? "px-4 h-9 leading-none" : "px-6 py-3",
    variantStyles[variant],
    "text-black",
    "skew-x-[-10deg] transition-all duration-100 border-[1.5px] border-black",
    "shadow-[4px_4px_0_0_black] hover:shadow-[8px_8px_0_0_black]",
    "active:shadow-[2px_2px_0_0_black] active:translate-x-[2px] active:translate-y-[2px]",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    className
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={cn(sharedClasses, "inline-block")}
        aria-label={ariaLabel}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={sharedClasses}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {buttonContent}
    </button>
  );
};

export default NeoBrutalistButton;
