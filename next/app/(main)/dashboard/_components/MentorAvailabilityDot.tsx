"use client";

import * as React from "react";

/**
 * Tiny client-only red dot that overlays the Mentoring card preview when the
 * mentoring head has unread availability changes. Owns the localStorage-
 * backed "last seen" check and listens for the global
 * `mentor-availability-seen` event so the dot clears as soon as the head
 * visits the schedule.
 *
 * Rendered as an absolute-positioned span inside an otherwise server-rendered
 * preview, which keeps the rest of the dashboard page a Server Component.
 */
export default function MentorAvailabilityDot() {
  const [showRedDot, setShowRedDot] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/mentor-availability/updates");
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const latestUpdatedAt = data?.latestUpdatedAt
          ? Date.parse(data.latestUpdatedAt)
          : 0;
        const seenAt = Number(
          localStorage.getItem("mentor-availability-last-seen") || "0"
        );
        setShowRedDot(latestUpdatedAt > seenAt);
      } catch (error) {
        console.error("Error checking mentor availability:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const handleSeen = () => setShowRedDot(false);
    window.addEventListener("mentor-availability-seen", handleSeen);
    return () => {
      window.removeEventListener("mentor-availability-seen", handleSeen);
    };
  }, []);

  if (!showRedDot) return null;
  return (
    <span
      className="pointer-events-none absolute right-2 top-2 z-20 h-2.5 w-2.5 rounded-full bg-destructive"
      aria-label="New mentor availability"
    />
  );
}
