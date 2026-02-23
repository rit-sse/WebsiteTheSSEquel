"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface NavAvatarProps {
  src: string | null | undefined;
  name: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A navbar-optimized avatar that avoids Radix Avatar's client-side loading
 * check. Both the fallback (initials) and the <img> render simultaneously —
 * the image sits on top and covers the initials the instant the browser
 * has it (often from cache, before the first paint). No JavaScript
 * onLoad gating, so there is zero empty-space flicker.
 */
const NavAvatar = React.forwardRef<HTMLDivElement, NavAvatarProps>(
  ({ src, name, className }, ref) => {
    const initials = getInitials(name || "?");
    const [imgFailed, setImgFailed] = React.useState(false);

    // Reset failure state when src changes (e.g. after upload)
    React.useEffect(() => { setImgFailed(false); }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center",
          className
        )}
      >
        <span className="select-none text-[10px] font-medium text-muted-foreground">
          {initials}
        </span>

        {src && !imgFailed && (
          <img
            src={src}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
    );
  }
);
NavAvatar.displayName = "NavAvatar";

export default NavAvatar;
