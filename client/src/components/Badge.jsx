export default function Badge({ children, className = '' }) {
  return <span className={`badge ${String(children).toLowerCase()} ${className}`}>{children}</span>;
}
