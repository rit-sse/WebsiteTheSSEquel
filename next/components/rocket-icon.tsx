"use client";

import { useState } from "react";
import { motion, SVGMotionProps } from "motion/react";

interface RocketIconProps extends Omit<SVGMotionProps<SVGSVGElement>, "strokeWidth"> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
}

const RocketIcon = (props: RocketIconProps) => {
    const { size = 28, duration = 2, strokeWidth = 2, isHovered = false, className, ...restProps } = props;
    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const bodyAnimationProps = {
        animate: shouldAnimate ? {
            y: [0, -2, 0],
            x: [0, 1, 0],
        } : { y: 0, x: 0 },
        transition: {
            duration: duration * 0.5,
            ease: "easeInOut" as const,
            repeat: isHovered ? 0 : Infinity,
        },
    };

    const flameAnimationProps = {
        animate: shouldAnimate ? {
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.1, 0.8],
        } : { opacity: 0.4, scale: 0.8 },
        transition: {
            duration: duration * 0.15,
            ease: "easeInOut" as const,
            repeat: isHovered ? 0 : Infinity,
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
            <motion.g {...bodyAnimationProps}>
                <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3" />
                <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3" />
                <circle cx="15" cy="9" r="1" />
            </motion.g>
            <motion.g
                style={{ transformOrigin: "7px 17px" }}
                {...flameAnimationProps}
            >
                <path d="M4.5 17l-1.5 3" stroke="currentColor" strokeWidth={1.5} />
                <path d="M7 19l-1 2" stroke="currentColor" strokeWidth={1.5} />
            </motion.g>
        </motion.svg>
    );
};

export default RocketIcon;
