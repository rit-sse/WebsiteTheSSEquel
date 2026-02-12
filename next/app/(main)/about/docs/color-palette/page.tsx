import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Color Palette Docs",
  description: "SSE website color palette, depth system, and token usage documentation.",
};

async function getPaletteMarkdown(): Promise<string> {
  const candidatePaths = [
    path.resolve(process.cwd(), "documentation", "website-color-palette.md"),
    path.resolve(process.cwd(), "..", "documentation", "website-color-palette.md"),
  ];

  for (const filePath of candidatePaths) {
    try {
      return await readFile(filePath, "utf8");
    } catch {
      // Try the next candidate path.
    }
  }

  return "# Color Palette Docs\n\nMarkdown file not found.";
}

export default async function ColorPaletteDocsPage() {
  const markdown = await getPaletteMarkdown();

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-foreground">Color Palette Docs</h1>
            <p className="mt-3 text-lg max-w-3xl mx-auto text-muted-foreground">
              PDF and markdown documentation for the website color system, including surface depths, categorical colors,
              button usage, and accessibility notes.
            </p>
          </div>

          <Card depth={2} className="p-3 md:p-4">
            <iframe
              src="/api/docs/color-palette#navpanes=0&view=FitH"
              title="Website color palette PDF"
              className="w-full h-[75vh] rounded-md border border-black"
            />
          </Card>

          <Card depth={2} className="mt-6 p-5 md:p-6 overflow-x-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ ...props }) => (
                    <div className="my-4 w-full overflow-x-auto">
                      <table className="w-full border-collapse text-sm" {...props} />
                    </div>
                  ),
                  thead: ({ ...props }) => <thead className="bg-surface-2" {...props} />,
                  th: ({ ...props }) => <th className="border border-black px-3 py-2 text-left font-semibold" {...props} />,
                  td: ({ ...props }) => <td className="border border-black px-3 py-2 align-top" {...props} />,
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </Card>
        </Card>
      </div>
    </section>
  );
}
