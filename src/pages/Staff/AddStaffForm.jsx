import React, { useState } from "react";
import "./Staff.css";

const AddStaffForm = ({ onAdd, onCancel }) => {
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    phone: "",
    photo: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  const staffToAdd = {
    ...newStaff,
    photo: newStaff.photo.trim() || "https://via.placeholder.com/150?text=No+Photo",
  };

  onAdd(staffToAdd);

  setNewStaff({
    name: "",
    role: "",
    phone: "",
    photo: "",
    email: "",
    address: "",
  });
};

  return (
    <form className="staff-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={newStaff.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="role"
        placeholder="Role"
        value={newStaff.role}
        onChange={handleChange}
        required
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone"
        value={newStaff.phone}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={newStaff.email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={newStaff.address}
        onChange={handleChange}
      />
      <input
        type="text"
        name="photo"
        placeholder="Photo URL"
        value={newStaff.photo}
        onChange={handleChange}
      />
      <div className="form-buttons">
        <button type="submit">Add</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddStaffForm;

