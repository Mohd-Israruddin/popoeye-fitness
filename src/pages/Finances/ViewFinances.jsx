import React, { useState, useEffect, useRef } from "react";
import api from "../../service/api";
import { 
  FaSync, 
  FaCalendarAlt, 
  FaPlus, 
  FaArrowUp, 
  FaArrowDown, 
  FaBalanceScale, 
  FaCalculator,
  FaUsers,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes
} from "react-icons/fa";
import "./ViewFinance.css";
import eventBus from "../../service/eventBus";
import AdminPasskeyModal from '../../assets/components/AdminPasskeyModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from 'react-modal';

// Utility to ensure date is always in 'YYYY-MM-DD' format for <input type='date' />
function toDateInputValue(date) {
  if (!date) return '';
  if (typeof date === 'string' && date.includes('T')) return date.split('T')[0];
  if (typeof date === 'string') return date;
  // If it's a Date object
  return new Date(date).toISOString().split('T')[0];
}

const ViewFinance = () => {
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editIndex, setEditIndex] = useState(null);
  const [editedEntry, setEditedEntry] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Profit/Loss Calculator State
  const [calculatorInputs, setCalculatorInputs] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    otherIncome: 0,
    otherExpenses: 0
  });

  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingEditId, setPendingEditId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [editCredentials, setEditCredentials] = useState({});

  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({ from: '', to: '', type: 'all' });
  const [exportSummary, setExportSummary] = useState({ totalIncome: 0, totalExpense: 0, profitLoss: 0 });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', type: '', amount: '', category: '', payment: '', description: '' });
  const [editError, setEditError] = useState('');
  const [editAdminCode, setEditAdminCode] = useState('');

  // Check if entry is from recurring transaction (based on description pattern)
  const isRecurringTransaction = (entry) => {
    return entry.description && entry.description.includes("Auto-generated from recurring transaction");
  };

  // Auto-populate calculator with actual data
  const autoPopulateCalculator = () => {
    const actualRevenue = entries
      .filter((e) => e.type === "income")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const actualExpenses = entries
      .filter((e) => e.type === "expense")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    setCalculatorInputs({
      totalRevenue: actualRevenue,
      totalExpenses: actualExpenses,
      otherIncome: 0,
      otherExpenses: 0
    });
  };

  // Auto-populate calculator when entries change
  useEffect(() => {
    if (entries.length > 0) {
      autoPopulateCalculator();
    }
  }, [entries]);

  useEffect(() => {
    fetchEntries();
    fetchMembers();

    const handleUpdate = () => fetchEntries();
    eventBus.on('transactions-updated', handleUpdate);

    return () => {
      eventBus.remove('transactions-updated', handleUpdate);
    };
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances");
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/members");
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setPendingAction('delete');
    setShowPasskeyModal(true);
  };

  const handleEditClick = (id) => {
    setPendingEditId(id);
    setPendingAction('edit');
    setShowPasskeyModal(true);
  };

  const handlePasskeySuccess = async ({ code }) => {
    setShowPasskeyModal(false);
    if (pendingAction === 'edit') {
      setEditCredentials({ admin_code: code });
      openEditModal(pendingEditId);
    } else if (pendingAction === 'delete') {
      try {
        await api.post(`/finances/${pendingDeleteId}/delete`, { admin_code: code });
        fetchEntries();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete.');
      }
    }
    setPendingEditId(null);
    setPendingDeleteId(null);
    setPendingAction(null);
  };

  const updateEntry = async () => {
    try {
      const id = editedEntry.id;
      const updateData = {
        ...editedEntry,
        admin_code: editCredentials.admin_code
      };
      console.log('Updating finance:', { date: editedEntry.date, type: editedEntry.type, amount: editedEntry.amount, category: editedEntry.category, payment: editedEntry.payment, description: editedEntry.description });
      await api.put(`/finances/${id}`, updateData);
      fetchEntries();
      setEditIndex(null);
      setEditCredentials({});
    } catch (err) {
      console.error("Failed to update entry:", err);
    }
  };

  const processRecurringTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.post("/recurring/process-due");
      alert(response.data.message);
      fetchEntries(); // Refresh the list to show new entries
      eventBus.dispatch('staff-data-updated'); // Signal staff page to update
    } catch (error) {
      alert("Failed to process recurring transactions");
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial metrics
  const totalIncome = entries
    .filter((e) => e.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = entries
    .filter((e) => e.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = totalIncome - totalExpense;

  // Count recurring transactions
  const recurringCount = entries.filter(e => isRecurringTransaction(e)).length;
  const totalRecurringAmount = entries
    .filter(e => isRecurringTransaction(e))
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Calculate member dues
  const totalDueAmount = members.reduce((acc, member) => {
    const pending = Number(member.pending_amount) || 0;
    return acc + pending;
  }, 0);

  const totalCollectedAmount = members.reduce((acc, member) => {
    const paid = Number(member.paid_amount) || 0;
    return acc + paid;
  }, 0);

  // Calculate profit/loss from calculator
  const calculatedProfit = (Number(calculatorInputs.totalRevenue) + Number(calculatorInputs.otherIncome)) - 
                          (Number(calculatorInputs.totalExpenses) + Number(calculatorInputs.otherExpenses));

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedEntry({ ...entries[index] });
  };

  const openEditModal = (entry) => {
    setEditEntry(entry);
    setEditForm({
      date: toDateInputValue(entry.date),
      type: entry.type || '',
      amount: entry.amount || '',
      category: entry.category || '',
      payment: entry.payment || '',
      description: entry.description || ''
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditEntry(null);
    setEditForm({ date: '', type: '', amount: '', category: '', payment: '', description: '' });
    setEditError('');
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editAdminCode) {
      setEditError('Admin code is required.');
      return;
    }
    try {
      await api.put(`/finances/${editEntry.id}`, { ...editForm, admin_code: editAdminCode });
      fetchEntries();
      closeEditModal();
      setEditAdminCode('');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update entry.');
    }
  };

  const getFilteredEntries = () => {
    return entries.filter(entry => {
      if (exportFilters.from && entry.date < exportFilters.from) return false;
      if (exportFilters.to && entry.date > exportFilters.to) return false;
      if (exportFilters.type !== 'all' && entry.type !== exportFilters.type) return false;
      return true;
    });
  };

  useEffect(() => {
    if (exportModalOpen) {
      const filtered = getFilteredEntries();
      const totalIncome = filtered.filter(e => e.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalExpense = filtered.filter(e => e.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
      setExportSummary({
        totalIncome,
        totalExpense,
        profitLoss: totalIncome - totalExpense
      });
    }
    // eslint-disable-next-line
  }, [exportFilters, exportModalOpen]);

  const openExportModal = () => setExportModalOpen(true);
  const closeExportModal = () => setExportModalOpen(false);

  const handleExportFilterChange = (e) => {
    const { name, value } = e.target;
    setExportFilters(f => ({ ...f, [name]: value }));
  };

  const handleConfirmExport = () => {
    handleDownloadPDF();
    closeExportModal();
  };

  const handleDownloadPDF = () => {
    const safeText = (txt) => typeof txt === 'string' ? txt : (txt !== undefined && txt !== null ? String(txt) : '');
    const safeNum = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;

    const doc = new jsPDF();
    doc.setFont('Roboto');
    const tealColor = [0, 128, 128];
    const blackColor = [0, 0, 0];
    const lightTeal = [240, 248, 255];

    // Title
    doc.setFontSize(20);
    doc.setTextColor(...tealColor);
    doc.text('Finance Report', 14, 20);

    // Table
    const tableColumn = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Created/Updated By'];
    const filteredEntries = getFilteredEntries();
    const tableRows = filteredEntries.map(entry => [
      entry?.date ? formatDate(entry.date) : '',
      entry?.type ? (entry.type.charAt(0).toUpperCase() + entry.type.slice(1)) : '',
      entry?.amount !== undefined && entry?.amount !== null
        ? Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })
        : '0.00',
      entry?.category ? String(entry.category) : '',
      entry?.description ? String(entry.description) : '',
      entry?.created_by ? String(entry.created_by) : '—'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        font: 'Roboto',
        fontSize: 10,
        cellPadding: 4,
        textColor: blackColor,
        lineColor: tealColor
      },
      headStyles: {
        fillColor: tealColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      alternateRowStyles: {
        fillColor: lightTeal
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { halign: 'right', cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 50 },
        5: { cellWidth: 30 }
      },
      margin: { left: 14, right: 14 },
      rowPageBreak: 'avoid'
    });

    // Summary Section
    const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const profitLoss = totalIncome - totalExpense;
    const tableEndY = (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number' && Number.isFinite(doc.lastAutoTable.finalY))
      ? doc.lastAutoTable.finalY
      : 40;
    let summaryY = tableEndY + 20;
    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...tealColor);
    doc.text('Financial Summary', 14, summaryY);
    doc.setFontSize(13);
    doc.setFont(undefined, 'normal');
    // Total Income
    doc.setTextColor(...tealColor);
    doc.text(`Total Income: ${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, summaryY + 12);
    // Total Expense
    doc.setTextColor(220, 53, 69);
    doc.text(`Total Expense: ${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, summaryY + 22);
    // Net Profit/Loss
    if (profitLoss >= 0) {
      doc.setTextColor(...tealColor);
    } else {
      doc.setTextColor(220, 53, 69);
    }
    doc.text(`Net Profit/Loss: ${profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14, summaryY + 32);

    doc.save('finance-report.pdf');
  };

  // Add state for file input
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // TODO: Implement import logic (CSV/Excel parsing)
    alert(`Selected file: ${file.name}`);
  };

  // Helper to format date as dd/mm/yyyy
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="view-finance-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Financial Overview</h1>
          <p>Track income, expenses, profit/loss, and member dues in real-time.</p>
        </div>
        <div className="hero-actions">
          <button 
            onClick={processRecurringTransactions}
            disabled={loading}
            className="btn"
          >
            <FaSync /> {loading ? 'Processing...' : 'Process Recurring'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">
            <FaArrowUp />
          </div>
          <div className="stat-content">
            <h3>₹{totalIncome.toLocaleString()}</h3>
            <p>Total Income</p>
          </div>
        </div>
        
        <div className="stat-card expense">
          <div className="stat-icon">
            <FaArrowDown />
          </div>
          <div className="stat-content">
            <h3>₹{totalExpense.toLocaleString()}</h3>
            <p>Total Expenses</p>
          </div>
        </div>
        
        <div className="stat-card balance">
          <div className="stat-icon">
            <FaBalanceScale />
          </div>
          <div className="stat-content">
            <h3>₹{balance.toLocaleString()}</h3>
            <p>Current Balance</p>
          </div>
        </div>
        
        <div className="stat-card recurring">
          <div className="stat-icon">
            <FaSync />
          </div>
          <div className="stat-content">
            <h3>{recurringCount}</h3>
            <p>Recurring Transactions</p>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-icon">
            <FaCalculator />
          </div>
          <div className="stat-content">
            <h3>₹{Math.max(0, calculatedProfit).toLocaleString()}</h3>
            <p>Calculated Profit</p>
          </div>
        </div>

        <div className="stat-card loss">
          <div className="stat-icon">
            <FaCalculator />
          </div>
          <div className="stat-content">
            <h3>₹{Math.abs(Math.min(0, calculatedProfit)).toLocaleString()}</h3>
            <p>Calculated Loss</p>
          </div>
        </div>

        <div className="stat-card due">
          <div className="stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>₹{totalDueAmount.toLocaleString()}</h3>
            <p>Pending Dues</p>
          </div>
        </div>

        <div className="stat-card collected">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h3>₹{totalCollectedAmount.toLocaleString()}</h3>
            <p>Collected Amount</p>
          </div>
        </div>
      </div>

      {/* Profit/Loss Calculator Section */}
      <div className="calculator-section">
        <div className="calculator-header">
          <h3>Profit/Loss Calculator</h3>
          <button 
            onClick={autoPopulateCalculator}
            className="btn btn-secondary"
            style={{ 
              background: 'linear-gradient(135deg, #8E44AD, #7D3C98)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaSync /> Auto-Calculate
          </button>
        </div>
        <p style={{ color: '#E3E3E0', opacity: 0.8, marginBottom: '1rem', fontSize: '0.9rem' }}>
          Calculator automatically populated with your actual financial data. You can adjust values manually or click "Auto-Calculate" to refresh.
        </p>
        <div className="calculator-grid">
          <div className="calculator-item">
            <label>Total Revenue</label>
            <input
              type="number"
              value={calculatorInputs.totalRevenue}
              onChange={(e) => handleCalculatorChange('totalRevenue', e.target.value)}
              placeholder="Enter total revenue"
            />
          </div>
          <div className="calculator-item">
            <label>Total Expenses</label>
            <input
              type="number"
              value={calculatorInputs.totalExpenses}
              onChange={(e) => handleCalculatorChange('totalExpenses', e.target.value)}
              placeholder="Enter total expenses"
            />
          </div>
          <div className="calculator-item">
            <label>Other Income</label>
            <input
              type="number"
              value={calculatorInputs.otherIncome}
              onChange={(e) => handleCalculatorChange('otherIncome', e.target.value)}
              placeholder="Enter other income"
            />
          </div>
          <div className="calculator-item">
            <label>Other Expenses</label>
            <input
              type="number"
              value={calculatorInputs.otherExpenses}
              onChange={(e) => handleCalculatorChange('otherExpenses', e.target.value)}
              placeholder="Enter other expenses"
            />
          </div>
        </div>
        <div className="calculator-result">
          <h4>Net Profit/Loss</h4>
          <div className={`result-amount ${calculatedProfit >= 0 ? 'profit' : 'loss'}`}>
            ₹{calculatedProfit.toLocaleString()}
          </div>
          <p>{calculatedProfit >= 0 ? 'Profit' : 'Loss'}</p>
        </div>
      </div>

      {/* Member Dues Section */}
      <div className="dues-section">
        <h3>Member Dues Overview</h3>
        <div className="dues-grid">
          <div className="dues-card">
            <h4>Total Pending Dues</h4>
            <div className="amount">₹{totalDueAmount.toLocaleString()}</div>
            <div className="description">
              Amount pending from {members.filter(m => (Number(m.pending_amount) || 0) > 0).length} members
            </div>
          </div>
          <div className="dues-card">
            <h4>Total Collected</h4>
            <div className="amount">₹{totalCollectedAmount.toLocaleString()}</div>
            <div className="description">
              Successfully collected from {members.filter(m => (Number(m.paid_amount) || 0) > 0).length} members
            </div>
          </div>
          <div className="dues-card">
            <h4>Collection Rate</h4>
            <div className="amount">
              {totalCollectedAmount + totalDueAmount > 0 
                ? Math.round((totalCollectedAmount / (totalCollectedAmount + totalDueAmount)) * 100)
                : 0}%
            </div>
            <div className="description">
              Percentage of dues successfully collected
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button 
            onClick={() => setFilter("all")}
            className={filter === "all" ? "active" : ""}
          >
            All Entries
          </button>
          <button 
            onClick={() => setFilter("income")}
            className={filter === "income" ? "active" : ""}
          >
            Income Only
          </button>
          <button 
            onClick={() => setFilter("expense")}
            className={filter === "expense" ? "active" : ""}
          >
            Expenses Only
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">
          <FaSync style={{ animation: 'spin 1s linear infinite' }} /> Loading...
        </div>
      )}

      {/* Finance Header Actions */}
      <div className="finance-header-actions">
        <h2>Finance Records</h2>
        <button
          onClick={openExportModal}
          className="btn"
          title="Export filtered finances as PDF"
        >
          <FaArrowDown /> Export PDF
        </button>
      </div>

      {/* Table Section */}
      <div className="finance-table-container">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Description</th>
              <th>Source</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, idx) => (
              <tr key={entry.id} className={
                entry.type === 'income' ? 'income-row' : entry.type === 'expense' ? 'expense-row' : ''
              }>
                <td>{formatDate(entry.date)}</td>
                <td className={entry.type === 'income' ? 'income' : 'expense'}>{entry.type}</td>
                <td>₹{Number(entry.amount).toLocaleString()}</td>
                <td>{entry.category}</td>
                <td>{entry.description}</td>
                <td>{entry.payment}</td>
                <td className="created-by-cell">{entry.created_by || <span style={{color:'#aaa'}}>—</span>}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => openEditModal(entry)} className="edit-btn">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteClick(entry.id)} className="delete-btn">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPasskeyModal isOpen={showPasskeyModal} onClose={() => setShowPasskeyModal(false)} onSuccess={handlePasskeySuccess} />

      <Modal
        isOpen={exportModalOpen}
        onRequestClose={closeExportModal}
        contentLabel="Export PDF Filters"
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(44, 44, 84, 0.25)',
            zIndex: 1000,
          },
          content: {
            maxWidth: 420,
            margin: 'auto',
            borderRadius: 16,
            padding: '32px 28px 24px 28px',
            boxShadow: '0 8px 32px rgba(44,44,84,0.18)',
            border: 'none',
            background: '#fff',
            color: '#222',
            fontFamily: 'inherit',
          }
        }}
      >
        <h2>Export PDF Report</h2>
        <div style={{ marginBottom: 12 }}>
          <label>Date Range:</label><br />
          <input type="date" name="from" value={exportFilters.from} onChange={handleExportFilterChange} />
          <span> to </span>
          <input type="date" name="to" value={exportFilters.to} onChange={handleExportFilterChange} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Type:</label><br />
          <select name="type" value={exportFilters.type} onChange={handleExportFilterChange}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div style={{ marginBottom: 12, background: '#f8f9fa', padding: 10, borderRadius: 8 }}>
          <strong>Summary for selected range:</strong><br />
          Total Income: ₹{exportSummary.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br />
          Total Expense: ₹{exportSummary.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br />
          Profit/Loss: <span style={{ color: exportSummary.profitLoss >= 0 ? '#28b295' : '#dc3545' }}>₹{exportSummary.profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <button onClick={handleConfirmExport} style={{ marginRight: 8 }}>Export PDF</button>
        <button onClick={closeExportModal}>Cancel</button>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onRequestClose={closeEditModal}
        contentLabel="Edit Finance Entry"
        ariaHideApp={false}
        style={{
          overlay: { backgroundColor: 'rgba(44,44,84,0.18)', zIndex: 1000 },
          content: {
            maxWidth: 420,
            margin: 'auto',
            borderRadius: 18,
            padding: '0',
            boxShadow: '0 8px 32px rgba(44,44,84,0.18)',
            border: 'none',
            background: '#23272f',
            color: '#E3E3E0',
            fontFamily: 'inherit',
            overflow: 'visible'
          }
        }}
      >
        <div style={{ background: 'rgb(0,128,128)', color: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '18px 28px 10px 28px', fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>Edit Finance Entry</div>
        <div style={{ padding: '24px 28px 24px 28px' }}>
          {editError && <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div>}
          <form onSubmit={handleEditFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label>Date</label>
            <input type="date" name="date" value={toDateInputValue(editForm.date)} onChange={handleEditFormChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <label>Type</label>
            <select name="type" value={editForm.type} onChange={handleEditFormChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
              <option value="">Select</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <label>Amount</label>
            <input type="number" name="amount" value={editForm.amount} onChange={handleEditFormChange} required min="0" step="0.01" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <label>Category</label>
            <input name="category" value={editForm.category} onChange={handleEditFormChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <label>Payment</label>
            <input name="payment" value={editForm.payment} onChange={handleEditFormChange} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <label>Description</label>
            <textarea name="description" value={editForm.description} onChange={handleEditFormChange} rows={3} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }} />
            <label style={{ marginTop: 8 }}>Admin Code <span style={{ color: 'red' }}>*</span></label>
            <input type="password" name="admin_code" value={editAdminCode} onChange={e => setEditAdminCode(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', letterSpacing: 2 }} placeholder="Enter admin code" />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={closeEditModal}>Cancel</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ViewFinance;
