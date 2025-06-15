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
    
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }
    
    // Call the onSubmit callback with the name
    onSubmit(name.trim());
  };

  const handleInputChange = (e) => {
    setName(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="name-input-overlay">
      <div className="name-input-modal">
        <h2>Welcome to FlexPlex!</h2>
        <p>Enter your name to begin and earn rewards upon completion</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={handleInputChange}
            placeholder="Your name"
            className="name-input"
            autoFocus
            maxLength={50}
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <button 
            type="submit" 
            className="start-button"
            disabled={!name.trim()}
          >
            Start Challenge
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameInput;