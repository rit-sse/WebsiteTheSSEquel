import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), "output", "pdf", "website-color-palette.pdf"),
      path.resolve(process.cwd(), "..", "output", "pdf", "website-color-palette.pdf"),
    ];

    let pdfBuffer: Buffer | null = null;
    for (const pdfPath of candidatePaths) {
      try {
        pdfBuffer = await readFile(pdfPath);
        break;
      } catch {
        // Try the next candidate path.
      }
    }

    if (!pdfBuffer) {
      return new Response("Color palette PDF not found.", { status: 404 });
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="website-color-palette.pdf"',
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Color palette PDF not found.", { status: 404 });
  }
}
