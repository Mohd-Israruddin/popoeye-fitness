import React, { useEffect, useState } from 'react';
import api from '../../service/api';
import { useAuth } from '../../data/AuthContext';
import './Staff.css'; // Reuse staff page styles for consistency

const StaffLog = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [filters, setFilters] = useState({
    staff_id: '',
    action: '',
    target_type: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchStaff();
    fetchAdmins();
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const fetchStaff = async () => {
    const res = await api.get('/staff');
    setStaffList(res.data);
  };
  const fetchAdmins = async () => {
    const res = await api.get('/admin/list');
    setAdminList(res.data);
  };
  const fetchLogs = async (customFilters = filters, customSortDesc = sortDesc) => {
    const params = { ...customFilters };
    // Remove empty filters
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    const query = new URLSearchParams(params).toString();
    const url = `/staff/logs${query ? '?' + query : ''}`;
    const res = await api.get(url);
    let data = res.data;
    // Sorting (if needed)
    if (!customSortDesc) {
      data = [...data].reverse();
    }
    setLogs(data);
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchLogs(newFilters);
  };
  const handleDateChange = e => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchLogs(newFilters);
  };
  const handleSearch = e => {
    const newFilters = { ...filters, search: e.target.value };
    setFilters(newFilters);
    fetchLogs(newFilters);
  };
  const handleSort = () => {
    setSortDesc(!sortDesc);
    fetchLogs(filters, !sortDesc);
  };

  if (!isAdmin) return <div className="not-authorized">Not authorized.</div>;

  return (
    <div className="staff-page">
      <div className="card staff-log-card">
        <h2 className="page-title">Staff & Admin Activity Log</h2>
        <div className="filter-row" style={{display:'flex',gap:'1rem',flexWrap:'wrap',marginBottom:'1rem'}}>
          <div>
            <label>By Person: </label>
            <select name="staff_id" value={filters.staff_id} onChange={handleFilterChange}>
              <option value="">All</option>
              {staffList.map(staff => (
                <option key={'staff-'+staff.id} value={staff.id}>{staff.name} (Staff)</option>
              ))}
              {adminList.map(admin => (
                <option key={'admin-'+admin.id} value={admin.id}>{admin.username} (Admin)</option>
              ))}
            </select>
          </div>
          <div>
            <label>Action: </label>
            <select name="action" value={filters.action} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="add">Add</option>
              <option value="edit">Edit</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div>
            <label>Target: </label>
            <select name="target_type" value={filters.target_type} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="member">Member</option>
              <option value="finance">Finance</option>
              <option value="staff">Staff</option>
              <option value="inventory">Inventory</option>
              <option value="enquiry">Enquiry</option>
              {/* Add more as needed */}
            </select>
          </div>
          <div>
            <label>From: </label>
            <input type="date" name="start_date" value={filters.start_date} onChange={handleDateChange} />
          </div>
          <div>
            <label>To: </label>
            <input type="date" name="end_date" value={filters.end_date} onChange={handleDateChange} />
          </div>
          <div>
            <label>Search: </label>
            <input type="text" name="search" value={filters.search} onChange={handleSearch} placeholder="Details..." />
          </div>
        </div>
        <div className="table-responsive">
          <table className="log-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Action</th>
                <th>Target</th>
                <th style={{cursor:'pointer'}} onClick={handleSort} title="Sort by date">Date/Time {sortDesc ? '▼' : '▲'}</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center',color:'#888'}}>No logs found.</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.name_with_role}</td>
                  <td>{log.action}</td>
                  <td>{log.target_type} #{log.target_id}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffLog; 