import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import prisma from "@/lib/prisma";

/**
 * Fetches every user and exports them with the following:
 * - id
 * - name
 * - email
 * - createdAt time
 * - alumni status
 */
export async function exportUsersCsv(): Promise<string> {
  const users = await prisma.$transaction(
    (tx) =>
      tx.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          alumni: { select: { id: true } },
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
  );

  return Papa.unparse(
    {
      fields: ["user_id", "name", "email", "is_alumni", "date_created"],
      data: users.map((user) => [
        user.id,
        user.name,
        user.email,
        user.alumni !== null,
        user.createdAt?.toISOString() ?? "",
      ]),
    },
    { escapeFormulae: true, newline: "\r\n" }
  );
}
