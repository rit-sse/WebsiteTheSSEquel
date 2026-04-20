"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/userDisplay";

interface UserAvatarProps {
  /**
   * Fully-resolved image URL for the user (upload → OAuth → null).
   * Callers should pass `resolveUserImage(profileImageKey, googleImageURL)`
   * from `lib/s3Utils` server-side, or `session.user.image` client-side —
   * both produce the same string.
   */
  src: string | null | undefined;
  /** Display name used to generate the initials fallback. */
  name: string | null | undefined;
  /**
   * Tailwind sizing/ring classes applied to the outer round container
   * (e.g. "h-8 w-8 ring-1 ring-border/50"). Default is `h-10 w-10`.
   */
  className?: string;
  /**
   * Override the initials font-size class. Defaults to `text-xs`, which
   * fits comfortably at `h-8`. Use `text-base` or larger for big avatars.
   */
  initialsClassName?: string;
  /** Optional alt text. Defaults to `name || "User avatar"`. */
  alt?: string;
}

/**
 * Canonical user-avatar primitive for the app.
 *
 * Renders initials as a base layer and overlays the user's picture on
 * top. When the image is absent or fails to load (`onError`), the
 * initials stay visible — no client-side loading flicker, no radix
 * fallback gymnastics.
 *
 * Font for the initials is explicitly pinned to `font-sans font-medium`
 * so parent fonts (serif navbar, fancy card headers, etc.) cannot leak
 * in and cause visual inconsistency across surfaces.
 */
const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      src,
      name,
      className,
      initialsClassName = "text-xs",
      alt,
    },
    ref
  ) => {
    const initials = getInitials(name);
    const [imgFailed, setImgFailed] = React.useState(false);

    // Reset failure state when src changes (e.g. after upload)
    React.useEffect(() => {
      setImgFailed(false);
    }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
          className
        )}
      >
        <span
          className={cn(
            "select-none font-sans font-medium text-muted-foreground",
            initialsClassName
          )}
        >
          {initials}
        </span>

        {src && !imgFailed && (
          <Image
            src={src}
            alt={alt ?? name ?? "User avatar"}
            fill
            sizes="96px"
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            unoptimized
          />
        )}
      </div>
    );
  }
);
UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
