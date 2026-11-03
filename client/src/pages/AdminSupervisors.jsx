import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaTrash, FaUserTie } from 'react-icons/fa';

const emptyForm = {
  name: '',
  employeeId: '',
  localBody: '',
  location: '',
  phone: '',
  active: true,
};

const AdminSupervisors = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSupervisors = async () => {
    try {
      const response = await api.get('/supervisors', { params: { includeInactive: 'true' } });
      setSupervisors(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load supervisors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/supervisors/${editingId}`, form);
        toast.success('Supervisor updated.');
      } else {
        await api.post('/supervisors', form);
        toast.success('Supervisor added.');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadSupervisors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save supervisor.');
    } finally {
      setSaving(false);
    }
  };

  const editSupervisor = (supervisor) => {
    setEditingId(supervisor._id);
    setForm({
      name: supervisor.name || '',
      employeeId: supervisor.employeeId || '',
      localBody: supervisor.localBody || '',
      location: supervisor.location || '',
      phone: supervisor.phone || '',
      active: supervisor.active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteSupervisor = async (id) => {
    if (!window.confirm('Remove this supervisor from the available list?')) return;
    try {
      await api.delete(`/supervisors/${id}`);
      toast.success('Supervisor removed.');
      await loadSupervisors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to remove supervisor.');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1><FaUserTie /> Supervisor Management</h1>
          <p className="dashboard-subtitle">Add and manage supervisors available for complaint assignment.</p>
        </div>
      </div>

      <div className="admin-panel">
        <h3>{editingId ? 'Edit Supervisor' : 'Add Supervisor'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supervisor-name">Name</label>
              <input id="supervisor-name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="supervisor-employeeId">Employee ID</label>
              <input id="supervisor-employeeId" name="employeeId" value={form.employeeId} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supervisor-localBody">Local Body</label>
              <input id="supervisor-localBody" name="localBody" value={form.localBody} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="supervisor-location">Location</label>
              <input id="supervisor-location" name="location" value={form.location} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supervisor-phone">Phone</label>
              <input id="supervisor-phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <label className="form-checkbox">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              Available for assignment
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <FaPlus /> {saving ? 'Saving...' : editingId ? 'Update Supervisor' : 'Add Supervisor'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              Cancel
            </button>
          )}
        </form>
      </div>

      {loading ? <p>Loading supervisors...</p> : (
        <div className="issues-grid">
          {supervisors.map((supervisor) => (
            <div className="issue-card" key={supervisor._id}>
              <div className="issue-card-content">
                <h3>{supervisor.name}</h3>
                <p><strong>ID:</strong> {supervisor.employeeId}</p>
                <p><strong>Local body:</strong> {supervisor.localBody}</p>
                <p><strong>Location:</strong> {supervisor.location}</p>
                {supervisor.phone && <p><strong>Phone:</strong> {supervisor.phone}</p>}
                <p className={supervisor.active ? 'text-success' : 'text-muted'}>
                  {supervisor.active ? 'Available' : 'Inactive'}
                </p>
                <div className="admin-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => editSupervisor(supervisor)}><FaEdit /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSupervisor(supervisor._id)}><FaTrash /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupervisors;
