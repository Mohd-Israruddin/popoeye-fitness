import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ViewFinance.css";

const ViewFinance = () => {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editIndex, setEditIndex] = useState(null);
  const [editedEntry, setEditedEntry] = useState({});

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finances");
      setEntries(res.data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    }
  };

  const deleteEntry = async (index) => {
    const id = entries[index].id;
    try {
      await axios.delete(`http://localhost:5000/api/finances/${id}`);
      fetchEntries();
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const updateEntry = async () => {
    try {
      const id = editedEntry.id;
      await axios.put(`http://localhost:5000/api/finances/${id}`, editedEntry);
      fetchEntries();
      setEditIndex(null);
    } catch (err) {
      console.error("Failed to update entry:", err);
    }
  };

  const totalIncome = entries
    .filter((e) => e.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = entries
    .filter((e) => e.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const due = totalIncome - totalExpense;

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedEntry({ ...entries[index] });
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditedEntry({});
  };

  return (
    <div className="view-finance-container">
      <h2>Finance Entries</h2>

      <div className="summary-container">
        <div className="summary-card income">
          <h4>Total Income</h4>
          <p>₹{totalIncome}</p>
        </div>
        <div className="summary-card expense">
          <h4>Total Expense</h4>
          <p>₹{totalExpense}</p>
        </div>
        <div className="summary-card balance">
          <h4>Balance</h4>
          <p>₹{due}</p>
        </div>
      </div>

      <div className="filter-buttons">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("income")}>Income</button>
        <button onClick={() => setFilter("expense")}>Expense</button>
      </div>

      <table className="finance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Payment</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map((entry, index) => (
            <tr
              key={entry.id}
              className={entry.type === "income" ? "income-row" : "expense-row"}
            >
              {editIndex === index ? (
                <>
                  <td>
                    <input
                      type="date"
                      value={editedEntry.date}
                      onChange={(e) =>
                        setEditedEntry({ ...editedEntry, date: e.target.value })
                      }
                    />
                  </td>
                  <td>{editedEntry.type}</td>
                  <td>
                    <input
                      type="number"
                      value={editedEntry.amount}
                      onChange={(e) =>
                        setEditedEntry({
                          ...editedEntry,
                          amount: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editedEntry.category}
                      onChange={(e) =>
                        setEditedEntry({
                          ...editedEntry,
                          category: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editedEntry.payment}
                      onChange={(e) =>
                        setEditedEntry({
                          ...editedEntry,
                          payment: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editedEntry.description}
                      onChange={(e) =>
                        setEditedEntry({
                          ...editedEntry,
                          description: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <button onClick={updateEntry}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{entry.date?.slice(0, 10)}</td>
                  <td>{entry.type}</td>
                  <td>₹{entry.amount}</td>
                  <td>{entry.category}</td>
                  <td>{entry.payment}</td>
                  <td>{entry.description}</td>
                  <td>
                    <button onClick={() => handleEdit(index)}>Edit</button>
                    <button onClick={() => deleteEntry(index)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewFinance;
