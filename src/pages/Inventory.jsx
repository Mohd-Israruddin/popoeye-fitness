import React, { useState, useEffect } from "react";
import api from '../service/api';
import "./Inventory.css";
import { FaPlus, FaDollarSign, FaStar, FaExclamationTriangle, FaChartLine, FaBoxes, FaDolly } from "react-icons/fa";
import AdminPasskeyModal from '../assets/components/AdminPasskeyModal';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [analytics, setAnalytics] = useState({
        bestSellers: [],
        lowStockItems: [],
        salesStats: { total_sales: 0, total_items_sold: 0, total_profit: 0, avg_profit_per_sale: 0 }
    });
    const [message, setMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useState(5);
    const [operationalCosts, setOperationalCosts] = useState({ costs: [], totalOperationalCost: 0 });
    const [newOperationalCost, setNewOperationalCost] = useState({
        description: "",
        amount: "",
        category: "Operational Cost"
    });
    const [newItem, setNewItem] = useState({
        name: "",
        cost_price: "",
        selling_price: "",
        stock: "",
        category: "",
        dealer_contact: "",
    });
    const [showPasskeyModal, setShowPasskeyModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [showAddCodeModal, setShowAddCodeModal] = useState(false);
    const [pendingAddItem, setPendingAddItem] = useState(null);
    const [showDeleteCodeModal, setShowDeleteCodeModal] = useState(false);
    const [showEditCodeModal, setShowEditCodeModal] = useState(false);
    const [pendingEditForm, setPendingEditForm] = useState(null);
    const [showSettingsThresholdModal, setShowSettingsThresholdModal] = useState(false);
    const [showSettingsCostModal, setShowSettingsCostModal] = useState(false);
    const [pendingThreshold, setPendingThreshold] = useState(null);
    const [pendingOperationalCost, setPendingOperationalCost] = useState(null);

    // Fetch inventory and analytics
    useEffect(() => {
        fetchInventory();
        fetchAnalytics();
        fetchLowStockThreshold();
        fetchOperationalCosts();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get("/inventory");
            setItems(res.data);
        } catch (err) {
            console.error("Failed to fetch inventory:", err);
            setMessage("❌ Error fetching inventory");
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get("/inventory/analytics");
            setAnalytics(res.data);
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        }
    };

    const fetchLowStockThreshold = async () => {
        try {
            const res = await api.get("/settings/low-stock-threshold");
            setLowStockThreshold(res.data.threshold);
        } catch (err) {
            console.error("Failed to fetch low stock threshold:", err);
        }
    };

    const fetchOperationalCosts = async () => {
        try {
            const res = await api.get("/inventory/operational-costs");
            setOperationalCosts(res.data);
        } catch (err) {
            console.error("Failed to fetch operational costs:", err);
        }
    };

    const updateLowStockThreshold = async () => {
        setPendingThreshold(lowStockThreshold);
        setShowSettingsThresholdModal(true);
    };

    const handleThresholdCodeModalSuccess = async ({ code }) => {
        setShowSettingsThresholdModal(false);
        try {
            await api.put("/settings/low-stock-threshold", { threshold: pendingThreshold, created_by: code });
            fetchAnalytics(); // Refresh analytics with new threshold
            setMessage("✅ Low stock threshold updated successfully!");
        } catch (err) {
            console.error("Failed to update threshold:", err);
            setMessage("❌ Error updating threshold");
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const addOperationalCost = async (e) => {
        e.preventDefault();
        setPendingOperationalCost(newOperationalCost);
        setShowSettingsCostModal(true);
    };

    const handleOperationalCostCodeModalSuccess = async ({ code }) => {
        setShowSettingsCostModal(false);
        try {
            await api.post("/inventory/operational-cost", { ...pendingOperationalCost, created_by: code });
            fetchOperationalCosts();
            setNewOperationalCost({ description: "", amount: "", category: "Operational Cost" });
            setMessage("✅ Operational cost logged successfully!");
        } catch (err) {
            console.error("Failed to log operational cost:", err);
            setMessage("❌ Error logging operational cost");
        }
        setTimeout(() => setMessage(""), 3000);
    };

    // Sell item
    const handleSell = async (id) => {
        try {
            const res = await api.post(`/inventory/sell/${id}`, { payment: "Cash" });
            const data = res.data;
            if (data.error) throw new Error(data.message || "Sell failed.");

            // Refresh both inventory and analytics
            fetchInventory();
            fetchAnalytics();
            setMessage(`✅ ${data.message} (Profit: ₹${data.profit})`);
        } catch (error) {
            console.error(error);
            setMessage(`❌ ${error.message}`);
        } finally {
            setTimeout(() => setMessage(""), 3000);
        }
    };

    // Delete
    const handleDeleteClick = (id) => {
        setPendingDeleteId(id);
        setShowDeleteCodeModal(true);
    };
    const handleDeleteCodeModalSuccess = async ({ code }) => {
        setShowDeleteCodeModal(false);
        try {
            await api.post(`/inventory/${pendingDeleteId}/delete`, { username: code, passkey: code });
            fetchInventory();
            setMessage('✅ Item deleted successfully!');
        } catch (err) {
            setMessage('❌ Failed to delete item');
        }
        setPendingDeleteId(null);
        setTimeout(() => setMessage(''), 3000);
    };

    // Edit
    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditForm({ ...item });
    };
    const handleEditSubmit = (e) => {
        e.preventDefault();
        setPendingEditForm({ ...editForm });
        setShowEditCodeModal(true);
    };
    const handleEditCodeModalSuccess = async ({ code }) => {
        setShowEditCodeModal(false);
        try {
            await api.put(`/inventory/edit/${pendingEditForm.id}`, { ...pendingEditForm, username: code, passkey: code });
            fetchInventory();
            setMessage('✏️ Item updated successfully!');
            setEditingItem(null);
        } catch (err) {
            setMessage('❌ Failed to update item');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    // Add item with admin/staff code confirmation
    const handleAddSubmit = (e) => {
        e.preventDefault();
        setPendingAddItem({
            ...newItem,
            id: Date.now(),
            cost_price: +newItem.cost_price,
            selling_price: +newItem.selling_price,
            stock: +newItem.stock,
        });
        setShowAddCodeModal(true);
    };

    const handleAddCodeModalSuccess = async ({ code }) => {
        setShowAddCodeModal(false);
        try {
            await api.post("/inventory/add", { ...pendingAddItem, created_by: code });
            setNewItem({ name: "", cost_price: "", selling_price: "", stock: "", category: "", dealer_contact: "" });
            fetchInventory();
            setMessage("✅ Item added successfully!");
        } catch (err) {
            setMessage("❌ Failed to add item");
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const totalValue = items.reduce((total, item) => total + (item.selling_price * item.stock), 0);
    const lowStockItems = analytics.lowStockItems.length;
    const bestSeller = analytics.bestSellers.length > 0 ? analytics.bestSellers[0].product_name : 'N/A';

    return (
        <div className="inventory-page">
            {/* Hero Section */}
            <div className="inventory-hero-section">
                <div className="inventory-hero-content">
                    <div className="inventory-header-left">
                        <h1>Store Inventory</h1>
                        <p>Manage your gym's retail products, track sales, monitor stock levels, and analyze profitability.</p>
                    </div>
                    <div className="inventory-action-buttons">
                        <button 
                            className="inventory-btn inventory-btn-secondary" 
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            ⚙️ Settings
                        </button>
                        <button className="inventory-btn inventory-btn-primary" onClick={() => setShowAddModal(true)}>
                            <FaPlus /> Add New Item
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`inventory-message-banner ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {/* Statistics Cards */}
            <div className="inventory-stats-grid">
                <div className="inventory-stat-card total-value">
                    <div className="inventory-stat-icon"><FaDollarSign /></div>
                    <div className="inventory-stat-content">
                        <h3>₹{totalValue.toLocaleString()}</h3>
                        <p>Total Inventory Value</p>
                    </div>
                </div>
                <div className="inventory-stat-card best-seller">
                    <div className="inventory-stat-icon"><FaStar /></div>
                    <div className="inventory-stat-content">
                        <h3>{bestSeller}</h3>
                        <p>Best Seller</p>
                    </div>
                </div>
                <div className="inventory-stat-card low-stock">
                    <div className="inventory-stat-icon"><FaExclamationTriangle /></div>
                    <div className="inventory-stat-content">
                        <h3>{lowStockItems}</h3>
                        <p>Items Low on Stock</p>
                    </div>
                </div>
                <div className="inventory-stat-card profit">
                    <div className="inventory-stat-icon"><FaChartLine /></div>
                    <div className="inventory-stat-content">
                        <h3>₹{(analytics.salesStats.total_profit || 0).toLocaleString()}</h3>
                        <p>Total Profit</p>
                    </div>
                </div>
                <div className="inventory-stat-card sales">
                    <div className="inventory-stat-icon"><FaBoxes /></div>
                    <div className="inventory-stat-content">
                        <h3>{analytics.salesStats.total_sales || 0}</h3>
                        <p>Total Sales</p>
                    </div>
                </div>
                <div className="inventory-stat-card operational-cost">
                    <div className="inventory-stat-icon"><FaDolly /></div>
                    <div className="inventory-stat-content">
                        <h3>₹{(operationalCosts.totalOperationalCost || 0).toLocaleString()}</h3>
                        <p>Operational Costs</p>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Section */}
            {analytics.lowStockItems.length > 0 && (
                <div className="inventory-low-stock-alert">
                    <h3 className="inventory-alert-title">
                        <FaExclamationTriangle /> Low Stock Alert
                    </h3>
                    <div className="inventory-alert-grid">
                        {analytics.lowStockItems.map((item, index) => (
                            <div key={index} className="inventory-alert-card">
                                <div className="inventory-alert-name">{item.name}</div>
                                <div className="inventory-alert-stock">
                                    Stock: {item.stock} pieces
                                </div>
                                {item.dealer_contact && (
                                    <div className="inventory-alert-contact">
                                        Contact: {item.dealer_contact}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Settings Section */}
            {showSettings && (
                <div className="inventory-settings-section">
                    <h3 className="inventory-settings-title">⚙️ Inventory Settings</h3>
                    
                    {/* Low Stock Threshold */}
                    <div className="inventory-settings-group">
                        <h4>Stock Management</h4>
                        <div className="inventory-form-row">
                            <div className="inventory-form-group">
                                <label>Low Stock Alert Threshold</label>
                                <input
                                    type="number"
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 1)}
                                    min="1"
                                    className="inventory-form-input"
                                />
                                <small>You'll get alerts when items fall below this stock level</small>
                            </div>
                            <button
                                onClick={updateLowStockThreshold}
                                className="inventory-btn inventory-btn-primary"
                            >
                                Update Threshold
                            </button>
                        </div>
                    </div>

                    {/* Operational Costs */}
                    <div className="inventory-settings-group">
                        <h4>Operational Costs</h4>
                        
                        {/* Add New Operational Cost */}
                        <form onSubmit={addOperationalCost} className="inventory-form-grid">
                            <div className="inventory-form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={newOperationalCost.description}
                                    onChange={(e) => setNewOperationalCost({...newOperationalCost, description: e.target.value})}
                                    placeholder="e.g., Transport cost"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Amount (₹)</label>
                                <input
                                    type="number"
                                    value={newOperationalCost.amount}
                                    onChange={(e) => setNewOperationalCost({...newOperationalCost, amount: e.target.value})}
                                    placeholder="0"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inventory-btn inventory-btn-secondary"
                            >
                                Add Cost
                            </button>
                        </form>

                        {/* Operational Costs Summary */}
                        {operationalCosts.costs.length > 0 && (
                            <div className="inventory-cost-summary">
                                <h5>Cost Summary</h5>
                                <div className="inventory-cost-cards">
                                    {operationalCosts.costs.map((cost, index) => (
                                        <div key={index} className="inventory-cost-card">
                                            <div className="inventory-cost-category">
                                                {cost.category}
                                            </div>
                                            <div className="inventory-cost-amount">
                                                ₹{(cost.total_amount || 0).toLocaleString()}
                                            </div>
                                            <div className="inventory-cost-count">
                                                {cost.transaction_count || 0} transactions
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="inventory-total-cost">
                                    <strong>
                                        Total Operational Costs: ₹{(operationalCosts.totalOperationalCost || 0).toLocaleString()}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            <div className="inventory-table-section">
                <div className="inventory-table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Cost Price</th>
                                <th>Selling Price</th>
                                <th>Stock</th>
                                <th>Dealer Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td>₹{item.cost_price}</td>
                                    <td>₹{item.selling_price}</td>
                                    <td>{item.stock}</td>
                                    <td>{item.dealer_contact}</td>
                                    <td className="inventory-table-actions">
                                        <button 
                                            className="inventory-action-btn inventory-action-btn-sell" 
                                            disabled={item.stock === 0}
                                            onClick={() => handleSell(item.id)}
                                        >
                                            {item.stock === 0 ? 'Out of Stock' : 'Sell'}
                                        </button>
                                        <button className="inventory-action-btn inventory-action-btn-edit" onClick={() => handleEditClick(item)}>Edit</button>
                                        <button className="inventory-action-btn inventory-action-btn-delete" onClick={() => handleDeleteClick(item.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="inventory-modal-overlay">
                    <form onSubmit={handleEditSubmit} className="inventory-modal-form">
                        <h3 className="inventory-modal-title">Edit Inventory Item</h3>
                        <div className="inventory-form-grid">
                            <div className="inventory-form-group inventory-form-span-2">
                                <label>Product Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Cost Price (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.cost_price}
                                    onChange={(e) => setEditForm({ ...editForm, cost_price: +e.target.value })}
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Selling Price (₹)</label>
                                <input
                                    type="number"
                                    value={editForm.selling_price}
                                    onChange={(e) => setEditForm({ ...editForm, selling_price: +e.target.value })}
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Stock Quantity</label>
                                <input
                                    type="number"
                                    value={editForm.stock}
                                    onChange={(e) => setEditForm({ ...editForm, stock: +e.target.value })}
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Category</label>
                                <input
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group inventory-form-span-2">
                                <label>Dealer Contact (Optional)</label>
                                <input
                                    value={editForm.dealer_contact}
                                    onChange={(e) => setEditForm({ ...editForm, dealer_contact: e.target.value })}
                                    className="inventory-form-input"
                                />
                            </div>
                        </div>
                        <div className="inventory-modal-buttons">
                            <button type="button" className="inventory-btn inventory-btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                            <button type="submit" className="inventory-btn inventory-btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="inventory-modal-overlay">
                    <form onSubmit={handleAddSubmit} className="inventory-modal-form">
                        <h3 className="inventory-modal-title">Add New Inventory Item</h3>
                        <div className="inventory-form-grid">
                            <div className="inventory-form-group inventory-form-span-2">
                                <label>Product Name</label>
                                <input
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g., Protein Powder"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Cost Price (₹)</label>
                                <input
                                    type="number"
                                    value={newItem.cost_price}
                                    onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                                    placeholder="e.g., 1500"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Selling Price (₹)</label>
                                <input
                                    type="number"
                                    value={newItem.selling_price}
                                    onChange={(e) => setNewItem({ ...newItem, selling_price: e.target.value })}
                                    placeholder="e.g., 2000"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Stock Quantity</label>
                                <input
                                    type="number"
                                    value={newItem.stock}
                                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                                    placeholder="e.g., 50"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group">
                                <label>Category</label>
                                <input
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    placeholder="e.g., Supplements"
                                    required
                                    className="inventory-form-input"
                                />
                            </div>
                            <div className="inventory-form-group inventory-form-span-2">
                                <label>Dealer Contact (Optional)</label>
                                <input
                                    value={newItem.dealer_contact}
                                    onChange={(e) => setNewItem({ ...newItem, dealer_contact: e.target.value })}
                                    placeholder="e.g., 9876543210"
                                    className="inventory-form-input"
                                />
                            </div>
                        </div>
                        <div className="inventory-modal-buttons">
                            <button type="button" className="inventory-btn inventory-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button type="submit" className="inventory-btn inventory-btn-primary">Add Item</button>
                        </div>
                    </form>
                </div>
            )}

            <AdminPasskeyModal
                show={showAddCodeModal}
                onClose={() => setShowAddCodeModal(false)}
                onSuccess={handleAddCodeModalSuccess}
                label="Enter your Admin/Staff ID to confirm adding item:"
            />
            <AdminPasskeyModal
                show={showDeleteCodeModal}
                onClose={() => setShowDeleteCodeModal(false)}
                onSuccess={handleDeleteCodeModalSuccess}
                label="Enter your Admin/Staff ID to confirm deleting item:"
            />
            <AdminPasskeyModal
                show={showEditCodeModal}
                onClose={() => setShowEditCodeModal(false)}
                onSuccess={handleEditCodeModalSuccess}
                label="Enter your Admin/Staff ID to confirm editing item:"
            />
            <AdminPasskeyModal
                show={showSettingsThresholdModal}
                onClose={() => setShowSettingsThresholdModal(false)}
                onSuccess={handleThresholdCodeModalSuccess}
                label="Enter your Admin/Staff ID to confirm updating threshold:"
            />
            <AdminPasskeyModal
                show={showSettingsCostModal}
                onClose={() => setShowSettingsCostModal(false)}
                onSuccess={handleOperationalCostCodeModalSuccess}
                label="Enter your Admin/Staff ID to confirm adding operational cost:"
            />
        </div>
    );
};

export default Inventory;
