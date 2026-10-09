import { getGatewayAuthLevel } from "@/lib/authGateway";
import { exportUsersCsv } from "@/lib/services/userExportService";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const auth = await getGatewayAuthLevel(request);
    if (!auth.isUser) {
      return Response.json(
        { error: "Sign in to export users." },
        { status: 401, headers: privateHeaders }
      );
    }
    if (!auth.isOfficer && !auth.isSeAdmin) {
      return Response.json(
        { error: "Must be an Officer or SE Admin to export users" },
        { status: 403, headers: privateHeaders }
      );
    }

    const csv = await exportUsersCsv();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new Response(csv, {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sse-users-${timestamp}.csv"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to export users. Please try again." },
      { status: 500, headers: privateHeaders }
    );
  }
}
