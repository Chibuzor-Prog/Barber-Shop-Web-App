import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { users } from "../../data/mockUsers";
import { useAuth } from "../../context/AuthContext";
import bgImage from "../../assets/login-bg.jpg";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    // Store user in AuthContext (this also saves to localStorage)
    login(user.email);

    // Go to OTP page ONLY
    navigate("/otp");
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen p-6 bg-blue-300" style={{ backgroundImage: `url(${bgImage})` }}>
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-120">
        <h2 className="text-2xl mb-4 text-center font-bold">
          Barber Shop Login
        </h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Login
        </button>

        <p className="text-center mt-4 text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
