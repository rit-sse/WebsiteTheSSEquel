import type { BlockRenderProps } from "../types";

/**
 * BulletListPair — heading + optional description + 2-column grid of
 * (h3 + bulleted list) cells. Replicates the original Sponsors
 * "Recruiting Talks" and "ViSE" sections exactly.
 */
export function BulletListPairBlock({
  props,
}: BlockRenderProps<"bulletListPair">) {
  return (
    <div className="my-2">
      <h2 className="text-3xl font-bold font-display mb-6">{props.heading}</h2>
      {props.description && (
        <p className="text-muted-foreground mb-6">{props.description}</p>
      )}
      <div className="grid md:grid-cols-2 gap-8">
        {props.columns.map((col, i) => (
          <div key={i}>
            <h3 className="text-xl font-semibold mb-3">{col.heading}</h3>
            <ul className="space-y-2 text-muted-foreground">
              {col.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
