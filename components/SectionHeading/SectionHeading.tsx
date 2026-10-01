import "./SectionHeading.css";

type Props = {
  /** id for the section's heading; sections point `aria-labelledby` at this. */
  id: string;
  /** Heading text, set in the display face. */
  title: string;
  /** Optional intro line under the heading. */
  lead?: string;
};

/**
 * Heading block shared by every section: a hairline, then the display-face
 * title, optional lead paragraph. Colours follow the section's phase through
 * `--accent` and `--hairline`.
 */
export default function SectionHeading({ id, title, lead }: Props) {
  return (
    <header className="section-heading">
      <h2 className="display-title section-heading__title" id={id}>
        {title}
      </h2>
      {lead ? <p className="lead section-heading__lead">{lead}</p> : null}
    </header>
  );
}
