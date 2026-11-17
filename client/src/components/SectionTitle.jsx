export default function SectionTitle({ eyebrow, title, description, actions }) {
  return <div className="section-title"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="section-actions">{actions}</div>}</div>;
}
