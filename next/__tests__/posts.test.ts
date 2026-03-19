import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPostData } from "@/lib/posts";

describe("getPostData", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sanitizes hostile HTML before returning it", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      text: vi.fn().mockResolvedValue(
        `# Test

<script>alert("xss")</script>
<img src="x" onerror="alert('xss')" />
[bad](javascript:alert(1))
`
      ),
    } as any);

    const result = await getPostData("https://example.com/test.md");
    const html = String(result.props.htmlContent);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
});
