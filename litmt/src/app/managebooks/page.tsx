"use client";
import { useEffect, useState } from "react";
import ManageBooks from "../_components/ManageBooks";
import Header from "../_components/Header";

export default function ManageBooksPage() {
  const [authorized, setAuthorized] = useState<null | boolean>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        // Not logged in: send to sign-in
        window.location.href = "/sign-in";
        setAuthorized(false);
        return;
      }
      const user = JSON.parse(raw);
      const isAdmin = user?.isadmin === true || user?.isadmin === "true" || user?.isadmin === 1;
      if (isAdmin) {
        setAuthorized(true);
      } else {
        // Not an admin: deny and redirect home
        setAuthorized(false);
        window.location.href = "/";
      }
    } catch {
      setAuthorized(false);
      window.location.href = "/";
    }
  }, []);

  if (authorized !== true) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Manage Books</h1>
            <div className="w-16 h-1 bg-indigo-600 mb-4" />
            <p className="text-gray-600">Checking permissions…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Manage Books</h1>
          <div className="w-16 h-1 bg-indigo-600 mb-4" />
        </div>
      </section>
      <section className="bg-white px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <ManageBooks />
        </div>
      </section>
    </main>
  );
}
