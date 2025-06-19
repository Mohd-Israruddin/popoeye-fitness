import React, { useState, useEffect } from "react";
import axios from "axios";
import MemberTable from "../assets/components/MemberTable";
import SearchBar from "../assets/components/SearchBar";
import MemberForm from "../assets/components/MemberForm";
import "../assets/components/MemberTable.css";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/members");
      setMembers(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  // Filter search by name or memberId
  const handleSearch = (query) => {
    const lower = query.toLowerCase();
    const result = members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.member_id.toString().toLowerCase().includes(lower)
    );
    setFiltered(result);
  };

  // Add or update member (POST or PUT request)
  const handleSave = async (newMember) => {
    try {
      if (editing) {
        // Edit existing member
        await axios.put(`http://localhost:5000/api/members/${editing.id}`, newMember);
      } else {
        // Add new member
        await axios.post("http://localhost:5000/api/members", newMember);
      }
      console.log("Sending join_date:", join_date);
      setShowForm(false);
      setEditing(null);
      fetchMembers(); // refresh list from server
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  // Delete members by IDs (DELETE request)
  const handleDelete = async (ids) => {
    try {
      await Promise.all(ids.map((id) => axios.delete(`http://localhost:5000/api/members/${id}`)));
      fetchMembers();
    } catch (error) {
      console.error("Error deleting members:", error);
    }
  };

 // Client-side SMS trigger (manually)
const handleSMS = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/members/send-expiry-reminders");
    alert(res.data.message); // Show number of messages sent
  } catch (error) {
    console.error("Failed to send SMS:", error);
    alert("Failed to send SMS reminders.");
  }
};


  return (
    <div className="table-container">
      <div className="top-bar">
        <button className="sms-btn" onClick={handleSMS}>📩</button>
        <SearchBar onSearch={handleSearch} />
        <button className="add-btn" onClick={() => setShowForm(true)}>+ Add Member</button>
      </div>
      <MemberTable
        members={filtered}
        onEdit={(m) => {
          setEditing(m);
          setShowForm(true);
        }}
        onDelete={handleDelete}
      />
      {showForm && (
        <MemberForm
          member={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default Members;
