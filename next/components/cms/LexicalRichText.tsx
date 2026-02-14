"use client";

import { RichText } from "@payloadcms/richtext-lexical/react";

type LexicalRichTextProps = {
  data: unknown;
  className?: string;
};

export default function LexicalRichText({
  data,
  className,
}: LexicalRichTextProps) {
  if (!data || typeof data !== "object") {
    return null;
  }

  return <RichText data={data as never} className={className} />;
}
