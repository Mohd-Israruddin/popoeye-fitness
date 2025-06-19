import React, { useState } from "react";
import "./Staff.css";

const StaffModal = ({ staff, onClose, onUpdate, onDelete }) => {
  const [editedStaff, setEditedStaff] = useState({ ...staff });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(editedStaff);
    onClose();
  };

  return (
    <div className="staff-modal-backdrop" onClick={onClose}>
      <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
        <img
          className="staff-photo large"
          src={editedStaff.photo || "https://via.placeholder.com/150"}
          alt={editedStaff.name}
        />
        <input
          name="name"
          value={editedStaff.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          name="role"
          value={editedStaff.role}
          onChange={handleChange}
          placeholder="Role"
          required
        />
        <input
          name="phone"
          value={editedStaff.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
        />
        <input
          name="email"
          value={editedStaff.email || ""}
          onChange={handleChange}
          placeholder="Email"
          type="email"
        />
        <input
          name="address"
          value={editedStaff.address || ""}
          onChange={handleChange}
          placeholder="Address"
        />
        <input
          name="photo"
          value={editedStaff.photo || ""}
          onChange={handleChange}
          placeholder="Photo URL"
        />
        <div className="card-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={() => onDelete(staff.id)}>Delete</button>
          <button className="cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffModal;

