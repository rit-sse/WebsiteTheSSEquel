import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { electionAvatarStyle } from "./electionAvatarColor";

/**
 * Unified avatar treatment for every user reference in the election
 * flow — nomination cards, candidate cards, voting ballots, results,
 * running-mate search, the nominator list on the accept screen, etc.
 *
 * Image-first: if the user has a resolved `image` URL (populated by
 * `resolveUserImage` in the API serialization pipeline) it renders
 * that. When there's no image, or the image 404s at load time, shadcn's
 * `<Avatar>` falls through to the stylized `<AvatarFallback>` which
 * paints the deterministic candy-gradient background from
 * `electionAvatarStyle` plus the user's initials.
 *
 * The gradient style is applied to the outer `<Avatar>` as well so the
 * container matches the fallback colour while the image is still
 * loading — prevents a white flash on slow networks.
 */
export interface ElectionAvatarUser {
  /** Used as the seed for the deterministic gradient colour. */
  id: number | string;
  /** Rendered as initials if there is no image. */
  name: string;
  /**
   * Resolved image URL (S3 proxy or Google OAuth avatar, whichever the
   * serialization pipeline picked via `resolveUserImage`). `null` /
   * `undefined` / empty string all mean "use the stylized fallback".
   */
  image?: string | null;
}

interface ElectionAvatarProps {
  user: ElectionAvatarUser;
  /** Classes applied to the outer `<Avatar>` — size, border, shadow. */
  className?: string;
  /** Classes applied to the `<AvatarFallback>` — typically text-size. */
  fallbackClassName?: string;
  /** Optional seed override — rarely needed, defaults to `user.id`. */
  seed?: number | string;
}

export function getElectionAvatarInitials(name: string): string {
  return (name || "??")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ElectionAvatar({
  user,
  className,
  fallbackClassName,
  seed,
}: ElectionAvatarProps) {
  const colorSeed = seed ?? user.id;
  const style = electionAvatarStyle(colorSeed);
  const initials = getElectionAvatarInitials(user.name);

  return (
    <Avatar className={className} style={style}>
      {user.image ? (
        <AvatarImage src={user.image} alt={user.name} />
      ) : null}
      <AvatarFallback
        className={cn("font-display font-bold", fallbackClassName)}
        style={style}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
