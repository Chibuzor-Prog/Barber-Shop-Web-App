import React, { useState } from "react";
import { Link } from "react-router-dom";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setMessage("Passwords do not match");
    setMessage("Registration successful (mock)");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 text-center font-bold">Register</h2>
        {message && <p className="text-green-500">{message}</p>}
        <input type="text" placeholder="Name" className="w-full mb-2 p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email" className="w-full mb-2 p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="text" placeholder="Phone" className="w-full mb-2 p-2 border rounded" value={phone} onChange={e => setPhone(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full mb-2 p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} required />
        <input type="password" placeholder="Confirm Password" className="w-full mb-4 p-2 border rounded" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        <button className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Register</button>

        {/* 🔹 Login Link Added Here */}
        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </p>

      </form>
    </div>
  );
};

export default Register;
