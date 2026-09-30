import { Link } from 'react-router-dom';

/**
 * The logo, used exactly as supplied. Every surface it appears on is light,
 * because the mark is indigo and mid-grey drawn for a white ground.
 */
export default function LogoMark({
  to,
  alt = 'HNXT Logistics',
  className = '',
  imgClassName = 'h-11 w-auto sm:h-12'
}) {
  const image = <img src="/img/logo.png" alt={alt} className={imgClassName} width="500" height="167" />;

  if (!to) return <span className={`inline-flex ${className}`}>{image}</span>;

  return (
    <Link to={to} className={`inline-flex items-center ${className}`} aria-label={`${alt} — home`}>
      {image}
    </Link>
  );
}
