import { Big_Shoulders, Fraunces, JetBrains_Mono } from "next/font/google";

/**
 * Page-scoped fonts for /nominate. Imported as CSS variables so they
 * don't leak into the rest of the site's typography (which is built
 * around Inter via `var(--font-inter)`). The /nominate page wrapper
 * applies all three classes to make the variables available.
 */
export const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-stub",
  display: "swap",
});
