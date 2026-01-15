"use client";

import { useState } from "react";
import { motion, SVGMotionProps } from "motion/react";

interface SparkleIconProps extends Omit<SVGMotionProps<SVGSVGElement>, "strokeWidth"> {
    size?: number;
    duration?: number;
    strokeWidth?: number;
    isHovered?: boolean;
}

const SparkleIcon = (props: SparkleIconProps) => {
    const { size = 28, duration = 2, strokeWidth = 2, isHovered = false, className, ...restProps } = props;
    const [isHoveredInternal, setIsHoveredInternal] = useState(false);

    const shouldAnimate = isHovered ? isHoveredInternal : true;

    const mainSparkleProps = {
        animate: shouldAnimate ? { scale: [1, 1.1, 1], rotate: [0, 10, 0, -10, 0] } : { scale: 1, rotate: 0 },
        transition: { duration: duration, ease: "easeInOut" as const, repeat: isHovered ? 0 : Infinity },
    };

    const smallSparkle1Props = {
        animate: shouldAnimate ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : { opacity: 1, scale: 1 },
        transition: { duration: duration * 0.8, ease: "easeInOut" as const, repeat: isHovered ? 0 : Infinity, delay: duration * 0.2 },
    };

    const smallSparkle2Props = {
        animate: shouldAnimate ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : { opacity: 1, scale: 1 },
        transition: { duration: duration * 0.8, ease: "easeInOut" as const, repeat: isHovered ? 0 : Infinity, delay: duration * 0.5 },
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
                d="M12 3l1.5 4.5l4.5 1.5l-4.5 1.5l-1.5 4.5l-1.5 -4.5l-4.5 -1.5l4.5 -1.5z"
                style={{ transformOrigin: "12px 9px" }}
                {...mainSparkleProps}
            />
            <motion.path
                d="M18 16l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5 -1.5l-1.5 -.5l1.5 -.5z"
                style={{ transformOrigin: "18px 18px" }}
                {...smallSparkle1Props}
            />
            <motion.path
                d="M5 18l.5 1l1 .5l-1 .5l-.5 1l-.5 -1l-1 -.5l1 -.5z"
                style={{ transformOrigin: "5px 19px" }}
                {...smallSparkle2Props}
            />
        </motion.svg>
    );
};

export default SparkleIcon;
