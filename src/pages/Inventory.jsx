import React, { useState, useEffect } from "react";
import "./Inventory.css";

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("");
    const [message, setMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "", price: "", stock: "", category: "", payment: "Cash", logAsExpense: false
    });

    // Fetch inventory
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/inventory");
                const data = await res.json();
                setItems(data);
            } catch (err) {
                console.error("Failed to fetch inventory:", err);
                setMessage("❌ Error fetching inventory");
            }
        };
        fetchInventory();
    }, []);

    // Sell item
    const handleSell = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/inventory/sell/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment: "Cash" }) // For now hardcoded, later can be dropdown
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Sell failed.");

            const updatedItems = items.map(item =>
                item.id === id && item.stock > 0
                    ? { ...item, stock: item.stock - 1 }
                    : item
            );
            setItems(updatedItems);
            setMessage(`✅ ${data.message}`);
        } catch (error) {
            console.error(error);
            setMessage(`❌ ${error.message}`);
        } finally {
            setTimeout(() => setMessage(""), 2500);
        }
    };

    // Delete locally (not connected to backend)
    const handleDelete = (id) => {
        setItems(items.filter(item => item.id !== id));
        setMessage("❌ Item deleted.");
        setTimeout(() => setMessage(""), 2000);
    };

    // Edit modal handlers
    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditForm({ ...item });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setItems(items.map(item => item.id === editForm.id ? editForm : item));
        setMessage(`✏️ Updated "${editForm.name}"`);
        setEditingItem(null);
        setTimeout(() => setMessage(""), 2000);
    };

    // Add item
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const id = Date.now();
        const itemToAdd = {
            ...newItem,
            id,
            price: +newItem.price,
            stock: +newItem.stock,
        };

        try {
            const res = await fetch("http://localhost:5000/api/inventory/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: itemToAdd.name,
                    price: itemToAdd.price,
                    stock: itemToAdd.stock,
                    category: itemToAdd.category,
                    logAsExpense: itemToAdd.logAsExpense,
                    payment: itemToAdd.payment
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Add failed");

            setItems([...items, itemToAdd]);
            setMessage(`🆕 ${data.message || `Added "${itemToAdd.name}"`}`);
        } catch (error) {
            console.error(error);
            setMessage(`❌ ${error.message}`);
        } finally {
            setShowAddModal(false);
            setNewItem({ name: "", price: "", stock: "", category: "", payment: "Cash", logAsExpense: false });
            setTimeout(() => setMessage(""), 2000);
        }
    };

    const totalValue = items.reduce((total, item) => total + item.price * item.stock, 0);
    const filteredItems = filter ? items.filter(i => i.category === filter) : items;
    const categories = [...new Set(items.map(item => item.category))];

    return (
        <div className="inventory-wrapper">
            <h2 className="inventory-title">Inventory / Store</h2>

            {message && <p className="sell-message">{message}</p>}

            <div className="top-controls">
                <div className="filter-dropdown">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <button className="add-item-btn" onClick={() => setShowAddModal(true)}>➕ Add Item</button>
            </div>

            <div className="inventory-grid">
                {filteredItems.map(item => (
                    <div key={item.id} className="inventory-card">
                        <h4>{item.name}</h4>
                        <p>Category: {item.category}</p>
                        <p>Price: ₹{item.price}</p>
                        <p>Stock: {item.stock}</p>
                        <div className="inventory-actions">
                            <button onClick={() => handleSell(item.id)} disabled={item.stock === 0}>
                                {item.stock > 0 ? "Sell" : "Out of Stock"}
                            </button>
                            <button className="edit-btn" onClick={() => handleEditClick(item)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="inventory-total">
                Total Inventory Value: <span>₹{totalValue.toLocaleString()}</span>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="modal-overlay">
                    <form onSubmit={handleEditSubmit} className="modal-form">
                        <h3>Edit Item</h3>
                        <label>Name:</label>
                        <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            required
                        />
                        <label>Price (₹):</label>
                        <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: +e.target.value })}
                            required
                        />
                        <label>Stock:</label>
                        <input
                            type="number"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: +e.target.value })}
                            required
                        />
                        <label>Category:</label>
                        <input
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            required
                        />
                        <div className="modal-buttons">
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setEditingItem(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <form onSubmit={handleAddSubmit} className="modal-form">
                        <h3>Add New Item</h3>
                        <label>Name:</label>
                        <input
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />
                        <label>Price (₹):</label>
                        <input
                            type="number"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            required
                        />
                        <label>Stock:</label>
                        <input
                            type="number"
                            value={newItem.stock}
                            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                            required
                        />
                        <label>Category:</label>
                        <input
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            required
                        />
                        <label>Payment Method:</label>
                        <select
                            value={newItem.payment}
                            onChange={(e) => setNewItem({ ...newItem, payment: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                        <label>
                            <input
                                type="checkbox"
                                checked={newItem.logAsExpense}
                                onChange={(e) => setNewItem({ ...newItem, logAsExpense: e.target.checked })}
                            />{" "}
                            Log as expense in finances
                        </label>
                        <div className="modal-buttons">
                            <button type="submit">Add</button>
                            <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Inventory;
