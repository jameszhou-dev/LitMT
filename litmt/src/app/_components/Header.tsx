"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

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
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        const adminVal = user?.isadmin;
        const adminTruthy = adminVal === true || adminVal === "true" || adminVal === 1 || adminVal === "1";
        setIsAdmin(Boolean(adminTruthy));
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
          const user = JSON.parse(updatedUserData);
          setIsLoggedIn(true);
          const adminVal = user?.isadmin;
          const adminTruthy = adminVal === true || adminVal === "true" || adminVal === 1 || adminVal === "1";
          setIsAdmin(Boolean(adminTruthy));
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
          const user = JSON.parse(updatedUserData);
          setIsLoggedIn(true);
          const adminVal = user?.isadmin;
          const adminTruthy = adminVal === true || adminVal === "true" || adminVal === 1 || adminVal === "1";
          setIsAdmin(Boolean(adminTruthy));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    const handleUserLoggedOut = () => {
      setIsLoggedIn(false);
      setIsAdmin(false);
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
      localStorage.removeItem("token");
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

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const linkBase = "text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded";
  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={`${linkBase} ${pathname === href ? "text-indigo-700" : "text-gray-700 hover:text-indigo-600"}`}
    >
      {label}
    </Link>
  );

  return (
    <header>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:bg-white focus:text-indigo-700 focus:px-3 focus:py-2 focus:rounded focus:shadow">
        Skip to content
      </a>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-lg" : "bg-transparent"}`}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-serif font-bold text-indigo-700 hover:text-indigo-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              LitMT
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {!loading && isLoggedIn && (
                <>
                  {navLink("/library", "Library")}
                  {navLink("/reading-list", "Reading List")}
                  {navLink("/reading-list", "Suggest a Book")}
                  {isAdmin && (
                    <>
                      {navLink("/managebooks", "Manage Books")}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="sr-only">Toggle menu</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            {/* Auth area (desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {!loading && (
                isLoggedIn ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      aria-label="User menu"
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                      className="p-1 text-gray-700 hover:text-indigo-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                    >
                      <span
                        aria-hidden="true"
                        className="block w-6 h-6"
                        style={{
                          WebkitMaskImage: 'url(/profile.svg)',
                          maskImage: 'url(/profile.svg)',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          backgroundColor: 'currentColor',
                        }}
                      />
                    </button>
                    {menuOpen && (
                      <div role="menu" aria-label="User menu" className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        {isAdmin && (
                          <>
                            <Link
                              href="/managebooks"
                              role="menuitem"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                              onClick={() => setMenuOpen(false)}
                            >
                              Manage Books
                            </Link>
                          
                            <hr className="my-1" />
                          </>
                        )}
                        <Link
                          href="/profile"
                          role="menuitem"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <Link href="/create-account" className={`${linkBase} text-indigo-700 hover:text-indigo-800`}>
                      Create Account
                    </Link>
                    <Link href="/sign-in" className={`${linkBase} text-indigo-700 hover:text-indigo-800`}>
                      Sign In
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mobile menu panel */}
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-indigo-100 bg-white/95 backdrop-blur">
            <div className="px-6 py-3 space-y-2">
              {!loading && (
                isLoggedIn ? (
                  <>
                    <Link href="/library" className="block px-2 py-2 text-gray-800 hover:text-indigo-700" onClick={() => setMobileOpen(false)}>
                      Library
                    </Link>
                    <Link href="/reading-list" className="block px-2 py-2 text-gray-800 hover:text-indigo-700" onClick={() => setMobileOpen(false)}>
                      Reading List
                    </Link>
                    <Link href="/reading-list" className="block px-2 py-2 text-gray-800 hover:text-indigo-700" onClick={() => setMobileOpen(false)}>
                      Suggest a Book
                    </Link>
                    {isAdmin && (
                      <>
                        <Link href="/managebooks" className="block px-2 py-2 text-gray-800 hover:text-indigo-700" onClick={() => setMobileOpen(false)}>
                          Manage Books
                        </Link>
                      
                      </>
                    )}
                    <button onClick={() => { setMobileOpen(false); setMenuOpen(true); }} className="block px-2 py-2 text-gray-800 hover:text-indigo-700">
                      Account
                    </button>
                    <button onClick={handleLogout} className="block px-2 py-2 text-red-600 hover:text-red-700">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/create-account" className="block px-2 py-2 text-indigo-700" onClick={() => setMobileOpen(false)}>
                      Create Account
                    </Link>
                    <Link href="/sign-in" className="block px-2 py-2 text-indigo-700" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
