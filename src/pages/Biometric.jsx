import React, { useState, useEffect } from 'react';
import axios from '../service/api';
import { toast } from 'react-toastify';
import './Biometric.css';
import { FaFingerprint, FaServer, FaSync, FaCheckCircle, FaTimesCircle, FaPlus, FaTrash, FaEdit, FaUsers, FaClock, FaChartBar, FaCalendarAlt } from 'react-icons/fa';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Biometric = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const [devices, setDevices] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [enrolledMembers, setEnrolledMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    ip_address: '',
    server_domain: '',
    port: 4370,
    serial_number: '',
    device_name: '',
    mac_address: '',
    firmware_version: ''
  });
  const [useDomain, setUseDomain] = useState(false);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    totalCheckOuts: 0,
    uniqueMembers: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [monthlyStats, setMonthlyStats] = useState({
    dailyAttendance: [],
    memberAttendance: [],
    totalDays: 0,
    averageDaily: 0,
    peakDay: null,
    peakDayCount: 0
  });

  useEffect(() => {
    loadDevices();
    if (activeTab === 'attendance') {
      loadAttendanceLogs();
      loadStats();
    } else if (activeTab === 'members') {
      loadEnrolledMembers();
    } else if (activeTab === 'monthly') {
      loadMonthlyStats();
    }
  }, [activeTab, selectedMonth]);

  const loadDevices = async () => {
    try {
      const response = await axios.get('/biometric/devices');
      setDevices(response.data);
    } catch (error) {
      toast.error('Failed to load devices');
    }
  };

  const loadAttendanceLogs = async () => {
    try {
      const response = await axios.get('/biometric/attendance?limit=100');
      setAttendanceLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Failed to load attendance logs');
    }
  };

  const loadEnrolledMembers = async () => {
    try {
      const response = await axios.get('/biometric/members');
      setEnrolledMembers(response.data);
    } catch (error) {
      toast.error('Failed to load enrolled members');
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/biometric/attendance/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDevice) {
        await axios.put(`/biometric/devices/${editingDevice.id}`, deviceForm);
        toast.success('Device updated successfully');
      } else {
        await axios.post('/biometric/devices', deviceForm);
        toast.success('Device added successfully');
      }
      setShowDeviceModal(false);
      setEditingDevice(null);
      setUseDomain(false);
      setDeviceForm({
        name: '',
        ip_address: '',
        server_domain: '',
        port: 4370,
        serial_number: '',
        device_name: '',
        mac_address: '',
        firmware_version: ''
      });
      loadDevices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setUseDomain(!!device.server_domain);
    setDeviceForm({
      name: device.name,
      ip_address: device.ip_address || '',
      server_domain: device.server_domain || '',
      port: device.port,
      serial_number: device.serial_number || '',
      device_name: device.device_name || '',
      mac_address: device.mac_address || '',
      firmware_version: device.firmware_version || ''
    });
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await axios.delete(`/biometric/devices/${id}`);
      toast.success('Device deleted successfully');
      loadDevices();
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleTestConnection = async (device) => {
    setLoading(true);
    try {
      const response = await axios.post(`/biometric/devices/${device.id}/test`);
      if (response.data.success) {
        toast.success('Connection successful!');
        loadDevices();
      } else {
        toast.error(response.data.error || 'Connection failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAttendance = async (device) => {
    setLoading(true);
    try {
      const response = await axios.post(`/biometric/devices/${device.id}/sync`);
      toast.success(`Synced ${response.data.syncedCount} attendance logs`);
      if (activeTab === 'attendance') {
        loadAttendanceLogs();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to sync attendance');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const loadMonthlyStats = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      const response = await axios.get(`/biometric/attendance?start_date=${startDate}&end_date=${endDate}&limit=10000`);
      const logs = response.data.logs || [];
      
      // Process daily attendance
      const dailyMap = {};
      const memberMap = {};
      
      logs.forEach(log => {
        const date = log.check_time.split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { checkIns: 0, checkOuts: 0, uniqueMembers: new Set() };
        }
        if (log.check_type === 'check_in') {
          dailyMap[date].checkIns++;
        } else if (log.check_type === 'check_out') {
          dailyMap[date].checkOuts++;
        }
        if (log.member_id) {
          dailyMap[date].uniqueMembers.add(log.member_id);
        }
        
        // Member attendance tracking
        const memberKey = log.member_id || `user_${log.biometric_user_id}`;
        if (log.member_name || log.biometric_user_id) {
          if (!memberMap[memberKey]) {
            memberMap[memberKey] = {
              name: log.member_name || `User ${log.biometric_user_id}`,
              member_code: log.member_code || null,
              member_id: log.member_id,
              checkIns: 0,
              checkOuts: 0,
              days: new Set()
            };
          }
          if (log.check_type === 'check_in') {
            memberMap[memberKey].checkIns++;
            memberMap[memberKey].days.add(date);
          } else if (log.check_type === 'check_out') {
            memberMap[memberKey].checkOuts++;
          }
        }
      });
      
      // Convert to arrays and sort
      const dailyAttendance = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          checkIns: data.checkIns,
          checkOuts: data.checkOuts,
          uniqueMembers: data.uniqueMembers.size,
          total: data.checkIns + data.checkOuts
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const memberAttendance = Object.values(memberMap)
        .map(member => ({
          ...member,
          days: member.days.size
        }))
        .sort((a, b) => b.days - a.days);
      
      // Calculate statistics
      const totalDays = dailyAttendance.length;
      const totalCheckIns = dailyAttendance.reduce((sum, day) => sum + day.checkIns, 0);
      const averageDaily = totalDays > 0 ? Math.round(totalCheckIns / totalDays) : 0;
      const peakDay = dailyAttendance.reduce((max, day) => 
        day.checkIns > (max?.checkIns || 0) ? day : max, null
      );
      
      setMonthlyStats({
        dailyAttendance,
        memberAttendance,
        totalDays,
        averageDaily,
        peakDay: peakDay?.date || null,
        peakDayCount: peakDay?.checkIns || 0
      });
    } catch (error) {
      toast.error('Failed to load monthly statistics');
      console.error(error);
    }
  };

  return (
    <div className="biometric-container">
      <div className="biometric-header">
        <h1><FaFingerprint /> Biometric Management</h1>
        <p>Manage biometric devices and view attendance logs</p>
      </div>

      <div className="biometric-tabs">
        <button
          className={activeTab === 'devices' ? 'active' : ''}
          onClick={() => setActiveTab('devices')}
        >
          <FaServer /> Devices
        </button>
        <button
          className={activeTab === 'attendance' ? 'active' : ''}
          onClick={() => setActiveTab('attendance')}
        >
          <FaClock /> Attendance
        </button>
        <button
          className={activeTab === 'members' ? 'active' : ''}
          onClick={() => setActiveTab('members')}
        >
          <FaUsers /> Enrolled Members
        </button>
        <button
          className={activeTab === 'monthly' ? 'active' : ''}
          onClick={() => setActiveTab('monthly')}
        >
          <FaChartBar /> Monthly Tracker
        </button>
      </div>

      <div className="biometric-content">
        {activeTab === 'devices' && (
          <div className="devices-section">
            <div className="section-header">
              <h2>Biometric Devices</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingDevice(null);
                  setDeviceForm({
                    name: '',
                    ip_address: '',
                    server_domain: '',
                    port: 4370,
                    serial_number: '',
                    device_name: '',
                    mac_address: '',
                    firmware_version: ''
                  });
                  setUseDomain(false);
                  setShowDeviceModal(true);
                }}
              >
                <FaPlus /> Add Device
              </button>
            </div>

            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.id} className="device-card">
                  <div className="device-header">
                    <h3>{device.name}</h3>
                    <span className={`status-badge ${device.status}`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="device-info">
                    {device.server_domain ? (
                      <p><strong>Domain:</strong> {device.server_domain}:{device.port}</p>
                    ) : (
                      <p><strong>IP:</strong> {device.ip_address}:{device.port}</p>
                    )}
                    {device.server_domain && device.ip_address && (
                      <p><strong>IP:</strong> {device.ip_address}</p>
                    )}
                    {device.serial_number && <p><strong>Serial:</strong> {device.serial_number}</p>}
                    {device.device_name && <p><strong>Device:</strong> {device.device_name}</p>}
                    {device.mac_address && <p><strong>MAC:</strong> {device.mac_address}</p>}
                    {device.firmware_version && <p><strong>Firmware:</strong> {device.firmware_version}</p>}
                    {device.last_sync && (
                      <p><strong>Last Sync:</strong> {formatDateTime(device.last_sync)}</p>
                    )}
                  </div>
                  <div className="device-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => handleTestConnection(device)}
                      disabled={loading}
                    >
                      Test Connection
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleSyncAttendance(device)}
                      disabled={loading}
                    >
                      <FaSync /> Sync
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEditDevice(device)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteDevice(device.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              {devices.length === 0 && (
                <div className="empty-state">
                  <FaServer size={48} />
                  <p>No devices configured</p>
                  <button className="btn-primary" onClick={() => setShowDeviceModal(true)}>
                    Add Your First Device
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="stats-grid">
              <div className="stat-card">
                <FaCheckCircle className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.totalCheckIns}</h3>
                  <p>Total Check-ins</p>
                </div>
              </div>
              <div className="stat-card">
                <FaTimesCircle className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.totalCheckOuts}</h3>
                  <p>Total Check-outs</p>
                </div>
              </div>
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.uniqueMembers}</h3>
                  <p>Unique Members</p>
                </div>
              </div>
            </div>

            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Member</th>
                    <th>Device</th>
                    <th>Type</th>
                    <th>Verification</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.check_time)}</td>
                      <td>
                        {log.member_name ? (
                          <>
                            {log.member_name}
                            {log.member_code && <span className="member-code">({log.member_code})</span>}
                          </>
                        ) : (
                          <span className="unknown-user">User ID: {log.biometric_user_id}</span>
                        )}
                      </td>
                      <td>{log.device_name || log.ip_address}</td>
                      <td>
                        <span className={`check-type ${log.check_type}`}>
                          {log.check_type === 'check_in' ? 'Check-in' : 
                           log.check_type === 'check_out' ? 'Check-out' : 'Unknown'}
                        </span>
                      </td>
                      <td>{log.verification_mode || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge ${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendanceLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="empty-table">
                        No attendance logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-section">
            <div className="section-header">
              <h2>Enrolled Members</h2>
            </div>
            <div className="members-table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Device</th>
                    <th>Biometric User ID</th>
                    <th>Fingerprints</th>
                    <th>Faces</th>
                    <th>Enrolled At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledMembers.map(member => (
                    <tr key={`${member.id}-${member.device_id}`}>
                      <td>{member.member_id}</td>
                      <td>{member.name}</td>
                      <td>{member.device_name || member.ip_address}</td>
                      <td>{member.biometric_user_id}</td>
                      <td>{member.fingerprint_count || 0}</td>
                      <td>{member.face_count || 0}</td>
                      <td>{formatDateTime(member.enrolled_at)}</td>
                      <td>
                        <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {enrolledMembers.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-table">
                        No enrolled members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="monthly-tracker-section">
            <div className="section-header">
              <h2>Monthly Attendance Tracker</h2>
              <div className="month-selector">
                <FaCalendarAlt />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="month-input"
                />
              </div>
            </div>

            {/* Monthly Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <FaCheckCircle className="stat-icon" />
                <div className="stat-content">
                  <h3>{monthlyStats.dailyAttendance.reduce((sum, day) => sum + day.checkIns, 0)}</h3>
                  <p>Total Check-ins</p>
                </div>
              </div>
              <div className="stat-card">
                <FaUsers className="stat-icon" />
                <div className="stat-content">
                  <h3>{monthlyStats.memberAttendance.length}</h3>
                  <p>Active Members</p>
                </div>
              </div>
              <div className="stat-card">
                <FaChartBar className="stat-icon" />
                <div className="stat-content">
                  <h3>{monthlyStats.averageDaily}</h3>
                  <p>Avg Daily Check-ins</p>
                </div>
              </div>
              <div className="stat-card">
                <FaCalendarAlt className="stat-icon" />
                <div className="stat-content">
                  <h3>{monthlyStats.totalDays}</h3>
                  <p>Days with Activity</p>
                </div>
              </div>
            </div>

            {/* Peak Day Info */}
            {monthlyStats.peakDay && (
              <div className="peak-day-info">
                <p>
                  <strong>Peak Day:</strong> {new Date(monthlyStats.peakDay).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} 
                  <span className="peak-count"> ({monthlyStats.peakDayCount} check-ins)</span>
                </p>
              </div>
            )}

            {/* Daily Attendance Chart */}
            {monthlyStats.dailyAttendance.length > 0 && (
              <div className="chart-container">
                <h3 className="chart-title">Daily Attendance Trend</h3>
                <Bar
                  data={{
                    labels: monthlyStats.dailyAttendance.map(day => {
                      const date = new Date(day.date);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }),
                    datasets: [
                      {
                        label: 'Check-ins',
                        data: monthlyStats.dailyAttendance.map(day => day.checkIns),
                        backgroundColor: 'rgba(40, 178, 149, 0.6)',
                        borderColor: '#28B295',
                        borderWidth: 2,
                      },
                      {
                        label: 'Check-outs',
                        data: monthlyStats.dailyAttendance.map(day => day.checkOuts),
                        backgroundColor: 'rgba(214, 248, 76, 0.6)',
                        borderColor: '#D6F84C',
                        borderWidth: 2,
                      },
                      {
                        label: 'Unique Members',
                        data: monthlyStats.dailyAttendance.map(day => day.uniqueMembers),
                        backgroundColor: 'rgba(255, 193, 7, 0.6)',
                        borderColor: '#FFC107',
                        borderWidth: 2,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: '#E3E3E0'
                        }
                      },
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        ticks: { color: '#b0b3b8' },
                        grid: { color: '#3A3A3C' }
                      },
                      y: {
                        ticks: { color: '#b0b3b8' },
                        grid: { color: '#3A3A3C' },
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Member Attendance Ranking */}
            {monthlyStats.memberAttendance.length > 0 && (
              <div className="member-attendance-section">
                <h3 className="section-subtitle">Member Attendance Ranking</h3>
                <div className="member-attendance-table-container">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Days Attended</th>
                        <th>Check-ins</th>
                        <th>Check-outs</th>
                        <th>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.memberAttendance.slice(0, 20).map((member, index) => {
                        const [year, month] = selectedMonth.split('-');
                        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                        const attendancePercent = daysInMonth > 0 ? Math.round((member.days / daysInMonth) * 100) : 0;
                        return (
                          <tr key={member.member_id || `user_${index}`}>
                            <td>
                              <span className={`rank-badge ${index < 3 ? 'top-rank' : ''}`}>
                                #{index + 1}
                              </span>
                            </td>
                            <td>{member.member_code || 'N/A'}</td>
                            <td>{member.name}</td>
                            <td><strong>{member.days}</strong> days</td>
                            <td>{member.checkIns}</td>
                            <td>{member.checkOuts}</td>
                            <td>
                              <span className={`attendance-percent ${attendancePercent >= 80 ? 'excellent' : attendancePercent >= 60 ? 'good' : attendancePercent >= 40 ? 'fair' : 'poor'}`}>
                                {attendancePercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {monthlyStats.memberAttendance.length === 0 && (
                        <tr>
                          <td colSpan="7" className="empty-table">
                            No attendance data for this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Calendar View */}
            {monthlyStats.dailyAttendance.length > 0 && (
              <div className="calendar-view-section">
                <h3 className="section-subtitle">Calendar View</h3>
                <div className="attendance-calendar">
                  {monthlyStats.dailyAttendance.map(day => {
                    const date = new Date(day.date);
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const intensity = Math.min(day.checkIns / (monthlyStats.peakDayCount || 1), 1);
                    
                    return (
                      <div 
                        key={day.date} 
                        className="calendar-day"
                        style={{
                          backgroundColor: `rgba(40, 178, 149, ${0.2 + intensity * 0.6})`,
                          borderColor: intensity > 0.7 ? '#28B295' : '#3A3A3C'
                        }}
                        title={`${day.date}: ${day.checkIns} check-ins, ${day.uniqueMembers} members`}
                      >
                        <div className="calendar-day-header">
                          <span className="calendar-day-name">{dayOfWeek}</span>
                          <span className="calendar-day-number">{dayNum}</span>
                        </div>
                        <div className="calendar-day-stats">
                          <div className="calendar-stat">
                            <FaCheckCircle className="calendar-icon" />
                            <span>{day.checkIns}</span>
                          </div>
                          <div className="calendar-stat">
                            <FaUsers className="calendar-icon" />
                            <span>{day.uniqueMembers}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {monthlyStats.dailyAttendance.length === 0 && (
              <div className="empty-state">
                <FaCalendarAlt size={48} />
                <p>No attendance data for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeviceModal && (
        <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
              <button className="modal-close" onClick={() => setShowDeviceModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <form onSubmit={handleDeviceSubmit}>
              <div className="form-group">
                <label>Device Name *</label>
                <input
                  type="text"
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                  required
                  placeholder="e.g., Main Entrance Device"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={useDomain}
                    onChange={(e) => {
                      setUseDomain(e.target.checked);
                      if (e.target.checked) {
                        setDeviceForm({ ...deviceForm, ip_address: '', server_domain: '' });
                      } else {
                        setDeviceForm({ ...deviceForm, ip_address: '', server_domain: '' });
                      }
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Use Domain Name (for remote access)
                </label>
              </div>
              {useDomain ? (
                <div className="form-group">
                  <label>Server Domain *</label>
                  <input
                    type="text"
                    value={deviceForm.server_domain}
                    onChange={(e) => setDeviceForm({ ...deviceForm, server_domain: e.target.value })}
                    required={useDomain}
                    placeholder="e.g., yourserver.com or api.yourgym.com"
                  />
                  <p className="form-hint">
                    Enter your server's domain name. Make sure DNS is configured to point to your server IP.
                  </p>
                </div>
              ) : (
                <div className="form-group">
                  <label>IP Address *</label>
                  <input
                    type="text"
                    value={deviceForm.ip_address}
                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
                    required={!useDomain}
                    placeholder="e.g., 192.168.1.201"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Port *</label>
                <input
                  type="number"
                  value={deviceForm.port}
                  onChange={(e) => setDeviceForm({ ...deviceForm, port: parseInt(e.target.value) })}
                  required
                  placeholder={useDomain ? "8081 (Push Service)" : "4370 (Pull) or 8081 (Push)"}
                />
                <p className="form-hint">
                  {useDomain 
                    ? "Use 8081 for Push Service (recommended with domain)"
                    : "Use 8081 for Push Service or 4370 for Pull Method"}
                </p>
              </div>
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  value={deviceForm.serial_number}
                  onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                  placeholder="Auto-detected on test"
                />
              </div>
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  value={deviceForm.device_name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, device_name: e.target.value })}
                  placeholder="Auto-detected on test"
                />
              </div>
              <div className="form-group">
                <label>MAC Address</label>
                <input
                  type="text"
                  value={deviceForm.mac_address}
                  onChange={(e) => setDeviceForm({ ...deviceForm, mac_address: e.target.value })}
                  placeholder="Auto-detected on test"
                />
              </div>
              <div className="form-group">
                <label>Firmware Version</label>
                <input
                  type="text"
                  value={deviceForm.firmware_version}
                  onChange={(e) => setDeviceForm({ ...deviceForm, firmware_version: e.target.value })}
                  placeholder="Auto-detected on test"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeviceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingDevice ? 'Update' : 'Add'} Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometric;

