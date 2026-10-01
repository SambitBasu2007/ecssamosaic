import SectionBackdrop from "@/components/SectionBackdrop/SectionBackdrop";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { ASSETS } from "@/lib/assets";
import { DOSSIER_ROWS } from "@/lib/event";

import "./EventDetails.css";

/**
 * Event Details, styled as a mission dossier.
 *
 * Label/value pairs in a terminal-readout grid rather than prose: multi-column
 * on desktop, a stacked list of hairline-separated rows on mobile.
 */
export default function EventDetails() {
  return (
    <section className="section section--crisis dossier" id="details" aria-labelledby="details-title">
      <SectionBackdrop src={ASSETS.scenery.dossier} focal="62% 58%" />
      <div className="section__inner">
        <div className="reveal reveal--mask">
          <SectionHeading
            id="details-title"
            index="03"
            eyebrow="Event details"
            title="Mission Dossier"
          />
        </div>

        {/* The dossier prints row by row rather than arriving as one panel —
            see `.reveal--print` in styles/sections.css. */}
        <dl className="dossier__grid">
          {DOSSIER_ROWS.map((row) => (
            <div className="stat dossier__row reveal reveal--print" key={row.id}>
              <dt className="label">{row.label}</dt>
              <dd className="stat__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
