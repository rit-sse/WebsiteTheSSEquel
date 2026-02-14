"use client";

import React from "react";

/**
 * Custom login component for the Payload admin panel.
 *
 * Replaces the default email/password form with a Google OAuth button
 * that redirects through the existing next-auth sign-in flow.
 * Only active officers will be granted access (enforced by the custom
 * auth strategy on PayloadUsers).
 */
const SSOLogin: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        width: "100%",
        padding: "8px 0",
      }}
    >
      <p
        style={{
          textAlign: "center",
          opacity: 0.7,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Sign in with your RIT Google account to manage SSE content.
        <br />
        Only active officers have access.
      </p>

      <a
        href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/admin")}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "12px 24px",
          backgroundColor: "#4285F4",
          color: "#fff",
          borderRadius: "4px",
          textDecoration: "none",
          fontSize: "16px",
          fontWeight: 500,
          width: "100%",
          maxWidth: "320px",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            "#3367D6";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            "#4285F4";
        }}
      >
        {/* Google "G" icon */}
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
        Sign in with Google
      </a>
    </div>
  );
};

export default SSOLogin;
