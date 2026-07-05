function label(status) {
  return String(status || 'draft').replace(/_/g, ' ');
}

export default function StatusBadge({ status, winner }) {
  const badgeClass = winner ? 'winner' : (status || 'draft');
  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      <span>{winner ? 'Winner' : label(status)}</span>
    </span>
  );
}
