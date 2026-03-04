import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/aws/officerPictures/route";

describe("/api/aws/officerPictures route", () => {
  it("returns 410 deprecated response", async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("deprecated"),
    });
  });
});
