import SectionBackdrop from "@/components/SectionBackdrop/SectionBackdrop";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import { ASSETS } from "@/lib/assets";
import { EVENT, REGISTER_FACTS } from "@/lib/event";

import "./Register.css";

/**
 * Register — the anchor the hero CTA points at.
 *
 * Restates the facts a visitor needs before committing, directly above the
 * button, so nobody has to scroll back up to find them.
 */
export default function Register() {
  return (
    <section className="section section--crisis register" id="register" aria-labelledby="register-title">
      <SectionBackdrop src={ASSETS.scenery.giant} focal="50% 62%" />
      <div className="section__inner register__inner">
        <div className="reveal reveal--mask">
          <SectionHeading
            id="register-title"
            index="04"
            eyebrow="Register"
            title="REGISTER NOW"
          />
        </div>

        <dl className="register__facts">
          {REGISTER_FACTS.map((fact) => (
            <div className="stat register__fact reveal reveal--print" key={fact.label}>
              <dt className="label">{fact.label}</dt>
              <dd className="stat__value">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <p className="lead register__closing reveal">{EVENT.register.closing}</p>

        <div className="register__cta reveal">
          <a className="btn btn--primary" href={EVENT.register.url}>
            {EVENT.register.ctaLabel}
          </a>
          <p className="label register__status">{EVENT.register.status}</p>
        </div>
      </div>
    </section>
  );
}
