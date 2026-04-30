import type { BlockRenderProps } from "../types";

export function DividerBlock({ props }: BlockRenderProps<"divider">) {
  if (props.label) {
    return (
      <div className="my-10 flex items-center gap-4 text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.2em] font-medium">
          {props.label}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }
  return <hr className="my-10 border-t border-border" />;
}
