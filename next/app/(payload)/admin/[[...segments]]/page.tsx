import type { Metadata } from "next";

import configPromise from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";

import { importMap } from "../importMap";

type PageArgs = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = async ({
  params,
  searchParams,
}: PageArgs): Promise<Metadata> =>
  generatePageMetadata({
    config: configPromise,
    params,
    searchParams,
  });

export default async function Page({ params, searchParams }: PageArgs) {
  return RootPage({
    config: configPromise,
    params,
    searchParams,
    importMap,
  });
}
