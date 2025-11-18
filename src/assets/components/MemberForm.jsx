import React, { useState, useEffect } from "react";
import "./MemberForm.css";

const generateMemberId = () => `M${Date.now()}`;

const initialData = {
  member_id: "",
  name: "",
  email: "",
  phone: "",
  package: "",
  join_date: "",
  expiry_date: "",
  address: "",
  health_issues: "",
  blood_group: "",
  total_amount: 0,
  paid_amount: 0,
  extra_details: "",
};

const MemberForm = ({ member, onSave, onClose }) => {
  const [data, setData] = useState(member || initialData);

  // Set initial data: existing member or new member with generated ID
  useEffect(() => {
    if (member) {
      setData({
        ...member,
        join_date: member.join_date ? new Date(member.join_date).toISOString().split("T")[0] : "",
        expiry_date: member.expiry_date ? new Date(member.expiry_date).toISOString().split("T")[0] : "",
      });
    } else {
      setData({ ...initialData, member_id: generateMemberId() });
    }
  }, [member]);

  // Auto-calculate expiry_date when package and join_date are set
  useEffect(() => {
    if (data.package && data.join_date && data.package !== "custom") {
      const joinDate = new Date(data.join_date);
      let expiry = new Date(joinDate);
      if (data.package === "1 month") {
        expiry.setMonth(joinDate.getMonth() + 1);
      } else if (data.package === "3 month") {
        expiry.setMonth(joinDate.getMonth() + 3);
      } else if (data.package === "6 month") {
        expiry.setMonth(joinDate.getMonth() + 6);
      } else if (data.package === "12 month") {
        expiry.setFullYear(joinDate.getFullYear() + 1);
      }
      setData((prev) => ({ ...prev, expiry_date: expiry.toISOString().split("T")[0] }));
    }
  }, [data.package, data.join_date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'total_amount' || name === 'paid_amount') {
      val = value === '' ? '' : Number(value);
    }
    setData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
    onClose();
  };

  return (
    <div className="members-form-overlay">
      <form className="members-form-modal" onSubmit={handleSubmit}>
        <h3 className="members-form-title">{member ? "Edit Member" : "Add Member"}</h3>

        <div className="members-form-grid">
          <div className="members-form-group members-form-span-2">
            <label htmlFor="member_id">Member ID</label>
            <input
              id="member_id"
              name="member_id"
              value={data.member_id}
              onChange={handleChange}
              placeholder="Auto-generated ID"
              type="text"
              readOnly
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              value={data.name}
              onChange={handleChange}
              placeholder="Full name of the member"
              type="text"
              required
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="member@example.com"
              type="email"
              required
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              value={data.phone}
              onChange={handleChange}
              placeholder="10-digit phone number"
              pattern="^\d{10}$"
              title="Enter a valid 10-digit number"
              type="text"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="package">Membership Package</label>
            <select
              id="package"
              name="package"
              value={data.package}
              onChange={handleChange}
              required
              className="members-form-select"
            >
              <option value="">Select package duration</option>
              <option value="1 month">1 Month</option>
              <option value="3 month">3 Months</option>
              <option value="6 month">6 Months</option>
              <option value="12 month">12 Months</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="members-form-group">
            <label htmlFor="join_date">Join Date</label>
            <input
              id="join_date"
              name="join_date"
              value={data.join_date}
              onChange={handleChange}
              type="date"
              required
              className="members-form-input"
            />
          </div>

          <div className="members-form-group">
            <label htmlFor="expiry_date">Expiry Date</label>
            <input
              id="expiry_date"
              name="expiry_date"
              value={data.expiry_date}
              onChange={handleChange}
              type="date"
              required
              readOnly={data.package !== 'custom' && data.package !== ''}
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              value={data.address || ''}
              onChange={handleChange}
              placeholder="Address"
              type="text"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="health_issues">Health Issues</label>
            <input
              id="health_issues"
              name="health_issues"
              value={data.health_issues || ''}
              onChange={handleChange}
              placeholder="Health issues (if any)"
              type="text"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="blood_group">Blood Group</label>
            <input
              id="blood_group"
              name="blood_group"
              value={data.blood_group || ''}
              onChange={handleChange}
              placeholder="e.g., A+, O-"
              type="text"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group members-form-span-2">
            <label htmlFor="extra_details">Extra Details</label>
            <input
              id="extra_details"
              name="extra_details"
              value={data.extra_details || ''}
              onChange={handleChange}
              placeholder="Any additional details"
              type="text"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group">
            <label htmlFor="total_amount">Total Amount</label>
            <input
              id="total_amount"
              name="total_amount"
              value={data.total_amount}
              onChange={handleChange}
              placeholder="Total package amount"
              type="number"
              min="0"
              step="0.01"
              className="members-form-input"
            />
          </div>

          <div className="members-form-group">
            <label htmlFor="paid_amount">Paid Amount</label>
            <input
              id="paid_amount"
              name="paid_amount"
              value={data.paid_amount}
              onChange={handleChange}
              placeholder="Amount already paid"
              type="number"
              min="0"
              step="0.01"
              className="members-form-input"
            />
          </div>
        </div>

        <div className="members-form-buttons">
          <button type="submit" className="members-form-btn members-form-btn-primary">
            {member ? "Update Member" : "Add Member"}
          </button>
          <button type="button" onClick={onClose} className="members-form-btn members-form-btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
