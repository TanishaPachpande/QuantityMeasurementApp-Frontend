import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [action, setAction] = useState("comparison"); // Default from screenshot

  const [measurement, setMeasurement] = useState({
    value: 1,
    value2: 1000,
    fromUnit: "Kilometer",
    toUnit: "Meters",
    type: "LENGTH",
    result: ""
  });

  const [form, setForm] = useState({
    name: "", email: "", password: "", mobileNumber: ""
  });

  const unitOptions = {
    LENGTH: ["Kilometer", "Meters", "Centimeter", "Inch", "Feet"],
    WEIGHT: ["Kilogram", "Gram", "Tonne"],
    TEMPERATURE: ["Celsius", "Fahrenheit"],
    VOLUME: ["Litres", "Millilitres", "Gallon"]
  };

  const handleAuth = (type) => {
    if(type === 'login') setIsLoggedIn(true);
    else { alert("Signed up successfully!"); setTab("login"); }
  };

  if (isLoggedIn) {
    return (
      <div className="dashboard-view">
        <div className="top-nav">
          <span className="brand-name">Quanment</span>
          <div className="nav-links">
            <span className="history-link">History</span>
            <button className="logout-pill" onClick={() => setIsLoggedIn(false)}>Logout</button>
          </div>
        </div>
        
        <div className="blue-hero">
          <h1>Welcome To Quantity Measurement</h1>
        </div>

        <div className="card-container">
          <p className="sub-header">CHOOSE TYPE</p>
          <div className="type-grid">
            {Object.keys(unitOptions).map((t) => (
              <div 
                key={t} 
                className={`type-card ${measurement.type === t ? `active-${t.toLowerCase()}` : ""}`}
                onClick={() => setMeasurement({...measurement, type: t, result: ""})}
              >
                <div className="type-icon">
                  {t === "LENGTH" && "📏"} {t === "WEIGHT" && "⚖️"} 
                  {t === "TEMPERATURE" && "🌡️"} {t === "VOLUME" && "🧪"}
                </div>
                <p>{t.charAt(0) + t.slice(1).toLowerCase()}</p>
              </div>
            ))}
          </div>

          <p className="sub-header">CHOOSE ACTION</p>
          <div className="action-toggle">
            {["comparison", "conversion", "arithmetic"].map((m) => (
              <button 
                key={m} 
                className={`toggle-btn ${action === m ? "selected" : ""}`}
                onClick={() => setAction(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <div className="input-row">
            <div className="field-group">
              <label>FROM</label>
              <div className="input-with-select">
                <input type="number" value={measurement.value} onChange={(e) => setMeasurement({...measurement, value: e.target.value})} />
                <select value={measurement.fromUnit} onChange={(e) => setMeasurement({...measurement, fromUnit: e.target.value})}>
                  {unitOptions[measurement.type].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>TO</label>
              <div className="input-with-select">
                <input type="text" readOnly value={action === "conversion" ? measurement.result : measurement.value2} />
                <select value={measurement.toUnit} onChange={(e) => setMeasurement({...measurement, toUnit: e.target.value})}>
                  {unitOptions[measurement.type].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="side-graphic">
          <div className="graphic-circle">
             <img src="https://cdn-icons-png.flaticon.com/512/3144/3144456.png" alt="Cart" />
          </div>
          <p className="graphic-text">QUANTITY MEASUREMENT APP</p>
        </div>
        <div className="side-form">
          <div className="auth-nav">
            <span className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>LOGIN</span>
            <span className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>SIGNUP</span>
          </div>
          <div className="form-fields">
            {tab === "signup" && (
              <div className="field">
                <label>Full Name</label>
                <input name="name" onChange={(e) => setForm({...form, name: e.target.value})} />
              </div>
            )}
            <div className="field">
              <label>Email Id</label>
              <input name="email" onChange={(e) => setForm({...form, email: e.target.value})} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" onChange={(e) => setForm({...form, password: e.target.value})} />
            </div>
            {tab === "signup" && (
              <div className="field">
                <label>Mobile Number</label>
                <input name="mobileNumber" onChange={(e) => setForm({...form, mobileNumber: e.target.value})} />
              </div>
            )}
            <button className="maroon-btn" onClick={() => handleAuth(tab)}>
              {tab === "signup" ? "Signup" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}