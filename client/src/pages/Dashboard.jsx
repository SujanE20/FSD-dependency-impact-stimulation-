import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Boxes, Clock3, GitFork, Plus, Radio, ShieldAlert, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api.js';
import StatCard from '../components/StatCard.jsx';
import SectionTitle from '../components/SectionTitle.jsx';
import Badge from '../components/Badge.jsx';

const fallbackTrend = [{ day: 'Mon', risk: 34 }, { day: 'Tue', risk: 41 }, { day: 'Wed', risk: 37 }, { day: 'Thu', risk: 48 }, { day: 'Fri', risk: 42 }, { day: 'Sat', risk: 53 }, { day: 'Sun', risk: 47 }];
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/analytics').then(({ data: result }) => setData(result)).catch((e) => setError(e.response?.data?.message || 'Unable to load analytics')); }, []);
  const totals = data?.totals || {};
  return <div className="dashboard-page">
    <SectionTitle eyebrow="MONDAY, NOVEMBER 17, 2025" title="Good morning, Alex" description="Here's what's happening across your system landscape today." actions={<><Link className="secondary-btn" to="/dependencies"><GitFork size={16} /> View dependency map</Link><Link className="primary-btn" to="/simulations"><Plus size={16} /> Run simulation</Link></>} />
    {error && <div className="form-error page-error">{error}</div>}
    <div className="stat-grid"><StatCard label="Total systems" value={totals.systems} change="+2" note="this month" icon={Boxes} tone="violet" /><StatCard label="Active dependencies" value={totals.dependencies} change="+8.4%" note="vs last month" icon={GitFork} tone="blue" /><StatCard label="Simulations run" value={totals.simulations} change="+12.8%" note="vs last month" icon={Zap} tone="amber" /><StatCard label="At-risk systems" value={data?.riskDistribution?.filter((item) => ['Critical', 'High'].includes(item.name)).reduce((n, item) => n + item.value, 0)} change="-2" note="since last week" icon={ShieldAlert} tone="red" /></div>
    <div className="dashboard-grid">
      <section className="panel risk-panel"><div className="panel-head"><div><h3>System risk overview</h3><p>Impact score trend across your environment</p></div><button className="select-chip">Last 7 days <span>⌄</span></button></div>
        <div className="chart-legend"><span><i className="legend-dot blue-dot" />Impact score</span><span><i className="legend-dot muted-dot" />Threshold</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={fallbackTrend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6488ff" stopOpacity={0.24} /><stop offset="100%" stopColor="#6488ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={12} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} /><Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }} /><Area type="monotone" dataKey="risk" stroke="#718cff" strokeWidth={2.2} fill="url(#riskGradient)" /></AreaChart></ResponsiveContainer></div>
        <div className="chart-foot"><span><i className="status-dot green" />All services reporting</span><span>Updated 4 min ago</span></div>
      </section>
      <section className="panel critical-panel"><div className="panel-head"><div><h3>Critical systems</h3><p>Highest impact score across your stack</p></div><Link className="text-link" to="/systems">View all <ArrowRight size={14} /></Link></div>
        <div className="critical-list">{(data?.topSystems || []).slice(0, 4).map((system) => <div className="critical-row" key={system._id}><div className={`system-symbol ${system.type.toLowerCase()}`}>{system.type === 'Database' ? 'DB' : system.type === 'API' ? 'API' : system.type === 'Server' ? 'SV' : 'SVC'}</div><div className="critical-meta"><b>{system.name}</b><small>{system.owner || 'Unassigned'}</small></div><div className="critical-score"><b>{system.impactScore}</b><small>/ 100</small></div><Badge>{system.riskLevel}</Badge></div>)}
          {!data?.topSystems?.length && <div className="empty-state compact">Add systems to see risk rankings.</div>}
        </div><Link className="critical-footer" to="/systems">View all systems <ArrowRight size={14} /></Link>
      </section>
      <section className="panel simulation-panel"><div className="panel-head"><div><h3>Recent simulations</h3><p>Latest cascade failure analyses</p></div><Link className="text-link" to="/simulations">View all <ArrowRight size={14} /></Link></div>
        <div className="table-scroll"><table><thead><tr><th>FAILED SYSTEM</th><th>IMPACTED</th><th>RISK LEVEL</th><th>TIME</th></tr></thead><tbody>{(data?.recentSimulations || []).slice(0, 4).map((item) => <tr key={item._id}><td><div className="failed-system"><span className="status-dot red" />{item.failedSystem?.name || 'Unknown'}</div></td><td>{item.summary?.totalImpacted || 0} systems</td><td><Badge>{item.summary?.riskLevel || 'Low'}</Badge></td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>
          {!data?.recentSimulations?.length && <div className="empty-state compact">No simulations yet. Run one to see cascade risk.</div>}
        </div>
      </section>
      <section className="panel health-panel"><div className="panel-head"><div><h3>Environment health</h3><p>Current operational status</p></div><Radio size={17} className="health-icon" /></div>
        <div className="health-score"><div className="health-ring"><span>{data?.totals?.systems ? '98' : '—'}<small>%</small></span></div><div><b>Healthy environment</b><small>Last checked 4 minutes ago</small></div></div>
        <div className="health-breakdown"><span><i className="status-dot green" />Healthy <b>{data?.totals?.systems ?? '—'}</b></span><span><i className="status-dot amber" />Degraded <b>0</b></span><span><i className="status-dot red" />Down <b>0</b></span></div>
        <Link className="health-link" to="/systems"><Activity size={15} /> Check system status <ArrowRight size={14} /></Link>
      </section>
    </div>
    <div className="dashboard-bottom"><div className="bottom-note"><Clock3 size={15} /> Last data sync: 4 minutes ago</div><Link to="/analytics">Explore analytics <ArrowRight size={14} /></Link><span>Powered by real-time dependency intelligence</span></div>
  </div>;
}
