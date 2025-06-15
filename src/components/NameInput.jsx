import React, { useState } from "react";
import "../styles/NameInput.css";

const NameInput = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Call the onSubmit callback with the name
    onSubmit(name.trim());
  };

  return (
    <div className="name-input-overlay">
      <div className="name-input-modal">
        <h2>Welcome to Yoga Pose Challenge!</h2>
        <p>Enter your name to begin and earn rewards upon completion</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Your name"
            className="name-input"
            autoFocus
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="start-button">
            Start Challenge
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameInput;