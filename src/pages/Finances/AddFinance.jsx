import React, { useState } from "react";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaPen,
  FaRupeeSign,
  FaCreditCard,
  FaTimes,
  FaWifi,
  FaMobileAlt,
} from "react-icons/fa";
import "./AddFinance.css";

const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  d.setMinutes(d.getMinutes() - offset);
  return d.toISOString().split("T")[0];
};

const today = getLocalDate();


const defaultCategories = [
  "Membership",
  "Maintenance",
  "Equipment",
  "Salaries",
  "Utilities",
];

const AddFinance = () => {
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("Membership");
  const [categories, setCategories] = useState(defaultCategories);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [description, setDescription] = useState("");
  const [latestTransaction, setLatestTransaction] = useState(null);
  const [message, setMessage] = useState("");

  const getQuickDate = (daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const offset = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() - offset);
    return d.toISOString().split("T")[0];
  };

  const quickDates = {
    Today: getQuickDate(0),
    Yesterday: getQuickDate(1),
    "Day Before": getQuickDate(2),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      type,
      amount: parseFloat(amount),
      date,
      category,
      payment,
      description,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/finances", data);
      const newEntry = response.data;

      setLatestTransaction(newEntry);
      setAmount("");
      setDescription("");
      setDate(today);
      setMessage("Finance entry added successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error adding finance entry:", error);
      setMessage("Failed to save entry.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setCategory(trimmed);
      setCustomCategoryInput("");
    }
  };

  const handleRemoveCategory = (cat) => {
    const newCategories = categories.filter((c) => c !== cat);
    setCategories(newCategories);
    if (category === cat && newCategories.length > 0) {
      setCategory(newCategories[0]);
    }
  };

  return (
    <>
      <div className="form-container">
        <form className="finance-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Add Finance Entry</h2>

          <div className="type-selector">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`type-button ${type === "income" ? "active-income" : ""}`}
            >
              <FaMoneyBillWave /> Income
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`type-button ${type === "expense" ? "active-expense" : ""}`}
            >
              <FaMoneyCheckAlt /> Expense
            </button>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Amount</label>
              <div className="input-with-icon">
                <FaRupeeSign className="icon" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Date</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="icon" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="quick-dates">
            {Object.entries(quickDates).map(([label, value]) => (
              <button
                key={label}
                type="button"
                className="quick-date-button"
                onClick={() => setDate(value)}
              >
                <FaCalendarAlt style={{ marginRight: "6px" }} /> {label}
              </button>
            ))}
          </div>

          <div className="input-group">
            <label>Category</label>
            <div className="category-selector">
              {categories.map((cat) => (
                <div key={cat} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`category-button ${category === cat ? "active" : ""}`}
                  >
                    {cat}
                  </button>
                  {!defaultCategories.includes(cat) && (
                    <FaTimes
                      className="icon"
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "white",
                        borderRadius: "50%",
                        fontSize: "12px",
                        color: "#c0392b",
                        cursor: "pointer",
                      }}
                      onClick={() => handleRemoveCategory(cat)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="custom-category-input"
                placeholder="Add custom category"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomCategory()}
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="quick-date-button"
                style={{ backgroundColor: "#2980b9", color: "white" }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Payment Method</label>
            <div className="payment-methods">
              {[
                { name: "Cash", icon: <FaMoneyBillWave className="icon" /> },
                { name: "Card", icon: <FaCreditCard className="icon" /> },
                { name: "Bank Transfer", icon: <FaWifi className="icon" /> },
                { name: "UPI", icon: <FaMobileAlt className="icon" /> },
              ].map(({ name, icon }) => (
                <button
                  key={name}
                  type="button"
                  className={`payment-button ${payment === name ? "active" : ""}`}
                  onClick={() => setPayment(name)}
                >
                  {icon} {name}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Description</label>
            <div className="input-with-icon">
              <FaPen className="icon" />
              <textarea
                rows="2"
                placeholder="e.g., Bought resistance bands for gym use"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="action-buttons">
            <button type="button" className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Entry
            </button>
          </div>

          {message && (
            <div className="message-box">{message}</div>
          )}
        </form>
      </div>

      {latestTransaction && (
        <div className="recent-transaction">
          <h3>Recently Added Transaction</h3>
          <p><strong>Type:</strong> {latestTransaction.type}</p>
          <p><strong>Amount:</strong> ₹{latestTransaction.amount}</p>
          <p><strong>Date:</strong> {latestTransaction.date?.slice(0, 10)}</p>
          <p><strong>Category:</strong> {latestTransaction.category}</p>
          <p><strong>Payment:</strong> {latestTransaction.payment}</p>
          {latestTransaction.description && (
            <p><strong>Description:</strong> {latestTransaction.description}</p>
          )}
        </div>
      )}

      <style>{`
        .recent-transaction {
          margin: 20px auto;
          max-width: 400px;
          background: #e9f5f9;
          border-left: 6px solid #1976d2;
          padding: 15px 20px;
          border-radius: 8px;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
        }
        .recent-transaction h3 {
          margin-bottom: 12px;
          color: #1976d2;
        }
        .recent-transaction p {
          margin: 4px 0;
          font-size: 15px;
          color: #333;
        }
        .message-box {
          margin-top: 12px;
          padding: 10px;
          background: #dff0d8;
          color: #3c763d;
          border: 1px solid #d6e9c6;
          border-radius: 4px;
          font-size: 14px;
        }
      `}</style>
    </>
  );
};

export default AddFinance;
