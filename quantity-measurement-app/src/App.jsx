import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [measurementData, setMeasurementData] = useState({
    type: "LENGTH",
    action: "conversion",
    fromUnit: "FEET",
    toUnit: "INCH",
    fromValue: "",
    toValue: "",
    operator: "+"
  });

  const [form, setForm] = useState({
    name: "", email: "", password: "", mobileNumber: ""
  });

  const unitOptions = {
    LENGTH: ["FEET", "INCH", "METERS", "CENTIMETER", "KILOMETER"],
    WEIGHT: ["KILOGRAM", "GRAM", "TONNE"],
    TEMPERATURE: ["CELSIUS", "FAHRENHEIT"],
    VOLUME: ["LITRES", "MILLILITRES", "GALLON"]
  };

  // --- AUTH LOGIC (LOGIN / SIGNUP) ---
  const handleAuth = async (authType) => {
    const url = `http://localhost:8080/auth/${authType}`;
    
    // Explicitly defining the payload for the backend DTOs
    const payload = authType === "register" 
      ? {
          name: form.name,
          email: form.email,
          password: form.password,
          mobileNumber: form.mobileNumber
        }
      : {
          email: form.email,
          password: form.password
        };

    try {
      const response = await axios.post(url, payload);
      
      if (authType === "login") {
        localStorage.setItem('token', response.data.token); 
        setIsLoggedIn(true);
        alert("Login successful!");
      } else {
        alert("Registration successful! Please login.");
        setTab("login");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Authentication failed";
      alert(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    }
  };

  // --- CALCULATION LOGIC ---
  const handleCalculate = async () => {
    const { action, type, fromUnit, toUnit, fromValue, toValue, operator } = measurementData;

  // 1. Map UI types to Backend-specific @Pattern names
  const backendTypeMap = {
    LENGTH: "LengthUnit",
    WEIGHT: "WeightUnit",
    TEMPERATURE: "TemperatureUnit",
    VOLUME: "VolumeUnit"
  };
  const mappedType = backendTypeMap[type.toUpperCase()];

  // 2. Build the payload with the new mapped type
  const payload = {
    thisQuantityDTO: {
      value: parseFloat(fromValue) || 0,
      unit: fromUnit.toUpperCase(),
      measurementType: mappedType // Now sends "LengthUnit" instead of "LENGTH"
    },
    thatQuantityDTO: {
      value: parseFloat(toValue) || 0,
      unit: toUnit.toUpperCase(),
      measurementType: mappedType
    },
    targetUnit: toUnit.toUpperCase()
  };

    const token = localStorage.getItem('token'); 
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await axios.post(
        `http://localhost:8080/api/v1/quantities/${endpoint}`, 
        payload,
        { headers }
      );

      // 3. Bind result back to UI state
      if (response.data && response.data.result !== undefined) {
        setMeasurementData(prev => ({ 
          ...prev, 
          toValue: response.data.result.toString() 
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) alert("Session expired. Please login again.");
      else alert("Calculation failed. Check your Spring Boot console.");
    }
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
                className={`type-card ${measurementData.type === t ? `active` : ""}`}
                onClick={() => setMeasurementData({ ...measurementData, type: t, toValue: "" })}
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
                className={`toggle-btn ${measurementData.action === m ? "selected" : ""}`}
                onClick={() => setMeasurementData({ ...measurementData, action: m, toValue: "" })}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <div className="input-row">
            <div className="field-group">
              <label>{measurementData.action === "conversion" ? "FROM" : "VALUE 1"}</label>
              <div className="input-with-select">
                <input
                  type="number"
                  value={measurementData.fromValue}
                  onChange={(e) => setMeasurementData({ ...measurementData, fromValue: e.target.value })}
                />
                <select
                  value={measurementData.fromUnit}
                  onChange={(e) => setMeasurementData({ ...measurementData, fromUnit: e.target.value })}
                >
                  {unitOptions[measurementData.type].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {measurementData.action === "arithmetic" && (
              <div className="operator-wrapper">
                <select
                  className="op-dropdown"
                  value={measurementData.operator}
                  onChange={(e) => setMeasurementData({ ...measurementData, operator: e.target.value })}
                >
                  <option value="+">+</option>
                  <option value="-">−</option>
                  <option value="*">×</option>
                  <option value="/">÷</option>
                </select>
              </div>
            )}

            <div className="field-group">
              <label>{measurementData.action === "conversion" ? "TO" : "VALUE 2"}</label>
              <div className="input-with-select">
                <input
                  type={measurementData.action === "conversion" ? "text" : "number"}
                  readOnly={measurementData.action === "conversion"}
                  value={measurementData.toValue}
                  onChange={(e) => setMeasurementData({ ...measurementData, toValue: e.target.value })}
                  placeholder={measurementData.action === "conversion" ? "Result" : "Enter value"}
                />
                <select
                  value={measurementData.toUnit}
                  onChange={(e) => setMeasurementData({ ...measurementData, toUnit: e.target.value })}
                >
                  {unitOptions[measurementData.type].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button className="calculate-btn" onClick={handleCalculate}>Calculate</button>
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
                <input onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Email Id</label>
              <input onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {tab === "signup" && (
              <div className="field">
                <label>Mobile Number</label>
                <input onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
              </div>
            )}
            <button className="maroon-btn" onClick={() => handleAuth(tab === "signup" ? "register" : "login")}>
              {tab === "signup" ? "Signup" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}