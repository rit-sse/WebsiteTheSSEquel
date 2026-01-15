"use client";

import { useState } from "react";
import { motion, SVGMotionProps, Easing } from "motion/react";

interface SendIconProps extends SVGMotionProps<SVGSVGElement> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
    repeatDelay?: number;
    ease?: Easing;
}

const SendIcon = (props: SendIconProps) => {
    const {
        size = 28,              // Icon size in pixels
        duration = 1,           // Animation duration in seconds
        strokeWidth = 2,        // SVG stroke width
        isHovered = false,      // When true, animate only on hover
        repeatDelay = 1,        // Delay between animation loops (seconds)
        ease = "easeInOut",     // Animation easing function
        className,
        ...restProps
    } = props;

    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const groupAnimationProps = {
        animate: shouldAnimate ? {
            rotate: [0, 45, 0],
            scale: [1, 1.2, 1],
            x: [0, -2, 0], // slight translation as per request
            y: [0, 1, 0],
        } : { rotate: 0, scale: 1, x: 0, y: 0 },
        transition: {
            duration: duration,
            ease: ease,
            repeat: isHovered ? 0 : Infinity,
            repeatDelay: repeatDelay,
        },
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
            overflow="visible"
            onMouseEnter={() => isHovered && setIsHoveredInternal(true)}
            onMouseLeave={() => isHovered && setIsHoveredInternal(false)}
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <motion.g
                style={{ originX: "12px", originY: "12px" }}
                {...groupAnimationProps}
            >
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
            </motion.g>
        </motion.svg>
    );
};

export default SendIcon;
