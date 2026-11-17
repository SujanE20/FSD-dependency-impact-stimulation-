import { useEffect, useState } from 'react';
import { Activity, Boxes, GitFork, Zap } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api.js';
import SectionTitle from '../components/SectionTitle.jsx';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';

const riskColors = { Critical: '#f16c77', High: '#f2a64e', Medium: '#7d8cff', Low: '#41c9a1' };
export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/analytics').then(({ data: result }) => setData(result)).catch((e) => setError(e.response?.data?.message || 'Unable to load analytics')); }, []);
  return <div><SectionTitle eyebrow="INSIGHTS" title="Analytics" description="Understand system risk, dependency scale, and operational changes." />
    {error && <div className="form-error page-error">{error}</div>}
    <div className="stat-grid"><StatCard label="Systems monitored" value={data?.totals.systems} note="Across all environments" icon={Boxes} tone="violet" /><StatCard label="Dependency links" value={data?.totals.dependencies} note="Mapped connections" icon={GitFork} tone="blue" /><StatCard label="Simulations" value={data?.totals.simulations} note="All-time runs" icon={Zap} tone="amber" /><StatCard label="Unread alerts" value={data?.totals.unreadNotifications} note="Needs attention" icon={Activity} tone="red" /></div>
    <div className="analytics-grid"><section className="panel analytics-chart"><div className="panel-head"><div><h3>Risk distribution</h3><p>Systems grouped by calculated impact score</p></div></div><div className="risk-chart-inner"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data?.riskDistribution || []} dataKey="value" nameKey="name" innerRadius={72} outerRadius={103} paddingAngle={4} stroke="none">{(data?.riskDistribution || []).map((entry) => <Cell key={entry.name} fill={riskColors[entry.name]} />)}</Pie><Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }} /></PieChart></ResponsiveContainer><div className="risk-chart-center"><b>{data?.totals.systems || 0}</b><small>systems</small></div></div><div className="risk-legend">{(data?.riskDistribution || []).map((item) => <div key={item.name}><span><i style={{ background: riskColors[item.name] }} />{item.name}</span><b>{item.value}</b></div>)}</div></section>
      <section className="panel analytics-table"><div className="panel-head"><div><h3>Highest impact systems</h3><p>Ranked by criticality, connections, and business impact</p></div></div><div className="table-scroll"><table><thead><tr><th>SYSTEM</th><th>CRITICALITY</th><th>IMPACT SCORE</th><th>RISK</th></tr></thead><tbody>{data?.topSystems?.map((system) => <tr key={system._id}><td><b>{system.name}</b><small className="table-subline">{system.type} · {system.owner}</small></td><td><Badge>{system.criticality}</Badge></td><td><div className="score-bar"><i style={{ width: `${system.impactScore}%` }} /><b>{system.impactScore}</b></div></td><td><Badge>{system.riskLevel}</Badge></td></tr>)}</tbody></table>{!data?.topSystems?.length && <div className="empty-state compact">No system scores available.</div>}</div></section></div>
    <section className="panel analytics-audit"><div className="panel-head"><div><h3>Recent activity</h3><p>Latest actions across your workspace</p></div></div>{data?.recentAuditLogs?.length ? data.recentAuditLogs.map((log) => <div className="activity-row" key={log._id}><div className="activity-avatar">{log.actor?.name?.[0] || 'S'}</div><div><b>{log.actor?.name || 'System'} <span>{log.action}</span> {log.resource}</b><small>{new Date(log.createdAt).toLocaleString()}</small></div><span className="activity-resource">{log.resourceId?.slice(-8) || '—'}</span></div>) : <div className="empty-state compact">Audit activity appears as your team uses the platform.</div>}</section>
  </div>;
}
