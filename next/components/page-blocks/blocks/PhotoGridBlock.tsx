import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { getPhotoPool } from "@/lib/pageBuilder/photoPool";
import type { BlockRenderProps } from "../types";
import { PhotoGridShuffler } from "./PhotoGridShuffler";

const COL_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
};

export async function PhotoGridBlock({
  props,
  preview,
}: BlockRenderProps<"photoGrid">) {
  const pool = await getPhotoPool({
    categorySlug: props.categorySlug,
    count: props.count,
    order: props.order,
  });

  if (pool.length === 0) {
    return (
      <div className="my-8 rounded-lg border-2 border-dashed border-border/40 bg-surface-2 p-8 text-center text-muted-foreground">
        <ImageOff className="mx-auto mb-2 h-6 w-6 opacity-60" />
        <p className="text-sm">No photos in “{props.categorySlug}” yet</p>
        {preview && (
          <Link
            href="/dashboard/photos"
            className="mt-2 inline-block text-xs underline hover:text-foreground"
          >
            Upload some →
          </Link>
        )}
      </div>
    );
  }

  // Random ordering for the grid is reshuffled per visit by the
  // client-side wrapper. Newest-order ships SSR-stable.
  if (props.order === "newest") {
    return (
      <div
        className={[
          "my-8 grid gap-2",
          COL_CLASS[props.columns] ?? COL_CLASS[4],
        ].join(" ")}
      >
        {pool.slice(0, props.count).map((p) => (
          <GridTile key={p.id} item={p} />
        ))}
      </div>
    );
  }

  return (
    <PhotoGridShuffler
      pool={pool}
      count={props.count}
      gridClassName={[
        "my-8 grid gap-2",
        COL_CLASS[props.columns] ?? COL_CLASS[4],
      ].join(" ")}
    />
  );
}

function GridTile({
  item,
}: {
  item: { imageUrl: string; alt: string; id: number };
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md bg-surface-2"
      style={{ paddingBottom: "100%" }}
    >
      <Image
        src={item.imageUrl}
        alt={item.alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover transition-transform duration-300 hover:scale-[1.04]"
      />
    </div>
  );
}
