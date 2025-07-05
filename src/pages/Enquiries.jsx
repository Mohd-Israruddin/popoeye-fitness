import React, { useState, useEffect } from 'react';
import api from '../service/api';
import './Enquiries.css';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaFilePdf, FaFilter, FaDownload, FaUsers, FaUserPlus, FaUserClock, FaUserCheck, FaUserTimes, FaEnvelope } from 'react-icons/fa';
import { FiUsers, FiUserPlus, FiClock, FiFilter, FiPlus, FiMail } from 'react-icons/fi';
import AdminPasskeyModal from '../assets/components/AdminPasskeyModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [filteredEnquiries, setFilteredEnquiries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingEnquiry, setEditingEnquiry] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        source: 'Walk-in',
        interest: 'Membership',
        status: 'New',
        follow_up_date: '',
        notes: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sourceFilter, setSourceFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPasskeyModal, setShowPasskeyModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [pendingEditEnquiry, setPendingEditEnquiry] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [adminCredentials, setAdminCredentials] = useState(null);

    useEffect(() => {
        fetchEnquiries();
    }, []);

    useEffect(() => {
        let result = enquiries.filter(e => {
            const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                e.phone.includes(searchTerm) ||
                                (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
            const matchesSource = sourceFilter === 'All' || e.source === sourceFilter;
            
            return matchesSearch && matchesStatus && matchesSource;
        });
        setFilteredEnquiries(result);
    }, [searchTerm, statusFilter, sourceFilter, enquiries]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const res = await api.get('/enquiries');
            setEnquiries(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to fetch enquiries.' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Input change:', name, value); // Debug log
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            console.log('Updated form data:', newData); // Debug log
            return newData;
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        console.log('Submitting form data:', formData);
        console.log('Form validation - name:', formData.name, 'phone:', formData.phone);
        
        // Validate required fields
        if (!formData.name || !formData.phone) {
            setMessage({ type: 'error', text: 'Name and phone number are required.' });
            setLoading(false);
            return;
        }
        
        const url = editingEnquiry
            ? `/enquiries/${editingEnquiry.id}`
            : '/enquiries';
        const method = editingEnquiry ? 'put' : 'post';

        // Prepare request data
        let requestData = { ...formData };
        if (adminCredentials) {
            requestData = {
                ...formData,
                created_by: adminCredentials.created_by
            };
        }

        try {
            console.log('Making request to:', url, 'with method:', method);
            console.log('Request data:', requestData);
            const response = await api[method](url, requestData);
            console.log('Response:', response.data);
            setMessage({ type: 'success', text: `Enquiry successfully ${editingEnquiry ? 'updated' : 'added'}.` });
            fetchEnquiries();
            closeModal();
            // Clear admin credentials after successful edit
            if (editingEnquiry) {
                setAdminCredentials(null);
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save enquiry.' });
        } finally {
            setLoading(false);
        }
    };

    const openModal = (enquiry = null) => {
        console.log('Opening modal with enquiry:', enquiry); // Debug log
        if (enquiry) {
            setEditingEnquiry(enquiry);
            const editData = {
                name: enquiry.name,
                phone: enquiry.phone,
                email: enquiry.email || '',
                source: enquiry.source || 'Walk-in',
                interest: enquiry.interest || 'Membership',
                status: enquiry.status || 'New',
                follow_up_date: enquiry.follow_up_date ? enquiry.follow_up_date.slice(0, 10) : '',
                notes: enquiry.notes || ''
            };
            console.log('Setting edit data:', editData); // Debug log
            setFormData(editData);
        } else {
            setEditingEnquiry(null);
            const newData = {
                name: '', phone: '', email: '', source: 'Walk-in', interest: 'Membership',
                status: 'New', follow_up_date: '', notes: ''
            };
            console.log('Setting new data:', newData); // Debug log
            setFormData(newData);
        }
        setShowModal(true);
    };

    const handleAddClick = () => {
        setPendingEditEnquiry(null); // This will trigger add mode
        setShowPasskeyModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEnquiry(null);
        setAdminCredentials(null);
    };

    const handleEditClick = (enquiry) => {
        setPendingEditEnquiry(enquiry);
        setShowPasskeyModal(true);
    };

    const handleDeleteClick = (id) => {
        setPendingDeleteId(id);
        setShowPasskeyModal(true);
    };

    const handlePasskeySuccess = async ({ code }) => {
        try {
            if (pendingDeleteId) {
                // Handle delete
                await api.delete(`/enquiries/${pendingDeleteId}`, { data: { created_by: code } });
                fetchEnquiries();
                setPendingDeleteId(null);
                setMessage({ type: 'success', text: 'Enquiry deleted successfully.' });
            } else if (pendingEditEnquiry) {
                // Store credentials for edit and open modal
                setAdminCredentials({ created_by: code });
                setShowPasskeyModal(false);
                openModal(pendingEditEnquiry);
                setPendingEditEnquiry(null);
            } else {
                // Handle add - store credentials and open modal
                setAdminCredentials({ created_by: code });
                setShowPasskeyModal(false);
                openModal();
            }
        } catch (err) {
            console.error('Passkey verification error:', err);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid admin code.' });
        }
    };

    const exportToPDF = () => {
        try {
            const pdf = new jsPDF();
            
            // Add title
            pdf.setFontSize(20);
            pdf.setTextColor(40, 178, 149);
            pdf.text('Enquiries Report', 20, 20);
            
            // Add date
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
            
            // Prepare table data
            const tableData = filteredEnquiries.map(enq => [
                enq.name,
                enq.phone,
                enq.email || 'N/A',
                enq.source,
                enq.interest,
                enq.status,
                enq.follow_up_date ? new Date(enq.follow_up_date).toLocaleDateString() : 'N/A'
            ]);
            
            // Add table
            autoTable(pdf, {
                head: [['Name', 'Phone', 'Email', 'Source', 'Interest', 'Status', 'Follow-up Date']],
                body: tableData,
                startY: 40,
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                    headStyles: {
                        fillColor: [40, 178, 149],
                        textColor: 255
                    }
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 25 }
                }
            });
            
            console.log('PDF generated successfully');
            pdf.save('enquiries-report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const getStatusStats = () => {
        const stats = {
            total: enquiries.length,
            new: enquiries.filter(e => e.status === 'New').length,
            followUp: enquiries.filter(e => e.status === 'Follow-up').length
        };
        return stats;
    };

    const stats = getStatusStats();
    
    // Dismiss message after 3 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="enquiries-page">
            {/* Hero Section */}
            <div className="enquiries-hero-section">
                <div className="enquiries-hero-content">
                    <div className="enquiries-header-left">
                        <h1>Enquiry CRM</h1>
                        <p>Manage all potential leads and track their journey from enquiry to membership.</p>
                    </div>
                    <div className="enquiries-action-buttons">
                        <button className="enquiries-btn enquiries-btn-secondary" onClick={exportToPDF}>
                            <FaFilePdf />
                            <span>Export PDF</span>
                        </button>
                        <button className="enquiries-btn enquiries-btn-primary" onClick={handleAddClick}>
                            <FaPlus />
                            <span>Add Enquiry</span>
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`enquiries-message-banner ${message.type === 'success' ? 'enquiries-success' : 'enquiries-error'}`}>
                    {message.text}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="enquiries-stats-grid">
                <div className="enquiries-stat-card">
                    <div className="enquiries-stat-icon">
                        <FiUsers />
                    </div>
                    <div className="enquiries-stat-content">
                        <p>Total Enquiries</p>
                        <h3>{stats.total}</h3>
                    </div>
                </div>
                <div className="enquiries-stat-card">
                    <div className="enquiries-stat-icon">
                        <FiUserPlus />
                    </div>
                    <div className="enquiries-stat-content">
                        <p>New</p>
                        <h3>{stats.new}</h3>
                    </div>
                </div>
                <div className="enquiries-stat-card">
                    <div className="enquiries-stat-icon">
                        <FiClock />
                    </div>
                    <div className="enquiries-stat-content">
                        <p>Follow-up</p>
                        <h3>{stats.followUp}</h3>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="enquiries-controls-section">
                <div className="enquiries-search-section">
                    <div className="enquiries-search-bar-wrapper">
                        <div className="enquiries-search-bar">
                            <FaSearch className="enquiries-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        className="enquiries-btn enquiries-filter-toggle" 
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter />
                        <span>Filters</span>
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="enquiries-filters-panel">
                        <div className="enquiries-filter-group">
                            <label>Status:</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="All">All Statuses</option>
                                <option value="New">New</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Converted">Converted</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>
                        <div className="enquiries-filter-group">
                            <label>Source:</label>
                            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                <option value="All">All Sources</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Phone Call">Phone Call</option>
                                <option value="Website">Website</option>
                                <option value="Referral">Referral</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className="enquiries-results-summary">
                <div className="enquiries-results-info">
                    <span>Showing {filteredEnquiries.length} of {enquiries.length} enquiries</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="enquiries-table-section">
                <table className="enquiries-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Source</th>
                            <th>Interest</th>
                            <th>Status</th>
                            <th>Follow-up Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="enquiries-loading-row">Loading enquiries...</td></tr>
                        ) : filteredEnquiries.length > 0 ? (
                            filteredEnquiries.map(enq => (
                                <tr key={enq.id}>
                                    <td>{enq.name}</td>
                                    <td>
                                        <div>{enq.phone}</div>
                                        <div className="enquiries-email-text">{enq.email}</div>
                                    </td>
                                    <td>{enq.source}</td>
                                    <td>{enq.interest}</td>
                                    <td><span className={`enquiries-status-badge enquiries-status-${enq.status.toLowerCase()}`}>{enq.status}</span></td>
                                    <td>
                                        {enq.follow_up_date ? (
                                            <div>
                                                <div>{new Date(enq.follow_up_date).toLocaleDateString()}</div>
                                                {new Date(enq.follow_up_date) < new Date() && enq.status !== 'Converted' && enq.status !== 'Lost' && (
                                                    <div className="enquiries-overdue-badge">Overdue</div>
                                                )}
                                            </div>
                                        ) : 'N/A'}
                                    </td>

                                    <td>
                                        <div className="enquiries-action-buttons">
                                            <button 
                                                className="enquiries-edit-btn" 
                                                onClick={() => handleEditClick(enq)}
                                                title="Edit Enquiry (Requires Admin/Staff Code)"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="enquiries-delete-btn" 
                                                onClick={() => handleDeleteClick(enq.id)}
                                                title="Delete Enquiry (Requires Admin/Staff Code)"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="enquiries-no-results-row">No enquiries found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="enquiries-modal-overlay">
                    <div className="enquiries-modal-content">
                        <div className="enquiries-modal-header">
                            <h2>{editingEnquiry ? 'Edit Enquiry' : 'Add New Enquiry'}</h2>
                            <button className="enquiries-close-btn" onClick={closeModal}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="enquiries-form-grid">
                                <div className="enquiries-form-group">
                                    <label>Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="enquiries-form-group">
                                    <label>Phone *</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                                </div>
                                <div className="enquiries-form-group">
                                    <label>Email (Optional)</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                                </div>
                                <div className="enquiries-form-group">
                                    <label>Source</label>
                                    <select name="source" value={formData.source} onChange={handleInputChange}>
                                        <option>Walk-in</option>
                                        <option>Phone Call</option>
                                        <option>Website</option>
                                        <option>Referral</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="enquiries-form-group">
                                    <label>Interest</label>
                                    <select name="interest" value={formData.interest} onChange={handleInputChange}>
                                        <option>Membership</option>
                                        <option>Personal Training</option>
                                        <option>Zumba</option>
                                        <option>Yoga</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="enquiries-form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option>New</option>
                                        <option>Follow-up</option>
                                        <option>Converted</option>
                                        <option>Lost</option>
                                    </select>
                                </div>
                            </div>
                            <div className="enquiries-form-group">
                                <label>Follow-up Date (Optional)</label>
                                <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleInputChange} />
                            </div>
                            <div className="enquiries-form-group">
                                <label>Notes (Optional)</label>
                                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any additional notes about this enquiry..."></textarea>
                            </div>
                            <div className="enquiries-form-actions">
                                <button type="submit" className="enquiries-save-btn" disabled={loading}>{loading ? 'Saving...' : 'Save Enquiry'}</button>
                                <button type="button" className="enquiries-cancel-btn" onClick={closeModal}>Close</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AdminPasskeyModal 
                isOpen={showPasskeyModal} 
                onClose={() => {
                    setShowPasskeyModal(false);
                    setPendingDeleteId(null);
                    setPendingEditEnquiry(null);
                }} 
                onSuccess={handlePasskeySuccess}
                title={pendingDeleteId ? "Delete Enquiry" : (pendingEditEnquiry ? "Edit Enquiry" : "Add Enquiry")}
                message={pendingDeleteId ? "Enter admin/staff code to delete this enquiry" : (pendingEditEnquiry ? "Enter admin/staff code to edit this enquiry" : "Enter admin/staff code to add new enquiry")}
            />
        </div>
    );
};

export default Enquiries; 