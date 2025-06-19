import React, { useState } from "react";
import "./Staff.css";

const StaffCard = ({ staff, onDelete, onUpdate, onClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedStaff, setEditedStaff] = useState({ ...staff });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(editedStaff);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="staff-card" onClick={() => !isModalOpen && onClick()}>
        <img
          src={staff.photo || "https://via.placeholder.com/100"}
          alt={staff.name}
          className="staff-photo"
        />
        <h4>{staff.name}</h4>
        <p>
          <strong>Role:</strong> {staff.role}
        </p>
        <p>
          <strong>Phone:</strong> {staff.phone}
        </p>
        <div className="card-buttons">
          <button
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(staff.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-modal-title">Edit Staff</h3>
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
            />
            <input
              name="address"
              value={editedStaff.address || ""}
              onChange={handleChange}
              placeholder="Address"
            />
            <input
              name="photo"
              value={editedStaff.photo}
              onChange={handleChange}
              placeholder="Photo URL"
            />
            <div className="modal-actions">
              <button onClick={handleSave}>Save</button>
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffCard;
