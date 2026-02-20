import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [generatedOTP] = useState("123456");
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const navigate = useNavigate();
  const { tempUser, verifyOTP } = useAuth();

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(""); 

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    
    const newOtp = [...otp];
    text.split("").forEach((char, i) => (newOtp[i] = char));
    setOtp(newOtp);
    
    const focusIndex = Math.min(text.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otp.join("");

    if (!tempUser) return navigate("/");
    
    if (finalOtp !== generatedOTP) {
      return setError("Invalid verification code. Please try again.");
    }

    verifyOTP();
    navigate(tempUser.role === "admin" ? "/admin/dashboard" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#2c1e17] via-[#3b2a21] to-[#1a120d]">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-lg bg-white/90 backdrop-blur p-10 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Verify Phone</h2>
          <p className="text-sm text-gray-500 mt-3">
            We sent a 6-digit code to <span className="font-medium text-gray-800">+1 (555) ***-**89</span>
          </p>
        </div>

        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border transition-all outline-none shadow-sm ${
                error 
                  ? "border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10" 
                  : "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              }`}
            />
          ))}
        </div>

        <div className="h-6 mt-4 text-center">
          {error && <p className="text-sm text-red-500 font-medium animate-pulse">{error}</p>}
        </div>

        <div className="mt-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition"
          >
            Verify Account
          </button>

          <p className="mt-4 text-center text-sm text-gray-700">
            Didn't receive the code?{" "}
            <button 
              type="button" 
              className="font-semibold text-blue-600 hover:underline transition"
              onClick={() => setError("A new code has been sent.")}
            >
              Click to resend
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;