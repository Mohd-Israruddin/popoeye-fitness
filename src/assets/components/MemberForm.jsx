import React, { useState, useEffect } from "react";

const initialData = {
  member_id: "",
  name: "",
  whatsapp: "",
  join_date: "",
  expiry_date: "",
  package: "",
  total_amount: 0,
  paid_amount: 0,
};

const MemberForm = ({ member, onSave, onClose }) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (member) {
      setData(member);
    } else {
      setData(initialData);
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val =
      name === "total_amount" || name === "paid_amount"
        ? parseFloat(value) || 0
        : value;
    setData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>{member ? "Edit" : "Add"} Member</h3>

        <input
          name="member_id"
          value={data.member_id}
          onChange={handleChange}
          placeholder="Member ID"
          required
        />

        <input
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />

        <input
          name="whatsapp"
          value={data.whatsapp}
          onChange={handleChange}
          placeholder="+91XXXXXXXXXX"
          pattern="^\d{10}$"
          title="Enter a valid 10-digit number "
          required
        />

        <input
          name="join_date"
          value={data.join_date}
          onChange={handleChange}
          type="date"
          required
        />

        <input
          name="expiry_date"
          value={data.expiry_date}
          onChange={handleChange}
          type="date"
          required
        />

        <select
          name="package"
          value={data.package}
          onChange={handleChange}
          required
        >
          <option value="">Select Package</option>
          <option value="1 month">1 Month</option>
          <option value="3 month">3 Months</option>
          <option value="6 month">6 Months</option>
          <option value="1 year">1 Year</option>
          <option value="custom">Custom</option>
        </select>

        <input
          name="total_amount"
          value={data.total_amount}
          onChange={handleChange}
          placeholder="Total Amount"
          type="number"
          min="0"
        />

        <input
          name="paid_amount"
          value={data.paid_amount}
          onChange={handleChange}
          placeholder="Paid Amount"
          type="number"
          min="0"
        />

        <div className="modal-buttons">
          <button type="submit">💾 Save</button>
          <button type="button" onClick={onClose}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
