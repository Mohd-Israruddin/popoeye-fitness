import React, { useState, useEffect } from "react";
import AddStaffForm from "./AddStaffForm";
import StaffCard from "./StaffCard";
import "./Staff.css";

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const API_URL = "http://localhost:5000/api/staff"; // adjust if needed

  // Fetch staff list on mount
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    }
  };

  const addStaff = async (staff) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staff),
      });
      if (!res.ok) throw new Error("Failed to add staff");
      const newStaff = await res.json();
      setStaffList((prev) => [...prev, newStaff]);
      setShowAddForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteStaff = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete staff");
      setStaffList((prev) => prev.filter((staff) => staff.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const updateStaff = async (updatedStaff) => {
    try {
      const res = await fetch(`${API_URL}/${updatedStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStaff),
      });
      if (!res.ok) throw new Error("Failed to update staff");
      const data = await res.json();
      setStaffList((prev) =>
        prev.map((staff) => (staff.id === data.id ? data : staff))
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="staff-page">
      <header className="staff-header">
        <h2>Staff Members</h2>
      </header>

      <div className="add-staff">
        {!showAddForm && (
          <button
            className="show-form-btn"
            onClick={() => setShowAddForm(true)}
            aria-label="Show Add Staff Form"
          >
            + Add New Staff
          </button>
        )}
        {showAddForm && (
          <AddStaffForm onAdd={addStaff} onCancel={() => setShowAddForm(false)} />
        )}
      </div>

      <div className="staff-list">
        {staffList.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            onDelete={deleteStaff}
            onUpdate={updateStaff}
            onClick={() => setSelectedStaff(staff)}
          />
        ))}
      </div>

      {selectedStaff && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedStaff(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <img src={selectedStaff.photo} alt={selectedStaff.name} className="modal-img" />
            <h2 id="modal-title">{selectedStaff.name}</h2>
            <p>
              <strong>Role:</strong> {selectedStaff.role}
            </p>
            <p>
              <strong>Phone:</strong> {selectedStaff.phone}
            </p>
            {selectedStaff.email && (
              <p>
                <strong>Email:</strong> {selectedStaff.email}
              </p>
            )}
            {selectedStaff.address && (
              <p>
                <strong>Address:</strong> {selectedStaff.address}
              </p>
            )}
            <button className="close-btn" onClick={() => setSelectedStaff(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
