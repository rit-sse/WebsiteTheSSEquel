"use client";

import { motion } from "motion/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DancingLettersProps {
    text?: string;
    className?: string;
    letterClassName?: string;
    /** Array of color classes the user can cycle through with arrow buttons. All letters use the active color. */
    colors?: string[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
}

// Sleek, physics-based animations
const letterAnimations = [
    // 1. Rubber Band (Snap)
    {
        active: {
            scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
            scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
        },
        transition: { duration: 0.8, ease: "easeInOut" },
        transformOrigin: "center center",
    },
    // 2. The Hinge (Falling effect)
    {
        active: {
            rotate: [0, 80, 60, 80, 60, 0],
            y: [0, 10, -5, 5, -2, 0],
            originX: 0,
            originY: 1,
        },
        transition: { duration: 1.2, ease: [0.175, 0.885, 0.32, 1.275] },
        transformOrigin: "bottom left",
    },
    // 3. Squash and Jump
    {
        active: {
            scaleY: [1, 0.6, 1.2, 1],
            y: [0, 20, -40, 0],
        },
        transition: { duration: 0.6, ease: "easeOut" },
        transformOrigin: "bottom center",
    },
    // 4. Falling (Requests)
    {
        active: {
            rotateX: [0, 240, 150, 200, 175, 180, 180, 0],
            scale: [1, 1.1, 1],
        },
        transition: {
            duration: 2,
            ease: "easeOut",
            times: [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.85, 1]
        },
        transformOrigin: "50% 80%",
    },
    // 5. Elastic Slide
    {
        active: {
            x: [0, -20, 15, -10, 5, 0],
        },
        transition: { duration: 0.8, ease: "easeInOut" },
        transformOrigin: "center center",
    },
    // 6. Impact Shake
    {
        active: {
            x: [0, -5, 5, -5, 5, -2, 2, 0],
            y: [0, -2, 2, -1, 1, 0],
            rotate: [0, -1, 1, -0.5, 0.5, 0],
        },
        transition: { duration: 0.5, ease: "linear" },
        transformOrigin: "center center",
    },
    // 7. Pop (Scale)
    {
        active: {
            scale: [1, 1.4, 1],
        },
        transition: { duration: 0.5, ease: "easeInOut" },
        transformOrigin: "center center",
    },
    // 8. Levitate
    {
        active: {
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
            textShadow: [
                "0px 0px 0px rgba(0,0,0,0)",
                "0px 20px 20px rgba(0,0,0,0.2)",
                "0px 0px 0px rgba(0,0,0,0)",
            ],
        },
        transition: { duration: 1.2, ease: "easeInOut" },
        transformOrigin: "center center",
    },
];

const DancingLetters = ({
    text = "ANIMATE",
    className = "",
    letterClassName = "",
    colors,
}: DancingLettersProps) => {
    const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);
    const [colorIndex, setColorIndex] = useState(0);

    const activeColor = colors && colors.length > 0 ? colors[colorIndex % colors.length] : undefined;

    const prevColor = useCallback(() => {
        if (!colors || colors.length === 0) return;
        setColorIndex((prev) => (prev - 1 + colors.length) % colors.length);
    }, [colors]);

    const nextColor = useCallback(() => {
        if (!colors || colors.length === 0) return;
        setColorIndex((prev) => (prev + 1) % colors.length);
    }, [colors]);

    // Split text into words, preserving global letter indices
    const words = useMemo(() => {
        const result: { word: string; startIndex: number }[] = [];
        const wordArray = text.split(" ");
        let currentIndex = 0;
        
        wordArray.forEach((word, wordIdx) => {
            result.push({ word, startIndex: currentIndex });
            currentIndex += word.length + 1; // +1 for the space
        });
        
        return result;
    }, [text]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleClick = useCallback((index: number) => {
        setActiveIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            }
            // Small timeout to allow state clear if double clicking rapidly
            setTimeout(() => {
                setActiveIndices((prev) => {
                    const next = new Set(prev);
                    next.add(index);
                    return next;
                });
            }, 10);
            return next;
        });
    }, []);

    const handleAnimationComplete = useCallback((index: number) => {
        setActiveIndices((prev) => {
            if (!prev.has(index)) return prev;
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
    }, []);

    const showArrows = colors && colors.length > 1;

    const lettersEl = (
        <motion.div
            className={cn("flex flex-wrap items-center justify-center select-none overflow-visible gap-[0.25em]", className)}
            style={{ perspective: "1000px" }}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        staggerChildren: 0.05,
                    }
                }
            }}
        >
            {words.map(({ word, startIndex }, wordIdx) => (
                <span key={`word-${wordIdx}`} className="inline-flex whitespace-nowrap">
                    {word.split("").map((letter, letterIdx) => {
                        const globalIdx = startIndex + letterIdx;
                        const animIndex = globalIdx % letterAnimations.length;
                        const anim = letterAnimations[animIndex];
                        const isActive = activeIndices.has(globalIdx);

                        return (
                            <motion.span
                                key={`${letter}-${globalIdx}`}
                                variants={{
                                    hidden: { opacity: 0, y: 20, scale: 0.8 },
                                    visible: {
                                        opacity: 1,
                                        scale: 1,
                                        x: 0,
                                        y: 0,
                                        rotate: 0,
                                        rotateX: 0,
                                        rotateY: 0,
                                        scaleX: 1,
                                        scaleY: 1,
                                        textShadow: "0px 0px 0px rgba(0,0,0,0)",
                                        transition: { type: "spring", stiffness: 300, damping: 20 }
                                    },
                                    active: {
                                        ...anim.active,
                                        opacity: 1,
                                        // @ts-expect-error transition type mismatch
                                        transition: anim.transition
                                    }
                                }}
                                animate={isActive ? "active" : (isLoaded ? "visible" : undefined)}
                                onHoverStart={() => {
                                    if (!isActive) handleClick(globalIdx);
                                }}
                                onClick={() => handleClick(globalIdx)}
                                onAnimationComplete={(definition) => {
                                    if (definition === "active") handleAnimationComplete(globalIdx);
                                }}
                                className={cn(
                                    "relative inline-block text-5xl md:text-7xl lg:text-8xl font-bold cursor-pointer transition-colors duration-300",
                                    activeColor,
                                    letterClassName,
                                    isActive ? "z-10" : "z-0"
                                )}
                                style={{
                                    transformOrigin: anim.transformOrigin,
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                {letter}
                            </motion.span>
                        );
                    })}
                </span>
            ))}
        </motion.div>
    );

    if (!showArrows) return lettersEl;

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={prevColor}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                aria-label="Previous color"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {lettersEl}
            <button
                type="button"
                onClick={nextColor}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                aria-label="Next color"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        </div>
    );
};

export default DancingLetters;
