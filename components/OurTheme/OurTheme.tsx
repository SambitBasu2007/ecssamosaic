import SectionBackdrop from "@/components/SectionBackdrop/SectionBackdrop";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { ASSETS } from "@/lib/assets";
import { EVENT } from "@/lib/event";

import "./OurTheme.css";

/**
 * Our Theme — the recovered transmission in a straightforward reading flow.
 *
 * The four entries remain distinct and full-height, but scroll normally so
 * mobile browsers never have to coordinate nested sticky layers and timelines.
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
          {EVENT.theme.log.map((entry) => (
              <li
                className="our-theme__entry"
                key={entry.stamp}
              >
                <div className="our-theme__stage">
                  <span className="label our-theme__stamp">{entry.stamp}</span>
                  <p className="our-theme__line">{entry.line}</p>
                  <p className="our-theme__detail">{entry.detail}</p>
                </div>
              </li>
          ))}
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
