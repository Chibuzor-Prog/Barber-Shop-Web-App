import React, { useState } from "react";
import { Link } from "react-router-dom";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords do not match");
      return;
    }

    setIsError(false);
    setMessage("Registration successful (mock)");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#2c1e17] via-[#3b2a21] to-[#1a120d]">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-lg bg-white/90 backdrop-blur p-10 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Register</h2>
          <p className="text-sm text-gray-600 mt-2">
            Create your account to book appointments
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2 text-sm border ${
              isError
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-col space-y-1">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create Password"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {showPassword ? (
                  <><path d="M3 3l18 18" /><path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" /><path d="M9.88 5.08A10.94 10.94 0 0112 4c7 0 10 8 10 8a16.86 16.86 0 01-4.17 5.27" /><path d="M6.61 6.61A16.86 16.86 0 002 12s3 8 10 8a10.94 10.94 0 005.08-1.32" /></>
                ) : (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>
                )}
              </svg>
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {showConfirm ? (
                  <><path d="M3 3l18 18" /><path d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42" /><path d="M9.88 5.08A10.94 10.94 0 0112 4c7 0 10 8 10 8a16.86 16.86 0 01-4.17 5.27" /><path d="M6.61 6.61A16.86 16.86 0 002 12s3 8 10 8a10.94 10.94 0 005.08-1.32" /></>
                ) : (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-10">
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition"
          >
            Register
          </button>

          <p className="mt-4 text-center text-sm text-gray-700">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;