import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signMock = vi.fn(() => "app-jwt");

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: signMock,
  },
}));

describe("githubAmendmentService auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("uses GitHub App installation auth when app env is configured", async () => {
    process.env.GITHUB_APP_ID = "3394606";
    process.env.GITHUB_APP_PRIVATE_KEY =
      "-----BEGIN RSA PRIVATE KEY-----\\nline-one\\nline-two\\n-----END RSA PRIVATE KEY-----";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 987654 }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            token: "installation-token",
            expires_at: "2099-01-01T00:00:00.000Z",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: Buffer.from("Constitution text").toString("base64"),
            sha: "constitution-sha",
            encoding: "base64",
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { fetchConstitutionSnapshot } = await import(
      "@/lib/services/githubAmendmentService"
    );
    const snapshot = await fetchConstitutionSnapshot();

    expect(snapshot).toEqual({
      content: "Constitution text",
      sha: "constitution-sha",
    });
    expect(signMock).toHaveBeenCalledTimes(2);
    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({
        iss: "3394606",
      }),
      expect.stringContaining("\n"),
      expect.objectContaining({
        algorithm: "RS256",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.github.com/repos/rit-sse/governing-docs/installation",
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
    expect(
      (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers,
    ).toEqual(
      expect.objectContaining({
        get: expect.any(Function),
      }),
    );
    expect(
      (
        (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)
          ?.headers as Headers
      ).get("Authorization"),
    ).toBe("Bearer app-jwt");
    expect(
      (
        (fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)
          ?.headers as Headers
      ).get("Authorization"),
    ).toBe("Bearer app-jwt");
    expect(
      (
        (fetchMock.mock.calls[2]?.[1] as RequestInit | undefined)
          ?.headers as Headers
      ).get("Authorization"),
    ).toBe("Bearer installation-token");
  });

  it("falls back to GITHUB_PAT when no app env is configured", async () => {
    process.env.GITHUB_PAT = "legacy-token";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          content: Buffer.from("Constitution text").toString("base64"),
          sha: "constitution-sha",
          encoding: "base64",
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { fetchConstitutionSnapshot } = await import(
      "@/lib/services/githubAmendmentService"
    );
    await fetchConstitutionSnapshot();

    expect(signMock).not.toHaveBeenCalled();
    expect(
      (
        (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)
          ?.headers as Headers
      ).get("Authorization"),
    ).toBe("Bearer legacy-token");
  });
});
