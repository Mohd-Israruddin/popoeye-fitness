import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import "./Schedule.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
];

const categoryLimits = {
  Yoga: 5,
  Zumba: 5,
  "Personal Training": 3,
  Cardio: 4,
  Strength: 4,
};

const Schedule = () => {
  const [bookings, setBookings] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ member: "", category: "Yoga", trainer: "" });
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reminder, setReminder] = useState("");
  const [lastBooking, setLastBooking] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({ member: "", category: "", trainer: "" });

  const scheduleRef = useRef();

  // Fetch members and bookings from backend on load
  useEffect(() => {
    fetchMembers();
    fetchBookings();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/members");
      setMembers(res.data.map(m => m.name)); // Adjust based on your member schema
    } catch (err) {
      console.error("Error fetching members", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/schedule");
      setBookings(res.data); // Assuming backend returns in correct format
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

  const handleSlotClick = (day, time) => {
    setSelectedSlot({ day, time });
    setForm({ member: "", category: "Yoga", trainer: "" });
    setEditIndex(null);
    setReminder(`Don't forget to assign trainer and confirm category.`);
  };

  const handleInputChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedSlot) return;
    const key = `${selectedSlot.day}-${selectedSlot.time}`;
    const slotBookings = bookings[key] || [];
    const categoryCount = slotBookings.filter(b => b.category === form.category).length;

    if (categoryCount >= categoryLimits[form.category] && editIndex === null) {
      alert(`Limit reached for ${form.category} in this slot.`);
      return;
    }

    const newBooking = { ...form };

    let updatedSlotBookings;
    if (editIndex !== null) {
      updatedSlotBookings = [...slotBookings];
      updatedSlotBookings[editIndex] = newBooking;
    } else {
      updatedSlotBookings = [...slotBookings, newBooking];
      setLastBooking({ key, booking: newBooking });
    }

    const updatedBookings = {
      ...bookings,
      [key]: updatedSlotBookings,
    };

    setBookings(updatedBookings);
    setForm({ member: "", category: "Yoga", trainer: "" });
    setSelectedSlot(null);
    setEditIndex(null);
    setSuccessMessage(`Booking successful for ${newBooking.member} in ${form.category}`);
    setTimeout(() => setSuccessMessage(""), 3000);
    setReminder("");

    try {
      await axios.post("http://localhost:5000/api/schedule", {
        day: selectedSlot.day,
        time: selectedSlot.time,
        ...newBooking,
      });
    } catch (err) {
      console.error("Failed to save booking", err);
    }
  };

  const handleAddMember = async () => {
    if (newMember && !members.includes(newMember)) {
      try {
        await axios.post("http://localhost:5000/api/members", { name: newMember });
        setMembers([...members, newMember]);
        setNewMember("");
      } catch (err) {
        console.error("Failed to add member", err);
      }
    }
  };

  const handleExportPDF = async () => {
    const input = scheduleRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("Weekly_Schedule.pdf");
  };

  const handleEditBooking = (day, time, index) => {
    const key = `${day}-${time}`;
    const booking = bookings[key][index];
    setSelectedSlot({ day, time });
    setForm(booking);
    setEditIndex(index);
  };

  const handleUndo = () => {
    if (lastBooking) {
      const { key, booking } = lastBooking;
      const updated = bookings[key].filter(b => b !== booking);
      const updatedBookings = { ...bookings, [key]: updated };
      setBookings(updatedBookings);
      setLastBooking(null);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to clear the entire schedule?")) {
      try {
        await axios.delete("http://localhost:5000/api/schedule");
        setBookings({});
        setLastBooking(null);
      } catch (err) {
        console.error("Failed to reset schedule", err);
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const renderBookings = (day, time) => {
    const key = `${day}-${time}`;
    let slotBookings = bookings[key] || [];

    if (filters.member) {
      slotBookings = slotBookings.filter(b => b.member === filters.member);
    }
    if (filters.category) {
      slotBookings = slotBookings.filter(b => b.category === filters.category);
    }

    return (
      <div className="slot-bookings">
        {slotBookings.length > 0 && (
          <details>
            <summary>{slotBookings.length} booking(s)</summary>
            <ul>
              {slotBookings.map((b, idx) => (
                <li key={idx}>
                  {b.member} - {b.category}
                  {b.trainer && ` (Trainer: ${b.trainer})`}
                  <button onClick={() => handleEditBooking(day, time, idx)}>Edit</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="schedule-wrapper">
      <h2 className="schedule-title">Weekly Schedule</h2>

      <div className="schedule-controls">
        <input
          type="text"
          placeholder="New Member Name"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
        />
        <button onClick={handleAddMember}>Add Member</button>

        <button onClick={handleExportPDF} className="pdf-btn">Export PDF</button>
        <button onClick={handleUndo} disabled={!lastBooking}>Undo Last</button>
        <button onClick={handleReset}>Reset Schedule</button>
      </div>

      <div className="filters">
        <label>
          👤
          <select name="member" value={filters.member} onChange={handleFilterChange}>
            <option value="">Filter by Member</option>
            {members.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label>
          🧘
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            <option value="">Filter by Category</option>
            {Object.keys(categoryLimits).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          🏋️
          <select name="trainer" value={filters.trainer} onChange={handleFilterChange}>
            <option value="">Filter by Trainer</option>
            {[...new Set(Object.values(bookings)
              .flat()
              .map(b => b.trainer)
              .filter(Boolean))].map((trainerName) => (
                <option key={trainerName} value={trainerName}>{trainerName}</option>
              ))}
          </select>
        </label>
      </div>

      {successMessage && <p className="success-msg">{successMessage}</p>}
      {reminder && <p className="reminder-msg">{reminder}</p>}

      <div className="calendar" ref={scheduleRef}>
        <div className="time-slot"></div>
        {days.map((day) => (
          <div key={day} className="calendar-day">{day}</div>
        ))}

        {times.map((time) => (
          <React.Fragment key={time}>
            <div className="time-slot">{time}</div>
            {days.map((day) => (
              <div
                key={`${day}-${time}`}
                className="slot-cell"
                onClick={() => handleSlotClick(day, time)}
              >
                {renderBookings(day, time)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {selectedSlot && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <h3>{editIndex !== null ? "Edit Booking" : "Add Booking"} - {selectedSlot.day}, {selectedSlot.time}</h3>

            <select
              name="member"
              value={form.member}
              onChange={handleInputChange}
            >
              <option value="">Select Member</option>
              {members.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
            >
              {Object.keys(categoryLimits).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              name="trainer"
              placeholder="Trainer Name (Optional)"
              value={form.trainer}
              onChange={handleInputChange}
            />

            <div className="modal-actions">
              <button onClick={handleBookingSubmit}>
                {editIndex !== null ? "Update" : "Book"}
              </button>
              <button onClick={() => setSelectedSlot(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
