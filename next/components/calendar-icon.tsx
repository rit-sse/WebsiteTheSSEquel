"use client";

import { useState } from "react";
import { motion, SVGMotionProps } from "motion/react";

interface CalendarIconProps extends Omit<SVGMotionProps<SVGSVGElement>, "strokeWidth"> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
}

const CalendarIcon = (props: CalendarIconProps) => {
    const { size = 28, duration = 2, strokeWidth = 2, isHovered = false, className, ...restProps } = props;
    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const dateAnimationProps = {
        animate: shouldAnimate ? {
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
        } : { scale: 1, opacity: 1 },
        transition: { duration: duration, ease: "easeInOut" as const, repeat: isHovered ? 0 : Infinity },
    };

    return (
        <motion.svg
            {...restProps}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            onMouseEnter={() => isHovered && setIsHoveredInternal(true)}
            onMouseLeave={() => isHovered && setIsHoveredInternal(false)}
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <rect x="4" y="5" width="16" height="16" rx="2" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
            <motion.g style={{ transformOrigin: "12px 16px" }} {...dateAnimationProps}>
                <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
            </motion.g>
        </motion.svg>
    );
};

export default CalendarIcon;
