import type { CSSProperties } from "react";

import SectionBackdrop from "@/components/SectionBackdrop/SectionBackdrop";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { ASSETS } from "@/lib/assets";
import { EVENT } from "@/lib/event";

import "./OurTheme.css";

/**
 * Share of an entry's `entry` timeline range spent typing its line, in %.
 * Passed to the CSS as `--ot-type-span` (see OurTheme.css); typing starts at
 * the CSS-owned `--ot-type-start` and runs to `start + span`. The start is
 * tuned late (55%) so the line types in visibly while the scene rises into
 * place, finishing just before the track pins.
 */
const TYPING_SPAN = 41;

/**
 * Our Theme — the lore beat, one pinned typed scene per log entry.
 *
 * The heading and metadata load in like any other section; after them, each
 * log entry is a scroll track taller than the viewport, holding a sticky
 * stage — a `LOG 0n` stamp over a huge line. The line types in character by
 * character as the track enters, the stage pins centred while you keep
 * scrolling, and near the end of its track the scene scales back and fades
 * while the next one slides up over it — a depth handoff, never a plain
 * scroll-away.
 *
 * Each character is its own span with its own slice of the track's named
 * view() timeline, so the reveal runs in reading order: a wrapped line types
 * line by line, like a terminal, instead of wiping across the whole block.
 * The line's text is also rendered once, visually hidden, for assistive tech.
 */
export default function OurTheme() {
  return (
    <section className="section section--crisis our-theme" id="theme" aria-labelledby="theme-title">
      <SectionBackdrop src={ASSETS.scenery.giant} focal="50% 38%" />

      <div className="section__inner our-theme__inner">
        <div className="reveal reveal--mask">
          <SectionHeading id="theme-title" title={EVENT.theme.lead} />
          <div className="our-theme__metadata" aria-label="Transmission metadata">
            <span className="label">Source: {EVENT.theme.source}</span>
            <span className="label">Status: {EVENT.theme.status}</span>
          </div>
        </div>

        {/* The log is the show: each track pins a typed scene, then recedes
            as the next slides in (see OurTheme.css). */}
        <ol className="our-theme__log">
          {EVENT.theme.log.map((entry) => {
            const chars = Array.from(entry.line);
            const step = `${(TYPING_SPAN / chars.length).toFixed(4)}%`;

            return (
              <li
                className="our-theme__entry"
                key={entry.stamp}
                style={{ "--ot-type-span": `${TYPING_SPAN}%` } as CSSProperties}
              >
                <div className="our-theme__stage">
                  <span className="label our-theme__stamp">{entry.stamp}</span>
                  <p className="our-theme__line">
                  {/* Assistive tech reads the line once, from here. */}
                  <span className="visually-hidden">{entry.line}</span>
                  <span
                    className="our-theme__typing"
                    aria-hidden="true"
                    style={{ "--ot-step": step } as CSSProperties}
                  >
                    {chars.map((char, index) => (
                      <span
                        className="our-theme__char"
                        key={`${entry.stamp}-${index}`}
                        style={{ "--ot-i": index } as CSSProperties}
                      >
                        {char}
                      </span>
                    ))}
                    <span className="our-theme__caret">
                      <span className="our-theme__caret-dot" />
                    </span>
                  </span>
                </p>
                <p className="our-theme__detail">{entry.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The closing beat, centred on a screen of its own. */}
      <div className="section__inner our-theme__outro reveal">
        <p className="lead our-theme__closing">{EVENT.theme.closing}</p>
        <p className="our-theme__handoff">{EVENT.theme.handoff}</p>
      </div>
    </section>
  );
}
