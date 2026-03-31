import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" or "history"

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

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      // Using your operation/compare endpoint as requested
      const response = await axios.get(`http://localhost:8080/api/v1/quantities/history/operation/compare`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHistory(response.data);
      setCurrentView("history"); // Switch to the separate history page
    } catch (error) {
      alert("Failed to fetch history. Check if the endpoint exists.");
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to delete all history records?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/v1/quantities/history/clear`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHistory([]); // Clear the local state so the UI updates immediately
        alert("History cleared!");
      } catch (error) {
        alert("Failed to clear history. Check if the delete endpoint is implemented.");
      }
    }
  };

  const handleCalculate = async () => {
    const { action, type, fromUnit, toUnit, fromValue, toValue, operator } = measurementData;

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
          const isTrue = response.data.resultValue === 1.0 || response.data.resultString === "true";
          setMeasurementData(prev => ({
            ...prev,
            comparisonStatus: isTrue ? "EQUAL" : "NOT EQUAL"
          }));
        } else if (action === "arithmetic") {
          setMeasurementData(prev => ({
            ...prev,
            comparisonStatus: response.data.resultValue.toString()
          }));
        } else {
          setMeasurementData(prev => ({
            ...prev,
            toValue: response.data.resultValue.toString(),
            comparisonStatus: null
          }));
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error: Check Backend Connection");
    }
  };

  if (isLoggedIn) {
    return (
      <div className="dashboard-view">
        {/* Navigation Bar - Persistent on all views */}
        <div className="top-nav">
          <span className="brand-name" onClick={() => setCurrentView("dashboard")} style={{ cursor: 'pointer' }}>
            Quantity Measurement App
          </span>

          <div className="nav-links">
            {/* This logic ensures the button only shows during Comparison */}
            {measurementData.action === "comparison" && currentView === "dashboard" && (
              <span
                className="history-link"
                onClick={fetchHistory}
                style={{ cursor: 'pointer', marginRight: '20px', color: '#007bff', fontWeight: 'bold' }}
              >
                History
              </span>
            )}

            <button className="logout-pill" onClick={() => setIsLoggedIn(false)}>Logout</button>
          </div>
        </div>

        {/* View Switcher */}
        {currentView === "dashboard" ? (
          <div className="dashboard-content">
            <div className="blue-hero"><h1>Welcome To Quantity Measurement</h1></div>

            <div className="card-container">
              <p className="sub-header">CHOOSE TYPE</p>
              <div className="type-grid">
                {Object.keys(unitOptions).map((t) => (
                  <div key={t} className={`type-card ${measurementData.type === t ? `active` : ""}`}
                    onClick={() => setMeasurementData({ ...measurementData, type: t, fromUnit: unitOptions[t][0], toUnit: unitOptions[t][1] || unitOptions[t][0], toValue: "", comparisonStatus: null })}>
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
                    onClick={() => setMeasurementData({ ...measurementData, action: m, toValue: "", comparisonStatus: null })}>
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
                    <input
                      type="number"
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

              {(measurementData.action === 'comparison' || measurementData.action === 'arithmetic') &&
                measurementData.comparisonStatus && (
                  <div className="mt-4 text-center">
                    <hr />
                    <h3 className={`fw-bold ${measurementData.comparisonStatus === "EQUAL" ? "text-success" : measurementData.comparisonStatus === "NOT EQUAL" ? "text-danger" : "text-primary"}`}>
                      Result: {measurementData.comparisonStatus}
                    </h3>
                  </div>
                )}
            </div>
          </div>
        ) : (
          /* --- SEPARATE HISTORY PAGE VIEW --- */
          <div className="history-page-container container mt-5">
            <div className="history-card mx-auto shadow-sm border-0 bg-white p-4 rounded">
              <div className="d-flex justify-content-between align-items-center mb-4">

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="display-6 fw-bold text-dark">Measurement History</h2>
                  <div className="btn-group">
                    <button className="btn btn-outline-danger me-2" onClick={handleClearHistory}>
                      🗑️ Clear All History
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => setCurrentView("dashboard")}>
                      ← Back to Calculator
                    </button>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4">Operation</th>
                      <th>Input 1</th>
                      <th>Unit 1</th>
                      <th>Input 2</th>
                      <th>Unit 2</th>
                      <th className="pe-4">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((item, index) => (
                        <tr key={index}>
                          <td className="ps-4">
                            <span className={`badge ${item.operation === 'compare' ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                              {item.operation.toUpperCase()}
                            </span>
                          </td>
                          <td>{item.thisValue}</td>
                          <td className="text-muted">{item.thisUnit}</td>
                          <td>{item.thatValue}</td>
                          <td className="text-muted">{item.thatUnit}</td>
                          <td className="pe-4 fw-bold">
                            {item.operation === 'compare' ? (
                              <span className={item.resultString === "true" ? "text-success" : "text-danger"}>
                                {item.resultString === "true" ? "MATCH" : "MISMATCH"}
                              </span>
                            ) : (
                              <span className="text-primary">{item.resultValue}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
  <img 
    src="https://png.pngtree.com/png-clipart/20230812/original/pngtree-measure-measurement-centimeter-metric-vector-picture-image_10460965.png" 
    alt="Quantity Measurement Logo" 
  />
</div>
  <div className="graphic-text">
    QUANTITY MEASUREMENT APP
  </div>
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