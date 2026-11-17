import { useEffect, useState } from 'react';
import { ArrowRight, GitBranch, Play, RotateCw, Zap } from 'lucide-react';
import api from '../api.js';
import SectionTitle from '../components/SectionTitle.jsx';
import Badge from '../components/Badge.jsx';

export default function Simulations() {
  const [systems, setSystems] = useState([]);
  const [history, setHistory] = useState([]);
  const [failedSystem, setFailedSystem] = useState('');
  const [algorithm, setAlgorithm] = useState('BFS');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadHistory = () => api.get('/simulations').then(({ data }) => setHistory(data)).catch((e) => setError(e.response?.data?.message || 'Unable to load simulation history'));
  useEffect(() => { api.get('/systems').then(({ data }) => { setSystems(data); if (data.length) setFailedSystem(data[0]._id); }).catch((e) => setError(e.response?.data?.message || 'Unable to load systems')); loadHistory(); }, []);
  const run = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setResult(null);
    try { const { data } = await api.post('/simulations', { failedSystem, algorithm }); setResult(data); await loadHistory(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to run simulation'); }
    finally { setLoading(false); }
  };
  const selectedSystem = systems.find((system) => system._id === failedSystem);
  return <div><SectionTitle eyebrow="RESILIENCE TESTING" title="Impact simulations" description="Model a system failure and see which downstream services may be affected." />
    {error && <div className="form-error page-error">{error}</div>}
    <div className="simulation-layout">
      <section className="panel simulation-config"><div className="sim-config-icon"><Zap size={19} /></div><h3>Configure simulation</h3><p>Select a service to fail and trace the downstream impact through your dependency graph.</p>
        <form onSubmit={run}><label className="form-label">System to simulate as failed<select required value={failedSystem} onChange={(e) => setFailedSystem(e.target.value)}><option value="">Select a system</option>{systems.map((system) => <option key={system._id} value={system._id}>{system.name}</option>)}</select></label>
        {selectedSystem && <div className="selected-system"><span className="system-symbol service">SVC</span><div><b>{selectedSystem.name}</b><small>{selectedSystem.criticality} criticality · {selectedSystem.type}</small></div></div>}
        <label className="form-label">Traversal algorithm<select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}><option value="BFS">Breadth-first search (BFS)</option><option value="DFS">Depth-first search (DFS)</option></select></label>
        <div className="algorithm-note"><GitBranch size={16} /><span><b>{algorithm === 'BFS' ? 'Breadth-first' : 'Depth-first'} traversal</b><small>{algorithm === 'BFS' ? 'Explores nearest downstream dependencies first.' : 'Follows each dependency chain to its end first.'}</small></span></div>
        <button className="primary-btn run-sim-btn" disabled={loading || !systems.length}>{loading ? <><RotateCw className="spin" size={16} /> Analyzing impact…</> : <><Play size={16} /> Run impact simulation</>}</button></form>
      </section>
      <section className="panel simulation-results"><div className="panel-head"><div><h3>Simulation results</h3><p>{result ? `Failure scenario: ${result.failedSystem?.name}` : 'Run a simulation to see affected services'}</p></div>{result && <Badge>{result.summary?.riskLevel} risk</Badge>}</div>
        {result ? <><div className="result-summary"><div><span>Impacted systems</span><b>{result.summary.totalImpacted}</b></div><div><span>Aggregate risk score</span><b>{result.summary.riskScore}<small>/ 100</small></b></div><div><span>Traversal</span><b>{result.algorithm}</b></div></div>
          <div className="impact-chain-title"><b>Downstream impact chain</b><span>{result.impactedSystems?.length || 0} affected</span></div>
          {result.impactedSystems?.length ? <div className="impact-chain">{result.impactedSystems.map((item) => <div key={item._id} className="impact-chain-row"><div className="chain-depth">{item.depth}</div><div className="chain-line" /><div className="system-symbol service">SVC</div><div className="chain-system"><b>{item.system?.name}</b><small>{item.system?.type} · Path: {item.path?.map((nodeId) => systems.find((system) => system._id === nodeId)?.name).filter(Boolean).join(' → ')}</small></div><Badge>{item.severity}</Badge></div>)}</div> : <div className="no-impact"><span>✓</span><b>No downstream impact detected</b><small>This system has no dependent downstream services.</small></div>}
        </> : <div className="simulation-placeholder"><div className="placeholder-orbit"><div><GitBranch size={28} /></div></div><b>Ready to analyze</b><span>Choose a system and run a simulation.<br />Your impact path will appear here.</span></div>}
      </section>
    </div>
    <section className="panel history-panel"><div className="panel-head"><div><h3>Simulation history</h3><p>Recent failure scenarios run in your workspace</p></div></div><div className="table-scroll"><table><thead><tr><th>FAILED SYSTEM</th><th>IMPACTED SYSTEMS</th><th>RISK SCORE</th><th>RISK LEVEL</th><th>ALGORITHM</th><th>RUN BY</th><th>DATE</th></tr></thead><tbody>{history.slice(0, 10).map((item) => <tr key={item._id}><td><b>{item.failedSystem?.name}</b></td><td>{item.summary?.totalImpacted}</td><td>{item.summary?.riskScore}/100</td><td><Badge>{item.summary?.riskLevel}</Badge></td><td>{item.algorithm}</td><td>{item.createdBy?.name || '—'}</td><td>{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{!history.length && <div className="empty-state compact">Your completed simulations will appear here.</div>}</div></section>
  </div>;
}
