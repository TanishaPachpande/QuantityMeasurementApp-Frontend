import { useState } from "react";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // form states
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: ""
  });

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------- SIGNUP ----------------
  const handleSignup = async () => {
    try {
      const res = await fetch("http://localhost:8080/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      alert("Signup successful!");
      setTab("login");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        // store token if backend sends
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  // ---------------- DASHBOARD ----------------
  if (isLoggedIn) {
    return (
      <div className="dashboard">
        <h1 className="header">Welcome To Quantity Measurement</h1>

        <div className="dashboard-container">
          <h3>CHOOSE TYPE</h3>

          <div className="type-cards">
            <div className="card active-card">📏<p>Length</p></div>
            <div className="card">🌡<p>Temperature</p></div>
            <div className="card">🧪<p>Volume</p></div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- LOGIN / SIGNUP ----------------
  return (
    <div className="main-container">
      <div className="left-card">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3144/3144456.png"
          alt="shopping"
        />
        <h3>QUANTITY MEASUREMENT APP</h3>
      </div>

      <div className="right-card">
        <div className="tabs">
          <span
            className={tab === "login" ? "active" : ""}
            onClick={() => setTab("login")}
          >
            LOGIN
          </span>
          <span
            className={tab === "signup" ? "active" : ""}
            onClick={() => setTab("signup")}
          >
            SIGNUP
          </span>
        </div>

        {tab === "signup" && (
          <div className="form">
            <label>Full Name</label>
            <input name="fullName" onChange={handleChange} />

            <label>Email Id</label>
            <input name="email" onChange={handleChange} />

            <label>Password</label>
            <input name="password" type="password" onChange={handleChange} />

            <label>Mobile Number</label>
            <input name="mobileNumber" onChange={handleChange} />

            <button className="submit-btn" onClick={handleSignup}>
              Signup
            </button>
          </div>
        )}

        {tab === "login" && (
          <div className="form">
            <label>Email Id</label>
            <input name="email" onChange={handleChange} />

            <label>Password</label>
            <input name="password" type="password" onChange={handleChange} />

            <button className="submit-btn" onClick={handleLogin}>
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}