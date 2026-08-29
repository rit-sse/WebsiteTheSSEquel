// The bare variant of /soggycat, in the spirit of soggy.cat/nocss:
// only the picture, with no styles and no scripts.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "soggy cat",
  description: "a picture of a wet cat inside a bathtub.",
};

export default function SoggyCatNoCssPage() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the page is intentionally plain
    <img
      src="/images/soggycat.webp"
      width="100%"
      height="100%"
      alt="a picture of a wet cat inside a bathtub."
    />
  );
}
