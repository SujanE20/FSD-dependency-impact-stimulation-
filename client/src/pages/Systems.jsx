import { useEffect, useState } from 'react';
import { Boxes, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import api from '../api.js';
import SectionTitle from '../components/SectionTitle.jsx';
import Badge from '../components/Badge.jsx';

const emptyForm = { name: '', type: 'Service', owner: '', environment: 'Production', criticality: 'Medium', businessImpact: 5, health: 'Healthy', description: '' };
export default function Systems() {
  const [systems, setSystems] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canEdit = ['Admin', 'Architect', 'Engineer'].includes(JSON.parse(localStorage.getItem('user') || 'null')?.role);
  const load = () => api.get('/systems', { params: { search: search || undefined, type: type || undefined } }).then(({ data }) => setSystems(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load systems')).finally(() => setLoading(false));
  useEffect(() => { load(); }, [search, type]);
  const save = async (event) => {
    event.preventDefault(); setError('');
    try { await api.post('/systems', { ...form, businessImpact: Number(form.businessImpact) }); setModal(false); setForm(emptyForm); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to save system'); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this system? This cannot be undone.')) return;
    try { await api.delete(`/systems/${id}`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to delete system'); }
  };
  return <div><SectionTitle eyebrow="INVENTORY" title="Systems inventory" description="A single source of truth for the services and infrastructure you depend on." actions={canEdit && <button className="primary-btn" onClick={() => setModal(true)}><Plus size={16} /> Add system</button>} />
    {error && <div className="form-error page-error">{error}</div>}
    <section className="panel inventory-panel"><div className="inventory-toolbar"><div className="inventory-count"><Boxes size={16} /> <b>{systems.length}</b> systems tracked</div><div className="inventory-filters"><label className="table-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search systems..." /></label><label className="filter-select"><SlidersHorizontal size={15} /><select value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{['Service', 'API', 'Database', 'Server'].map((value) => <option key={value}>{value}</option>)}</select></label></div></div>
      <div className="table-scroll"><table><thead><tr><th>SYSTEM</th><th>TYPE</th><th>OWNER</th><th>ENVIRONMENT</th><th>CRITICALITY</th><th>HEALTH</th><th>IMPACT SCORE</th><th /></tr></thead><tbody>{systems.map((system) => <tr key={system._id}><td><div className="system-cell"><div className={`system-symbol ${system.type.toLowerCase()}`}>{system.type === 'Database' ? 'DB' : system.type === 'API' ? 'API' : system.type === 'Server' ? 'SV' : 'SVC'}</div><div><b>{system.name}</b><small>{system.description || system._id.slice(-8)}</small></div></div></td><td>{system.type}</td><td>{system.owner}</td><td><span className="environment-tag"><i />{system.environment}</span></td><td><Badge>{system.criticality}</Badge></td><td><span className="health-tag"><i className={`status-dot ${system.health === 'Healthy' ? 'green' : system.health === 'Down' ? 'red' : 'amber'}`} />{system.health}</span></td><td><span className="score-pill">{system.impactScore} <small>/ 100</small></span></td><td>{canEdit && <button className="row-icon-btn" onClick={() => remove(system._id)} title="Delete system"><Trash2 size={15} /></button>}</td></tr>)}</tbody></table>
        {!loading && !systems.length && <div className="empty-state"><Boxes size={25} /><b>No systems found</b><span>Add systems or adjust your search filters.</span></div>}
        {loading && <div className="empty-state">Loading systems…</div>}
      </div>
    </section>
    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><h2>Add a system</h2><p>Record a service or infrastructure component.</p></div><button className="icon-btn" onClick={() => setModal(false)}>×</button></div><form className="form-grid" onSubmit={save}>
      <label className="form-label full">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Payment Service" /></label>
      <label className="form-label">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Service', 'API', 'Database', 'Server'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label className="form-label">Owner<input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Team name" /></label>
      <label className="form-label">Criticality<select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>{['Low', 'Medium', 'High', 'Critical'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label className="form-label">Environment<select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>{['Production', 'Staging', 'Development'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label className="form-label">Business impact (1–10)<input type="number" min="1" max="10" value={form.businessImpact} onChange={(e) => setForm({ ...form, businessImpact: e.target.value })} /></label>
      <label className="form-label">Health<select value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value })}>{['Healthy', 'Degraded', 'Down'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <div className="form-actions full"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn"><Plus size={15} /> Create system</button></div>
    </form></div></div>}
  </div>;
}
