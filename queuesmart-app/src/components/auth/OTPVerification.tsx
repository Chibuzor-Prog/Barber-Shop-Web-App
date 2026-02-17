import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [generatedOTP] = useState("123456");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { tempUser, verifyOTP } = useAuth();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempUser) {
      // No login happened first
      navigate("/");
      return;
    }

    if (otp !== generatedOTP) {
      setError("Invalid OTP");
      return;
    }

    // Store user permanently
    verifyOTP();

    // Now safe — tempUser is guaranteed not null here
    if (tempUser.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900" style={{ backgroundImage: "url('/src/assets/login3-bg.jpg')" }}>
      <form
        onSubmit={handleVerify}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Enter OTP (Mock: 123456)
        </h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          className="w-full border p-2 mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />

        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Verify
        </button>
      </form>
    </div>
  );
};

export default OTPVerification;
