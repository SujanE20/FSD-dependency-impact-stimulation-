import { useCallback, useEffect, useMemo, useState } from 'react';
import { Background, Controls, MiniMap, ReactFlow, addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitFork, Plus, Save, Search, X } from 'lucide-react';
import api from '../api.js';
import SectionTitle from '../components/SectionTitle.jsx';

const positions = [{ x: 90, y: 170 }, { x: 370, y: 170 }, { x: 650, y: 170 }, { x: 930, y: 170 }, { x: 370, y: 390 }, { x: 930, y: 390 }, { x: 650, y: 390 }];
function nodeStyle(system) {
  const color = system.criticality === 'Critical' ? '#f06972' : system.criticality === 'High' ? '#f3a64e' : system.criticality === 'Medium' ? '#7988ff' : '#45c9a1';
  return { border: `1px solid ${color}66`, background: 'var(--surface-raised)', color: 'var(--text)', borderRadius: 12, padding: '14px 16px', width: 190, boxShadow: `0 5px 20px ${color}15` };
}
export default function DependencyMap() {
  const [systems, setSystems] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ source: '', target: '', type: 'sync', criticality: 'Medium' });
  const [error, setError] = useState('');
  const canEdit = true;
  const load = useCallback(async () => {
    try {
      const [{ data: systemList }, { data: dependencyList }] = await Promise.all([api.get('/systems'), api.get('/dependencies')]);
      setSystems(systemList); setRawEdges(dependencyList);
      const nodeList = systemList.map((system, index) => ({
        id: system._id, position: positions[index % positions.length], style: nodeStyle(system),
        data: { label: <div className="graph-node"><span className={`graph-node-icon ${system.criticality.toLowerCase()}`}>{system.type === 'Database' ? 'DB' : system.type === 'API' ? 'API' : 'S'}</span><div><b>{system.name}</b><small><i className={`status-dot ${system.health === 'Healthy' ? 'green' : system.health === 'Down' ? 'red' : 'amber'}`} />{system.health} · {system.criticality}</small></div></div> }
      }));
      setNodes(nodeList);
      setEdges(dependencyList.map((edge) => ({
        id: edge._id, source: edge.source._id, target: edge.target._id, label: edge.type,
        animated: edge.type === 'async', style: { stroke: edge.criticality === 'Critical' ? '#ef6a76' : '#64718b', strokeWidth: 1.7 },
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10 }, labelBgStyle: { fill: 'var(--surface)' }
      })));
    } catch (e) { setError(e.response?.data?.message || 'Unable to load dependency map'); }
  }, [setEdges, setNodes]);
  useEffect(() => { load(); }, [load]);
  const onConnect = useCallback(async (connection) => {
    try {
      const { data } = await api.post('/dependencies', { source: connection.source, target: connection.target, type: 'sync', criticality: 'Medium' });
      setRawEdges((current) => [...current, data]);
      setEdges((current) => addEdge({ ...connection, id: data._id, label: data.type, style: { stroke: '#64718b', strokeWidth: 1.7 } }, current));
    } catch (e) { setError(e.response?.data?.message || 'Unable to create dependency'); }
  }, [setEdges]);
  const addDependency = async (event) => {
    event.preventDefault();
    try { await api.post('/dependencies', form); setAdding(false); setForm({ source: '', target: '', type: 'sync', criticality: 'Medium' }); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to create dependency'); }
  };
  const deleteDependency = async (id) => {
    try { await api.delete(`/dependencies/${id}`); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Unable to delete dependency'); }
  };
  const edgeCount = useMemo(() => rawEdges.length, [rawEdges]);
  return <div><SectionTitle eyebrow="TOPOLOGY" title="Dependency map" description="Visualize how services connect and trace upstream and downstream relationships." actions={<><button className="secondary-btn" onClick={() => setAdding(true)}><Plus size={16} /> Add dependency</button><button className="primary-btn" onClick={load}><Save size={16} /> Save map</button></>} />
    {error && <div className="form-error page-error">{error}<button onClick={() => setError('')}><X size={14} /></button></div>}
    <div className="map-toolbar panel"><div className="map-toolbar-info"><span className="map-live"><i /> LIVE MAP</span><span className="toolbar-divider" /><span><b>{systems.length}</b> nodes</span><span><b>{edgeCount}</b> connections</span></div><div className="table-search map-search"><Search size={15} /><input placeholder="Search nodes..." onChange={(e) => { const val = e.target.value.toLowerCase(); setNodes((all) => all.map((node) => ({ ...node, hidden: val && !systems.find((s) => s._id === node.id)?.name.toLowerCase().includes(val) }))); }} /></div></div>
    <div className="flow-panel"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={canEdit ? onConnect : undefined} fitView fitViewOptions={{ padding: 0.2 }} deleteKeyCode={null}><Background color="var(--flow-dot)" gap={22} size={1} /><Controls /><MiniMap nodeColor={(node) => node.style?.border?.includes('#f06972') ? '#f06972' : '#7385f8'} maskColor="rgba(6,10,20,.72)" /></ReactFlow>
      {!systems.length && <div className="map-empty"><GitFork size={28} /><b>Your dependency map starts here</b><span>Add systems and connect them to visualize cascade paths.</span></div>}
      <div className="map-legend"><span><i className="legend-edge solid" />Synchronous</span><span><i className="legend-edge dashed" />Asynchronous</span><span><i className="legend-node critical" />Critical</span><span><i className="legend-node high" />High risk</span></div>
    </div>
    {rawEdges.length > 0 && <section className="panel edge-list-panel"><div className="panel-head"><div><h3>Connections</h3><p>Manage edges in this dependency map</p></div></div>{rawEdges.map((edge) => <div className="edge-row" key={edge._id}><span className="edge-system">{edge.source?.name}</span><span className="edge-arrow">→</span><span className="edge-system">{edge.target?.name}</span><span className="edge-type">{edge.type}</span><span className="edge-risk">{edge.criticality}</span><button className="row-icon-btn" onClick={() => deleteDependency(edge._id)} title="Delete dependency"><X size={15} /></button></div>)}</section>}
    {adding && <div className="modal-backdrop" onClick={() => setAdding(false)}><div className="modal-card modal-small" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><h2>Add dependency</h2><p>Connect an upstream system to a downstream system.</p></div><button className="icon-btn" onClick={() => setAdding(false)}><X size={17} /></button></div><form className="form-grid" onSubmit={addDependency}>
      <label className="form-label full">Source system<select required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option value="">Select a system</option>{systems.map((s) => <option value={s._id} key={s._id}>{s.name}</option>)}</select></label>
      <label className="form-label full">Depends on (downstream)<select required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}><option value="">Select a system</option>{systems.filter((s) => s._id !== form.source).map((s) => <option value={s._id} key={s._id}>{s.name}</option>)}</select></label>
      <label className="form-label">Connection type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="sync">Synchronous</option><option value="async">Asynchronous</option><option value="data">Data</option></select></label>
      <label className="form-label">Criticality<select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>{['Low', 'Medium', 'High', 'Critical'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <div className="form-actions full"><button type="button" className="secondary-btn" onClick={() => setAdding(false)}>Cancel</button><button className="primary-btn"><Plus size={15} /> Add connection</button></div>
    </form></div></div>}
  </div>;
}
