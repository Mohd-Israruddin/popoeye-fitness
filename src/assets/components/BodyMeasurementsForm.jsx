import React, { useState, useEffect } from "react";
import "./BodyMeasurementsForm.css";

const initialMeasurements = {
  height: '',
  weight: '',
  chest: '',
  waist: '',
  hips: '',
  biceps: '',
  thighs: '',
};

const BodyMeasurementsForm = ({ member, measurements, onSave, onClose }) => {
  const [data, setData] = useState(initialMeasurements);

  useEffect(() => {
    if (measurements) setData(measurements);
    else setData(initialMeasurements);
  }, [measurements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(data);
    onClose();
  };

  return (
    <div className="members-measurements-overlay">
      <form className="members-measurements-modal" onSubmit={handleSubmit}>
        <h3 className="members-measurements-title">Body Measurements {member ? `for ${member.name}` : ''}</h3>
        
        <div className="members-measurements-grid">
          <div className="members-measurements-group">
            <label htmlFor="height">Height (cm)</label>
            <input 
              id="height"
              name="height" 
              value={data.height} 
              onChange={handleChange} 
              placeholder="Height in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input 
              id="weight"
              name="weight" 
              value={data.weight} 
              onChange={handleChange} 
              placeholder="Weight in kg" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="chest">Chest (cm)</label>
            <input 
              id="chest"
              name="chest" 
              value={data.chest} 
              onChange={handleChange} 
              placeholder="Chest in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="waist">Waist (cm)</label>
            <input 
              id="waist"
              name="waist" 
              value={data.waist} 
              onChange={handleChange} 
              placeholder="Waist in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="hips">Hips (cm)</label>
            <input 
              id="hips"
              name="hips" 
              value={data.hips} 
              onChange={handleChange} 
              placeholder="Hips in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="biceps">Biceps (cm)</label>
            <input 
              id="biceps"
              name="biceps" 
              value={data.biceps} 
              onChange={handleChange} 
              placeholder="Biceps in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
          
          <div className="members-measurements-group">
            <label htmlFor="thighs">Thighs (cm)</label>
            <input 
              id="thighs"
              name="thighs" 
              value={data.thighs} 
              onChange={handleChange} 
              placeholder="Thighs in cm" 
              type="number" 
              min="0" 
              className="members-measurements-input"
            />
          </div>
        </div>
        
        <div className="members-measurements-buttons">
          <button type="submit" className="members-measurements-btn members-measurements-btn-primary">
            Save Measurements
          </button>
          <button type="button" onClick={onClose} className="members-measurements-btn members-measurements-btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BodyMeasurementsForm; 