import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

import { POST } from "@/app/api/when2meet/route";

describe("/api/when2meet route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("returns 400 when url is missing", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid when2meet url", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  describe("parsing time slots", () => {
    // Timestamps are built in local time because the route buckets by
    // getDay()/getHours().
    const ts = (hour: number, minute = 0, day = 5) =>
      Math.floor(new Date(2026, 9, day, hour, minute).getTime() / 1000);

    const pageFor = (slots: number[], available: number[][]) => `
      <html><body>
        <span id="NewEventNameDiv">Mentor Availability</span>
        <script>
          PeopleNames = ['Alice','Bob'];
          PeopleIDs = [101,102];
          TimeOfSlot = [${slots.join(",")}];
          AvailableAtSlot = [${available.map((a) => `[${a.join(",")}]`).join(",")}];
        </script>
      </body></html>`;

    const post = async (html: string) => {
      mockFetch.mockResolvedValue({ ok: true, text: async () => html });
      const req = {
        json: vi
          .fn()
          .mockResolvedValue({ url: "https://www.when2meet.com/?123-ABC" }),
      } as any;
      return POST(req);
    };

    it("drops 11:00, keeps 12:00, and drops 18:00", async () => {
      // 2026-10-05 is a Monday
      const html = pageFor(
        [ts(11), ts(12), ts(17, 45), ts(18)],
        [[101], [101, 102], [102], [101]]
      );

      const res = await post(html);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.eventName).toBe("Mentor Availability");
      expect(body.participants).toEqual(["Alice", "Bob"]);

      // Only the 12:00 full-hour slot is aggregated
      expect(body.slots).toEqual([
        { day: "Monday", hour: 12, availableNames: ["Alice", "Bob"] },
      ]);

      // Raw slots keep every 12:00-17:59 quarter, and nothing before/after
      expect(body.rawTimeSlots).toEqual([
        { dayIndex: 1, hour: 12, minute: 0, availableIds: [101, 102] },
        { dayIndex: 1, hour: 17, minute: 45, availableIds: [102] },
      ]);
    });

    it("ignores weekends even inside 12:00-18:00", async () => {
      // 2026-10-10 is a Saturday
      const html = pageFor([ts(13, 0, 10)], [[101]]);
      const body = await (await post(html)).json();
      expect(body.slots).toEqual([]);
      expect(body.rawTimeSlots).toEqual([]);
    });
  });

  it("returns 502 when upstream fetch fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: "Bad Gateway" });

    const req = {
      json: vi
        .fn()
        .mockResolvedValue({ url: "https://www.when2meet.com/?123-ABC" }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});
