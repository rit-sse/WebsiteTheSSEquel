"use client";

// Original implementation of the soggy.cat feature set for the SSE site.
// See page.tsx for provenance and photo attribution notes.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Spline_Sans_Mono } from "next/font/google";
import styles from "./soggycat.module.css";

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--soggy-font",
});

const DEFAULT_PHOTO = "/images/soggycat.webp";
const DEFAULT_GRADIENT =
  "radial-gradient(circle, rgb(120, 205, 210) 0%, rgb(255, 240, 190) 30%, " +
  "rgb(195, 150, 205) 55%, rgb(255, 160, 160) 80%, rgb(250, 201, 110) 100%)";

const TILT_MAX_DEG = 12;
const TILT_SCALE = 1.05;

/**
 * Extract up to `count` dominant colors from an image element. The image
 * is drawn on a small canvas, and pixels are grouped in coarse RGB
 * buckets. The average color of the most-populated buckets wins.
 */
function extractPalette(
  img: HTMLImageElement,
  count: number
): [number, number, number][] {
  const canvas = document.createElement("canvas");
  const sample = 64;
  const scale = sample / Math.max(img.naturalWidth, img.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return [];
  }

  const buckets = new Map<
    number,
    { r: number; g: number; b: number; n: number }
  >();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((bucket) => [
      Math.round(bucket.r / bucket.n),
      Math.round(bucket.g / bucket.n),
      Math.round(bucket.b / bucket.n),
    ]);
}

function gradientFromPalette(palette: [number, number, number][]): string {
  if (palette.length < 2) return DEFAULT_GRADIENT;
  const stops = palette.map(([r, g, b], i) => {
    const pos = Math.round((i / (palette.length - 1)) * 100);
    return `rgb(${r}, ${g}, ${b}) ${pos}%`;
  });
  return `radial-gradient(circle, ${stops.join(", ")})`;
}

/** Play a short synthesized buzz for a wrong secret code. */
function playBuzzer() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 110;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // Audio is optional; ignore playback failures.
  }
}

const SECRET_CODES: Record<string, string> = {
  SSE: "/",
  soggy: "https://soggy.cat",
  GOOG: "https://www.google.com/search?q=soggy+cat",
};

export default function SoggyCat() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(DEFAULT_PHOTO);
  const [gradient, setGradient] = useState(DEFAULT_GRADIENT);

  // Server-rendered as false; the client value wins after hydration.
  const isJune = useSyncExternalStore(
    () => () => {},
    () => new Date().getMonth() === 5,
    () => false
  );

  const frameRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (codeOpen) codeInputRef.current?.focus();
  }, [codeOpen]);

  // Pointer-driven 3D tilt, in the style of the vanilla-tilt library.
  const handleTiltMove = useCallback((e: React.PointerEvent) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    frame.style.transition = "";
    frame.style.transform =
      `perspective(1000px) rotateX(${(-y * 2 * TILT_MAX_DEG).toFixed(2)}deg) ` +
      `rotateY(${(x * 2 * TILT_MAX_DEG).toFixed(2)}deg) scale(${TILT_SCALE})`;
  }, []);

  const handleTiltLeave = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.transition = "transform 400ms ease";
    frame.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setPhotoSrc(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // After an uploaded photo renders, rebuild the gradient from its colors.
  const handlePhotoLoad = useCallback(() => {
    const img = photoRef.current;
    if (!img || img.src.startsWith(window.location.origin + DEFAULT_PHOTO)) {
      return;
    }
    const palette = extractPalette(img, 5);
    if (palette.length > 0) setGradient(gradientFromPalette(palette));
  }, []);

  const closeCode = useCallback(() => setCodeOpen(false), []);

  const handleCodeKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        closeCode();
        return;
      }
      if (e.key !== "Enter") return;
      const code = e.currentTarget.value.trim();
      if (code === "") {
        closeCode();
        return;
      }
      const target = SECRET_CODES[code];
      if (target) {
        window.location.href = target;
      } else {
        playBuzzer();
        closeCode();
      }
    },
    [closeCode]
  );

  const menuPill = `${styles.menuPill}`;
  const smallPill = `${styles.menuPill} ${styles.menuPillSmall}`;

  return (
    <div className={`${styles.stage} ${splineSansMono.variable}`}>
      <div className={styles.backdrop} style={{ background: gradient }} />

      <div
        ref={frameRef}
        className={
          isJune ? `${styles.tiltFrame} ${styles.holo}` : styles.tiltFrame
        }
        onPointerMove={handleTiltMove}
        onPointerLeave={handleTiltLeave}
        onClick={
          isJune
            ? () => (window.location.href = "https://soggy.cat")
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- src swaps to a data URL on upload */}
        <img
          ref={photoRef}
          className={styles.catPhoto}
          src={photoSrc}
          onLoad={handlePhotoLoad}
          width={768}
          height={1024}
          alt="a picture of a wet cat inside a bathtub."
        />
      </div>

      <nav
        id="soggy-menu"
        className={
          menuOpen ? styles.menu : `${styles.menu} ${styles.menuClosed}`
        }
        inert={!menuOpen}
      >
        <a
          className={styles.menuLink}
          href="https://github.com/rit-sse/WebsiteTheSSEquel"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="code"
        >
          <div className={menuPill}>
            <CodeIcon />
            <p>code</p>
          </div>
        </a>

        <button
          type="button"
          className={styles.menuLink}
          onClick={() => setCodeOpen(true)}
          aria-label="enter code"
        >
          <div className={smallPill}>
            <KeyIcon />
            <p>enter code</p>
          </div>
        </button>

        <a
          className={styles.menuLink}
          href="/soggycat/nocss"
          aria-label="no css"
        >
          <div className={smallPill}>
            <NoCssIcon />
            <p>no css</p>
          </div>
        </a>

        <button
          type="button"
          className={styles.menuLink}
          onClick={() => pickerRef.current?.click()}
          aria-label="upload"
        >
          <div className={smallPill}>
            <UploadIcon />
            <p>upload</p>
          </div>
        </button>

        <a
          className={styles.menuLink}
          href="https://commons.wikimedia.org/wiki/File:Sphynx_taking_a_bath.jpg"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="photo credit"
        >
          <div className={smallPill}>
            <PhotoIcon />
            <p>photo</p>
            <sup className={styles.menuNote}>(CC BY-SA)</sup>
          </div>
        </a>

        <a
          className={styles.menuLink}
          href="https://soggy.cat"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="the original soggy.cat"
        >
          <div className={smallPill}>
            <CatIcon />
            <p>original</p>
          </div>
        </a>
      </nav>

      <button
        type="button"
        className={styles.circleButton}
        aria-label="Navigation"
        aria-expanded={menuOpen}
        aria-controls="soggy-menu"
        onClick={() => setMenuOpen((open) => !open)}
      />

      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      {codeOpen && (
        <div
          className={styles.codeOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCode();
          }}
        >
          <div className={styles.codePill}>
            <input
              ref={codeInputRef}
              type="text"
              placeholder="code"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={handleCodeKey}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="8 6 3 12 8 18" />
      <polyline points="16 6 21 12 16 18" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11 L20 2 M16 6 L19 9" />
    </svg>
  );
}

function NoCssIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16 V4 M7 9 L12 4 L17 9" />
      <path d="M4 20 H20" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 15 L16 10 L8 19" />
    </svg>
  );
}

function CatIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10 L4 3 L8 7 L16 7 L20 3 L20 10 A8 7 0 0 1 4 10 Z" />
      <circle cx="9" cy="11" r="0.5" fill="currentColor" />
      <circle cx="15" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}
