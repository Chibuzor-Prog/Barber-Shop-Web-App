import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { users } from "../../data/mockUsers";
import { useAuth } from "../../context/AuthContext";
import bgImage from "../../assets/Barber 2.0.jpg";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      setError("Invalid credentials");
      return;
    }

    login(user.email);
    navigate("/otp");
  };

  const eyeIcon = useMemo(
    () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    []
  );

  const eyeOffIcon = useMemo(
    () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path d="M9.88 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.25 18.25 0 0 1-3.13 4.19" />
        <path d="M6.61 6.61A18.09 18.09 0 0 0 2 12s3.5 7 10 7a10.3 10.3 0 0 0 4.41-.93" />
        <path d="M2 2l20 20" />
      </svg>
    ),
    []
  );

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/45" />

      <form
        onSubmit={handleLogin}
        className="relative w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl ring-1 ring-black/5"
      >
        <div className="px-8 py-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
              Barber Shop Login
            </h2>
            <p className="text-sm text-gray-600">Welcome back — please sign in</p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition"
            >
              Login
            </button>

            <p className="mt-4 text-center text-sm text-gray-700">
              Don’t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;