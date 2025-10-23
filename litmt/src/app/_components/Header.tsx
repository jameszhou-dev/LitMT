"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-white shadow-lg" : "bg-transparent"
    }`}>
      <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-serif font-bold text-indigo-600 hover:text-indigo-700 transition">
          LitMT
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <a href="#about" className="text-sm text-gray-700 hover:text-indigo-600 transition">About</a>
          <a href="#ethics" className="text-sm text-gray-700 hover:text-indigo-600 transition">Ethics</a>
          <a href="#research" className="text-sm text-gray-700 hover:text-indigo-600 transition">Research</a>
          <a href="#community" className="text-sm text-gray-700 hover:text-indigo-600 transition">Community</a>
          <a href="#team" className="text-sm text-gray-700 hover:text-indigo-600 transition">Team</a>
        </div>
      </div>
    </nav>
  );
}
