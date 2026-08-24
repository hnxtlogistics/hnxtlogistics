export default function PageTitle({ title, description }) {
  return (
    <div className="page-title dark-background" style={{ backgroundImage: 'url(/assets/img/page-title-bg.jpg)' }}>
      <div className="container position-relative">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}