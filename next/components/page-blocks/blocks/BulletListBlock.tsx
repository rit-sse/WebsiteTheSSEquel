import type { BlockRenderProps } from "../types";

/**
 * BulletList — vertical list with primary-colored "•" markers.
 * Mirrors the original Sponsors / About-style:
 *   <li className="flex items-start gap-2">
 *     <span className="text-primary mt-1">•</span>
 *     <span>{text}</span>
 *   </li>
 */
export function BulletListBlock({ props }: BlockRenderProps<"bulletList">) {
  return (
    <div className="my-6">
      {props.heading && (
        <h3 className="text-xl font-semibold mb-3">{props.heading}</h3>
      )}
      <ul className="space-y-2 text-muted-foreground">
        {props.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
