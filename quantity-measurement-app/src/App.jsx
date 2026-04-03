import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");

  const [measurementData, setMeasurementData] = useState({
    type: "LENGTH",
    action: "conversion",
    fromUnit: "FEET",
    toUnit: "INCHES",
    fromValue: "",
    toValue: "",
    operator: "+",
    comparisonStatus: null
  });

  const [form, setForm] = useState({
    name: "", email: "", password: "", mobileNumber: ""
  });

  const unitOptions = {
    LENGTH: ["FEET", "INCHES", "YARDS", "CENTIMETERS"],
    WEIGHT: ["GRAM", "KILOGRAM", "TONNE", "MILLIGRAM", "POUND"],
    VOLUME: ["LITRE", "MILLILITRE", "GALLON"],
    TEMPERATURE: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
  };

  // --- AUTHENTICATION (Talking to Security Service via Gateway) ---
  const handleAuth = async (authType) => {
    const url = `http://localhost:8080/auth/${authType}`;
    const payload = authType === "register"
      ? {
        name: form.name,
        email: form.email,
        password: form.password,
        mobileNumber: form.mobileNumber
      }
      : { email: form.email, password: form.password };

    try {
      const response = await axios.post(url, payload);

      // If we get a 200/201 status, the backend DID its job
      if (response.status === 200 || response.status === 201) {
        if (authType === "login") {
          // Extract token: handles raw string OR {token: "..."} OR {jwt: "..."}
          const token = typeof response.data === 'string'
            ? response.data
            : (response.data.token || response.data.jwt || response.data);

          if (token && typeof token === 'string' && token.length > 20) {
            localStorage.setItem('token', token);
            setIsLoggedIn(true);
            alert("Login successful!");
          } else {
            // If login was 200 but token is missing/invalid
            console.error("Payload received:", response.data);
            alert("Login successful, but token format is invalid. Check Backend Controller.");
          }
        } else {
          alert("Registration successful! Please login.");
          setTab("login");
        }
      }
    } catch (error) {
      // This only runs if the server returns 4xx or 5xx
      console.error("Full Error Object:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown Error";
      alert(`Server Error: ${errorMsg}`);
    }
  };
  // --- HISTORY (Talking to Quantity Service via Gateway) ---
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/v1/quantities/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHistory(response.data);
      setCurrentView("history");
    } catch (error) {
      alert("Failed to fetch history. Ensure Quantity Service is UP in Eureka.");
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Delete all history records?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/v1/quantities/history/clear`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHistory([]);
        alert("History cleared!");
      } catch (error) {
        alert("Failed to clear history.");
      }
    }
  };

  // --- CALCULATION (Talking to Quantity Service via Gateway) ---
  const handleCalculate = async () => {
    const { action, type, fromUnit, toUnit, fromValue, toValue, operator } = measurementData;

    // Mapping to match your Java Backend Enums
    const backendTypeMap = {
  LENGTH: "LengthUnit",
  WEIGHT: "WeightUnit",
  TEMPERATURE: "TemperatureUnit",
  VOLUME: "VolumeUnit"
};

    const payload = {
      thisQuantityDTO: {
        value: parseFloat(fromValue) || 0,
        unit: fromUnit.toUpperCase(),
        measurementType: backendTypeMap[type]
      },
      thatQuantityDTO: {
        value: action === "conversion" ? 0 : (parseFloat(toValue) || 0),
        unit: toUnit.toUpperCase(),
        measurementType: backendTypeMap[type]
      },
      targetUnit: toUnit.toUpperCase()
    };

    const opMap = { "+": "add", "-": "subtract", "/": "divide", "*": "multiply" };
    let endpoint = action === "conversion" ? "convert" :
      action === "comparison" ? "compare" :
        (opMap[operator] || "add");

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/api/v1/quantities/${endpoint}`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data) {
        if (action === "comparison") {
          const isTrue = response.data.resultString === "true" || response.data.resultValue === 1.0;
          setMeasurementData(prev => ({
            ...prev,
            comparisonStatus: isTrue ? "EQUAL" : "NOT EQUAL"
          }));
        } else {
          // If action is conversion or arithmetic, update the result
          setMeasurementData(prev => ({
            ...prev,
            toValue: response.data.resultValue.toString(),
            comparisonStatus: action === "arithmetic" ? response.data.resultValue.toString() : null
          }));
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error: Ensure API-GATEWAY and QUANTITY-SERVICE are running.");
    }
  };

  if (isLoggedIn) {
    return (
      <div className="dashboard-view">
        <div className="top-nav">
          <span className="brand-name" onClick={() => setCurrentView("dashboard")} style={{ cursor: 'pointer' }}>
            Quantity Measurement App
          </span>
          <div className="nav-links">
            <span className="history-link" onClick={fetchHistory} style={{ cursor: 'pointer', marginRight: '20px' }}>
              History
            </span>
            <button className="logout-pill" onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }}>Logout</button>
          </div>
        </div>

        {currentView === "dashboard" ? (
          <div className="dashboard-content">
            <div className="blue-hero"><h1>Welcome To Quantity Measurement</h1></div>
            <div className="card-container">
              <p className="sub-header">SELECT CATEGORY</p>
              <div className="type-grid">
                {Object.keys(unitOptions).map((t) => (
                  <div key={t} className={`type-card ${measurementData.type === t ? `active` : ""}`}
                    onClick={() => setMeasurementData({ ...measurementData, type: t, fromUnit: unitOptions[t][0], toUnit: unitOptions[t][1] || unitOptions[t][0], toValue: "", comparisonStatus: null })}>
                    <div className="type-icon">
                      {t === "LENGTH" && "📏"} {t === "WEIGHT" && "⚖️"}
                      {t === "TEMPERATURE" && "🌡️"} {t === "VOLUME" && "🧪"}
                    </div>
                    <p>{t}</p>
                  </div>
                ))}
              </div>

              <p className="sub-header">SELECT OPERATION</p>
              <div className="action-toggle">
                {["conversion", "comparison", "arithmetic"].map((m) => (
                  <button key={m} className={`toggle-btn ${measurementData.action === m ? "selected" : ""}`}
                    onClick={() => setMeasurementData({ ...measurementData, action: m, toValue: "", fromValue: "", comparisonStatus: null })}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="input-row">
                <div className="field-group">
                  <label>VALUE 1</label>
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
                  <label>{measurementData.action === "conversion" ? "RESULT" : "VALUE 2"}</label>
                  <div className="input-with-select">
                    <input
                      type="text"
                      value={measurementData.toValue}
                      readOnly={measurementData.action === 'conversion'}
                      onChange={(e) => setMeasurementData({ ...measurementData, toValue: e.target.value })}
                    />
                    <select value={measurementData.toUnit} onChange={(e) => setMeasurementData({ ...measurementData, toUnit: e.target.value })}>
                      {unitOptions[measurementData.type].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button className="calculate-btn" onClick={handleCalculate}>Calculate</button>

              {measurementData.comparisonStatus && (
                <div className="result-display">
                  <hr />
                  <h3 className={measurementData.comparisonStatus === "EQUAL" ? "text-success" : "text-primary"}>
                    Result: {measurementData.comparisonStatus}
                  </h3>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* --- HISTORY VIEW --- */
          <div className="history-page-container container mt-5">
            <div className="history-card bg-white p-4 rounded shadow">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Audit History</h2>
                <div>
                  <button className="btn btn-danger me-2" onClick={handleClearHistory}>Clear Data</button>
                  <button className="btn btn-secondary" onClick={() => setCurrentView("dashboard")}>Back</button>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Input 1</th>
                    <th>Input 2</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={index}>
                      <td>{item.operation}</td>
                      <td>{item.thisValue} {item.thisUnit}</td>
                      <td>{item.thatValue} {item.thatUnit}</td>
                      <td>{item.resultValue || item.resultString}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="side-graphic">
          <div className="graphic-circle">
            <img src="https://png.pngtree.com/png-clipart/20230812/original/pngtree-measure-measurement-centimeter-metric-vector-picture-image_10460965.png" alt="Logo" />
          </div>
          <div className="graphic-text">QUANTITY MEASUREMENT</div>
        </div>
        <div className="side-form">
          <div className="auth-nav">
            <span className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>LOGIN</span>
            <span className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>SIGNUP</span>
          </div>
          <div className="form-fields">
            {tab === "signup" && <div className="field"><label>Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
            <div className="field"><label>Email Id</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            {tab === "signup" && <div className="field"><label>Mobile Number</label><input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></div>}
            <button className="maroon-btn" onClick={() => handleAuth(tab === "signup" ? "register" : "login")}>{tab === "signup" ? "Create Account" : "Login"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}