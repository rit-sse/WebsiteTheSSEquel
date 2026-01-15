"use client";

import { useState } from "react";
import { motion, SVGMotionProps, Easing } from "motion/react";

interface IconProps extends SVGMotionProps<SVGSVGElement> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
    repeatDelay?: number;
    ease?: Easing;
}

const ArrowUpIcon = (props: IconProps) => {
    const {
        size = 28,
        duration = 1.5,
        strokeWidth = 2,
        isHovered = false,
        repeatDelay = 1,
        ease = "easeInOut",
        className,
        ...restProps
    } = props;

    const [isHoveredInternal, setIsHoveredInternal] = useState(false);
    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const animation = {
        animate: shouldAnimate ? { y: [0, -4, 0] } : { x: 0, y: 0 },
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
            <motion.path d="M12 5l0 14" {...animation} /><motion.path d="M18 11l-6 -6" {...animation} /><motion.path d="M6 11l6 -6" {...animation} />
        </motion.svg>
    )
}

export default ArrowUpIcon;
