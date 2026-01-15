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


const MenuIcon = (props: IconProps) => {
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


    const lineProps = {
        transition: {
            duration: duration,
            ease: ease,
            repeat: isHovered ? 0 : Infinity,
            repeatDelay: repeatDelay,
        }
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
            <motion.line
                x1="4" x2="20" y1="12" y2="12"
                animate={shouldAnimate ? { opacity: [1, 0, 0, 1] } : { opacity: 1 }}
                {...lineProps}
            />
            <motion.line
                x1="4" x2="20" y1="6" y2="6"
                animate={shouldAnimate ? { y: [0, 6, 6, 0], rotate: [0, 45, 45, 0] } : { y: 0, rotate: 0 }}
                style={{ originX: "50%", originY: "50%" }}
                {...lineProps}
            />
            <motion.line
                x1="4" x2="20" y1="18" y2="18"
                animate={shouldAnimate ? { y: [0, -6, -6, 0], rotate: [0, -45, -45, 0] } : { y: 0, rotate: 0 }}
                style={{ originX: "50%", originY: "50%" }}
                {...lineProps}
            />
        </motion.svg>
    )

}

export default MenuIcon;
