"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "./_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Sign in failed");
        setLoading(false);
        return;
      }

      const payload = await response.json();
      const user = payload.user || payload; // backward compatibility
      const token = payload.access_token;

      // Store user info and JWT in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      if (token) {
        localStorage.setItem("token", token);
      }
      localStorage.setItem("isLoggedIn", "true");
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event("userLoggedIn"));
      
      setSuccess(true);
  setUsername("");
  setPassword("");
      
      // Redirect to library after 1.5 seconds
      setTimeout(() => {
        window.location.href = "/library";
      }, 1500);
    } catch (err) {
      setError("Failed to connect to server. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Header />

      <div className="bg-white">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 relative overflow-hidden bg-gradient-to-b from-indigo-100 to-white">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
          </div>

          <div className="mx-auto max-w-md relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                Welcome Back
              </h2>
              <p className="text-lg text-gray-700">
                Sign in to your LitMT account to access your translations
              </p>
            </div>

            {/* Sign In Form */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">✓ Sign in successful! Redirecting...</p>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{" "}
                  <Link href="/create-account" className="text-indigo-600 font-semibold hover:text-indigo-700">
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-8 text-center">
              <Link href="/" className="text-indigo-600 font-semibold hover:text-indigo-700 text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
