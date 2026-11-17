import { useEffect, useState } from 'react';
import { Shield, SlidersHorizontal } from 'lucide-react';
import api from '../api.js';
import SectionTitle from '../components/SectionTitle.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [resource, setResource] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api.get('/analytics/audit-logs', { params: resource ? { resource } : {} }).then(({ data }) => setLogs(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load audit logs')); }, [resource]);
  return <div><SectionTitle eyebrow="GOVERNANCE" title="Audit log" description="A traceable record of user actions and changes across the platform." />
    {error && <div className="form-error page-error">{error}</div>}
    <section className="panel audit-panel"><div className="inventory-toolbar"><div className="inventory-count"><Shield size={16} /> <b>{logs.length}</b> recent events</div><label className="filter-select"><SlidersHorizontal size={15} /><select value={resource} onChange={(e) => setResource(e.target.value)}><option value="">All resources</option>{['user', 'system', 'dependency', 'simulation', 'report'].map((x) => <option key={x}>{x}</option>)}</select></label></div>
      <div className="table-scroll"><table><thead><tr><th>ACTOR</th><th>ACTION</th><th>RESOURCE</th><th>DETAILS</th><th>IP ADDRESS</th><th>TIMESTAMP</th></tr></thead><tbody>{logs.map((log) => <tr key={log._id}><td><div className="audit-actor"><span>{log.actor?.name?.[0] || 'S'}</span>{log.actor?.name || 'System'}</div></td><td><span className="action-tag">{log.action}</span></td><td>{log.resource}</td><td className="audit-details">{log.resourceId ? `ID ${log.resourceId.slice(-8)}` : '—'}</td><td>{log.ipAddress || '—'}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{!logs.length && <div className="empty-state compact">No audit records match this filter.</div>}</div>
    </section>
  </div>;
}
