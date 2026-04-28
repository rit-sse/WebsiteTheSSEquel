"use client";
import {
  useScroll,
  useTransform,
  motion,
  AnimatePresence,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  /** When true, the entry starts collapsed and expands on click */
  collapsible?: boolean;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref, expanded]); // recalc when items expand/collapse

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="w-full font-sans" ref={containerRef}>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-10">
        {data.map((item, index) => {
          const isCollapsible = item.collapsible ?? false;
          const isExpanded = !isCollapsible || expanded.has(index);

          return (
            <div key={index} className="flex justify-start pt-10 md:pt-16 md:gap-4">
              {/* Left: sticky semester label */}
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-24 self-start md:w-36 shrink-0">
                <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-background flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-muted border border-border p-2" />
                </div>
                {isCollapsible ? (
                  <button
                    onClick={() => toggle(index)}
                    className={cn(
                      "hidden md:flex items-center gap-1 text-base md:pl-16 md:text-lg font-bold transition-colors",
                      isExpanded ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.title}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  <h3 className="hidden md:block text-base md:pl-16 md:text-lg font-bold text-muted-foreground">
                    {item.title}
                  </h3>
                )}
              </div>

              {/* Right: content */}
              <div className="relative pl-20 pr-4 md:pl-4 w-full">
                {isCollapsible ? (
                  <button
                    onClick={() => toggle(index)}
                    className={cn(
                      "md:hidden flex items-center gap-2 text-xl mb-3 font-bold transition-colors",
                      isExpanded ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.title}
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </button>
                ) : (
                  <h3 className="md:hidden block text-xl mb-4 text-left font-bold text-muted-foreground">
                    {item.title}
                  </h3>
                )}

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {item.content}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Animated fill line */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-border to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-primary via-primary/60 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
