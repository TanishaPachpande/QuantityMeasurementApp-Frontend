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
    toUnit: "INCHES", // Matched to Java list
    fromValue: "",
    toValue: "",
    operator: "+"
  });

  const [form, setForm] = useState({
    name: "", email: "", password: "", mobileNumber: ""
  });

  const unitOptions = {
  // Java expects: "FEET", "INCHES", "YARDS", "CENTIMETERS"
  LENGTH: ["FEET", "INCHES", "YARDS", "CENTIMETERS"], 
  // Java expects: "MILLIGRAM", "GRAM", "KILOGRAM", "POUND", "TONNE"
  WEIGHT: ["GRAM", "KILOGRAM", "TONNE", "MILLIGRAM", "POUND"],
  // Java expects: "LITRE", "MILLILITRE", "GALLON"
  VOLUME: ["LITRE", "MILLILITRE", "GALLON"],
  // Java expects: "CELSIUS", "FAHRENHEIT", "KELVIN"
  TEMPERATURE: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
};

  const handleAuth = async (authType) => {
    const url = `http://localhost:8080/auth/${authType}`;
    const payload = authType === "register"
      ? { name: form.name, email: form.email, password: form.password, mobileNumber: form.mobileNumber }
      : { email: form.email, password: form.password };

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
      alert(error.response?.data?.message || "Authentication failed");
    }
  };

  const handleCalculate = async () => {
  const { action, type, fromUnit, toUnit, fromValue, toValue, operator } = measurementData;

  // 1. Map to your Backend @Pattern regex: "LengthUnit|WeightUnit|..."
  const backendTypeMap = {
    LENGTH: "LengthUnit",
    WEIGHT: "WeightUnit",
    TEMPERATURE: "TemperatureUnit",
    VOLUME: "VolumeUnit"
  };

  // 2. Construct the Payload
  const payload = {
    thisQuantityDTO: {
      value: parseFloat(fromValue) || 0,
      unit: fromUnit.toUpperCase(),
      measurementType: backendTypeMap[type]
    },
    thatQuantityDTO: {
      // Fix: Send a dummy 0 for conversion to satisfy Java @NotNull/@AssertTrue
      value: action === "conversion" ? 0 : (parseFloat(toValue) || 0),
      unit: toUnit.toUpperCase(),
      measurementType: backendTypeMap[type]
    },
    targetUnit: toUnit.toUpperCase()
  };

  // 3. Dynamic Endpoint Mapping
  const opMap = { "+": "add", "-": "subtract", "/": "divide", "*": "multiply" };
  let endpoint = action === "conversion" ? "convert" : 
                 action === "comparison" ? "compare" : 
                 (opMap[operator] || "add");

  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Ensure your UC18 Auth logic is satisfied
    };

    // --- Inside handleCalculate ---
const response = await axios.post(
  `http://localhost:8080/api/v1/quantities/${endpoint}`,
  payload,
  { headers }
);

// FIX: Change 'result' to 'resultValue' to match your Java DTO
if (response.data && response.data.resultValue !== undefined) {
  setMeasurementData(prev => ({
    ...prev,
    toValue: response.data.resultValue.toString()
  }));
}
  } catch (error) {
    console.error("Submission Error:", error.response?.data);
    alert(`Error: ${error.response?.data?.message || "Check console for validation details"}`);
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
        <div className="blue-hero"><h1>Welcome To Quantity Measurement</h1></div>
        <div className="card-container">
          <p className="sub-header">CHOOSE TYPE</p>
          <div className="type-grid">
            {Object.keys(unitOptions).map((t) => (
              <div key={t} className={`type-card ${measurementData.type === t ? `active` : ""}`}
                onClick={() => setMeasurementData({ ...measurementData, type: t, fromUnit: unitOptions[t][0], toUnit: unitOptions[t][1] || unitOptions[t][0], toValue: "" })}>
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
              <button key={m} className={`toggle-btn ${measurementData.action === m ? "selected" : ""}`}
                onClick={() => setMeasurementData({ ...measurementData, action: m, toValue: "" })}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="input-row">
            <div className="field-group">
              <label>{measurementData.action === "conversion" ? "FROM" : "VALUE 1"}</label>
              <div className="input-with-select">
                <input type="number" value={measurementData.fromValue} onChange={(e) => setMeasurementData({ ...measurementData, fromValue: e.target.value })} />
                <select value={measurementData.fromUnit} onChange={(e) => setMeasurementData({ ...measurementData, fromUnit: e.target.value })}>
                  {unitOptions[measurementData.type].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {measurementData.action === "arithmetic" && (
              <div className="operator-wrapper">
                <select className="op-dropdown" value={measurementData.operator} onChange={(e) => setMeasurementData({ ...measurementData, operator: e.target.value })}>
                  <option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option>
                </select>
              </div>
            )}
            <div className="field-group">
              <label>{measurementData.action === "conversion" ? "TO" : "VALUE 2"}</label>
              <div className="input-with-select">
                <input type={measurementData.action === "conversion" ? "text" : "number"} readOnly={measurementData.action === "conversion"}
                  value={measurementData.toValue} onChange={(e) => setMeasurementData({ ...measurementData, toValue: e.target.value })}
                  placeholder={measurementData.action === "conversion" ? "Result" : "Enter value"} />
                <select value={measurementData.toUnit} onChange={(e) => setMeasurementData({ ...measurementData, toUnit: e.target.value })}>
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
          <div className="graphic-circle"><img src="https://cdn-icons-png.flaticon.com/512/3144/3144456.png" alt="Cart" /></div>
          <p className="graphic-text">QUANTITY MEASUREMENT APP</p>
        </div>
        <div className="side-form">
          <div className="auth-nav">
            <span className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>LOGIN</span>
            <span className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>SIGNUP</span>
          </div>
          <div className="form-fields">
            {tab === "signup" && <div className="field"><label>Full Name</label><input onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
            <div className="field"><label>Email Id</label><input onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Password</label><input type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            {tab === "signup" && <div className="field"><label>Mobile Number</label><input onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div>}
            <button className="maroon-btn" onClick={() => handleAuth(tab === "signup" ? "register" : "login")}>{tab === "signup" ? "Signup" : "Login"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}