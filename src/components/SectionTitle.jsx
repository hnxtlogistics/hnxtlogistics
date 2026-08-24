export default function SectionTitle({ overline, title, description }) {
  return (
    <div className="container section-title">
      <span>{overline}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}