// A standalone easter-egg page that replicates the functionality of
// https://soggy.cat (AGPL-3.0). This implementation is original code
// written for this repository; no code or assets from the original
// project are copied here.
//
// Photo: "Sphynx taking a bath" from Wikimedia Commons, CC BY-SA 2.5.
// https://commons.wikimedia.org/wiki/File:Sphynx_taking_a_bath.jpg

import type { Metadata, Viewport } from "next";
import SoggyCat from "./SoggyCat";

export const metadata: Metadata = {
  title: "soggy cat",
  description: "a picture of a wet cat inside a bathtub.",
  openGraph: {
    title: "soggy cat",
    description: "a picture of a wet cat inside a bathtub.",
    images: ["/images/soggycat.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffcc5f",
};

export default function SoggyCatPage() {
  return <SoggyCat />;
}
