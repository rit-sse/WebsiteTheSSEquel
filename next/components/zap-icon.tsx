"use client";

import { useState } from "react";
import { motion, SVGMotionProps } from "motion/react";

interface ZapIconProps extends Omit<SVGMotionProps<SVGSVGElement>, "strokeWidth"> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
}

const ZapIcon = (props: ZapIconProps) => {
    const { size = 28, duration = 1.5, strokeWidth = 2, isHovered = false, className, ...restProps } = props;
    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const pathAnimationProps = {
        animate: shouldAnimate ? {
            opacity: [1, 0.4, 1, 0.6, 1],
            scale: [1, 1.02, 0.98, 1.01, 1]
        } : { opacity: 1, scale: 1 },
        transition: { duration: duration, ease: "easeInOut" as const, repeat: isHovered ? 0 : Infinity, times: [0, 0.2, 0.4, 0.7, 1] },
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
            <motion.path
                d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
                style={{ transformOrigin: "center" }}
                {...pathAnimationProps}
            />
        </motion.svg>
    );
};

export default ZapIcon;
