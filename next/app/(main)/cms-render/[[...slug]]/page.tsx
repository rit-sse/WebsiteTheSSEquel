/**
 * Internal CMS render target.
 *
 * The proxy rewrites concrete static routes here when a matching CMS Page
 * exists, which lets officers manage existing URLs without moving every
 * static page into a catch-all route.
 */
import { Metadata } from "next";
import {
  generateCmsPageMetadata,
  renderCmsPage,
} from "@/lib/pageBuilder/cmsPageRoute";

export const revalidate = 30;

type Search = { [k: string]: string | string[] | undefined };

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Search>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateCmsPageMetadata(slug);
}

export default async function InternalCmsPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  return renderCmsPage({ slugParts: slug, searchParams: sp });
}
