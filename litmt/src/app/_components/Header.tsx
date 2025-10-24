"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        JSON.parse(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setLoading(false);

    // Listen for custom login event
    const handleUserLoggedIn = () => {
      const updatedUserData = localStorage.getItem("user");
      if (updatedUserData) {
        try {
          JSON.parse(updatedUserData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    };

    // Listen for storage changes (e.g., when user logs in from another tab)
    const handleStorageChange = () => {
      const updatedUserData = localStorage.getItem("user");
      if (updatedUserData) {
        try {
          JSON.parse(updatedUserData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    const handleUserLoggedOut = () => {
      setIsLoggedIn(false);
    };

    window.addEventListener("userLoggedIn", handleUserLoggedIn);
    window.addEventListener("userLoggedOut", handleUserLoggedOut);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("userLoggedIn", handleUserLoggedIn);
      window.removeEventListener("userLoggedOut", handleUserLoggedOut);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new Event("userLoggedOut"));
    setMenuOpen(false);
    // Redirect to home
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-white shadow-lg" : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-bold text-indigo-600 hover:text-indigo-700 transition">
          LitMT
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          {!loading && (
            isLoggedIn ? (
              <>
                <Link href="/library" className="text-sm text-gray-700 hover:text-indigo-600 transition">Library</Link>
                <div
                  className="relative"
                  ref={menuRef}
                >
                  <button
                    aria-label="User menu"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-200 transition"
                  >
                    <span className="text-indigo-700 font-bold">👤</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-4 items-center">
                <Link href="/create-account" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">Create Account</Link>
                <Link href="/sign-in" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">Sign In</Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
