"use client";

import { useEffect, useState } from "react";
import Header from "../_components/Header";

export default function ProfilePage() {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    try {
      const data = localStorage.getItem("user");
      if (data) {
        const user = JSON.parse(data);
        setUsername(user?.username || "");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-28 px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-6">Your Profile</h1>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-gray-700">
              Username: <span className="font-semibold">{username || "(unknown)"}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">More profile details coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
