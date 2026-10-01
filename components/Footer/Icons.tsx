import type { SocialIcon } from "@/lib/event";

/**
 * Inline footer glyphs.
 *
 * Kept as local SVG rather than an icon dependency: a handful of marks do not
 * justify a package, and these render in a server component with no client
 * bundle cost.
 *
 * Every glyph is drawn on the same 24-unit grid at the same line weight, so the
 * footer reads as one set of marks. The dots that are solid (Instagram's flash,
 * the phone's home button) stay solid circles rather than strokes.
 */

/** Line weight for every footer glyph — 1.5x the original 1.6. */
export const ICON_STROKE = 2.4;

const common = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  "aria-hidden": true,
  focusable: false,
} as const;

/** The three social marks, keyed by the `icon` name in `EVENT.socials`. */
export default function SocialIcon({ name }: { name: SocialIcon }) {
  if (name === "instagram") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={ICON_STROKE}>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "linkedin") {
    /* The one glyph that is a solid wordmark rather than a line drawing, so it
       takes no stroke: outlining filled shapes rounds their corners and blobs
       the dot. Its weight comes from the paths themselves. */
    return (
      <svg {...common} fill="currentColor">
        <rect x="3" y="8.8" width="3.5" height="12.2" />
        <circle cx="4.75" cy="5.2" r="2.05" />
        <path d="M9.2 8.8h3.35v1.65h.05c.5-.9 1.72-1.7 3.3-1.7 2.95 0 4.3 1.72 4.3 4.85V21h-3.5v-5.9c0-1.5-.5-2.4-1.78-2.4-1.32 0-2.22.9-2.22 2.4V21H9.2V8.8Z" />
      </svg>
    );
  }

  /* WhatsApp — a chat bubble, which reads unambiguously at this size. */
  return (
    <svg
      {...common}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinejoin="round"
    >
      <path d="M20.6 11.7c0 4.1-3.85 7.45-8.6 7.45-.95 0-1.87-.14-2.72-.4L4.4 20.6l1.4-3.7a7.13 7.13 0 0 1-1.4-5.2c0-4.11 3.85-7.45 8.6-7.45s7.6 3.34 7.6 7.45Z" />
      <path d="M8.9 11.7h.01M12 11.7h.01M15.1 11.7h.01" strokeLinecap="round" />
    </svg>
  );
}

/** Contact marks: a phone set for the phone link, an envelope for email. */
export type ContactIconName = "phone" | "mail";

export function ContactIcon({ name }: { name: ContactIconName }) {
  if (name === "phone") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={ICON_STROKE}>
        <rect x="7.1" y="2.6" width="9.8" height="18.8" rx="2.6" />
        <path d="M10.7 5.9h2.6" strokeLinecap="round" />
        <circle cx="12" cy="18.5" r="1.05" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={ICON_STROKE}>
      <rect x="2.9" y="5.4" width="18.2" height="13.2" rx="2.4" />
      <path d="M5.4 8.1 12 12.9l6.6-4.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
