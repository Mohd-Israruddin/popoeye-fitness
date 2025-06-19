import React, { useState } from "react";
import axios from "axios";
import "./MemberTable.css";

const MemberTable = ({ members, onEdit, onDelete, onBulkEdit }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState([]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === members.length) {
      setSelected([]);
    } else {
      setSelected(members.map((m) => m.id));
    }
  };

  const handleSendSMS = async (member) => {
    if (!member.whatsapp) {
      alert(`⚠️ ${member.name} has no WhatsApp number.`);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/sms/send", {
        name: member.name,
        number: member.whatsapp,
        message: `Hi ${member.name}, your membership expires on ${member.expiry_date}. Please renew soon.`,
      });
      alert(`✅ SMS sent to ${member.name}`);
    } catch (error) {
      console.error("SMS Error:", error);
      alert(`❌ Failed to send SMS to ${member.name}`);
    }
  };

  const handleSendBulkSMS = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/members/send-remainder/${member.id}`);
    alert(res.data.message || "✅ Expiry reminders sent.");
  } catch (error) {
    console.error("Bulk SMS error:", error);
    alert("❌ Failed to send bulk SMS.");
  }
};


  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    const confirm = window.confirm(`Are you sure you want to delete ${selected.length} member(s)?`);
    if (!confirm) return;

    try {
      await axios.post("http://localhost:5000/api/members/delete-multiple", {
        ids: selected,
      });
      alert("🗑️ Selected members deleted.");
      onDelete(selected);
      setSelected([]);
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Failed to delete selected members.");
    }
  };

  const handleSingleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this member?");
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:5000/api/members/${id}`);
      alert("🗑️ Member deleted.");
      onDelete([id]);
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Failed to delete member.");
    }
  };

  return (
    <div>
      {/* 🔧 Bulk Action Toolbar */}
      <div className="bulk-actions">
        <button onClick={handleSendBulkSMS}>📩 Expiry SMS</button>
        <button onClick={() => onBulkEdit(selected)} disabled={selected.length === 0}>✏️ Edit Selected</button>
        <button onClick={handleBulkDelete} disabled={selected.length === 0}>🗑️ Delete Selected</button>
        <span>{selected.length} selected</span>
      </div>

      <table className="member-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selected.length === members.length}
              />
            </th>
            <th>Member ID</th>
            <th>Name</th>
            <th>WhatsApp</th>
            <th>Join Date</th>
            <th>Expire Date</th>
            <th>Package</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Pending</th>
            <th>SMS</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <React.Fragment key={m.id}>
              <tr onClick={() => toggleExpand(m.id)}>
                <td>
                  <input
                    type="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleSelect(m.id)}
                    checked={selected.includes(m.id)}
                  />
                </td>
                <td>{m.member_id}</td>
                <td>{m.name}</td>
                <td>{m.whatsapp || "N/A"}</td>
                <td>{m.join_date}</td>
                <td>{m.expiry_date}</td>
                <td>{m.package}</td>
                <td>₹{m.total_amount}</td>
                <td>₹{m.paid_amount}</td>
                <td>₹{m.total_amount - m.paid_amount}</td>
                <td>
                  <button
                    className="sms-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendSMS(m);
                    }}
                  >
                    📩
                  </button>
                </td>
                <td>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(m); }}>✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); handleSingleDelete(m.id); }}>🗑️</button>
                </td>
              </tr>
              {expandedId === m.id && (
                <tr className="expanded-row">
                  <td colSpan="12">
                    <div className="member-details">
                      <strong>Details:</strong><br />
                      Address: {m.address || "N/A"}<br />
                      Email: {m.email || "N/A"}<br />
                      Notes: {m.notes || "No additional notes."}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberTable;
