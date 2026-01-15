"use client";

import { useState } from "react";
import { motion, SVGMotionProps } from "motion/react";

interface StarIconProps extends SVGMotionProps<SVGSVGElement> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
}

const StarIcon = (props: StarIconProps) => {
    const { size = 28, duration = 2, strokeWidth = 2, isHovered = false, className, ...restProps } = props;
    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const pathAnimationProps = {
        animate: shouldAnimate ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
        } : { scale: 1, rotate: 0 },
        transition: {
            duration: duration,
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
            <motion.path
                d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"
                style={{ originX: "12px", originY: "12px" }}
                {...pathAnimationProps}
            />
        </motion.svg>
    )
}

export default StarIcon;
