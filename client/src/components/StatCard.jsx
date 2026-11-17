import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, change, note, icon: Icon, tone = 'blue' }) {
  const down = change?.startsWith('-');
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value ?? '—'}</div>
    <div className="stat-foot"><span className={down ? 'trend-down' : 'trend-up'}>{down ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{change}</span><span>{note}</span></div>
  </article>;
}
