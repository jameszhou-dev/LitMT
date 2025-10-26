"use client";

import Header from "../_components/Header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReadingListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"books" | "comments">("books");

  useEffect(() => {
    // Align with Library guard: allow if localStorage has user and isLoggedIn === "true"
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const isFlag = typeof window !== "undefined" ? localStorage.getItem("isLoggedIn") : null;
    const loggedIn = Boolean(user && isFlag === "true");
    setIsLoggedIn(loggedIn);
    setLoading(false);
    if (!loggedIn) {
      router.replace("/sign-in");
    }
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Your Reading List</h1>
            <div className="w-16 h-1 bg-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading…</p>
          </div>
        </section>
        <section className="bg-white px-6 pb-12">
          <div className="mx-auto max-w-6xl"></div>
        </section>
      </main>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Top band gradient to match Library page */}
      <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Your Reading List</h1>
          <div className="w-16 h-1 bg-indigo-600"></div>
        </div>
      </section>

      {/* Content on solid white */}
      <section className="bg-white px-6 pb-12">
        <div className="mx-auto max-w-6xl">
          {/* Tabs */}
          <div role="tablist" aria-label="Reading list tabs" className="border-b border-gray-200 mb-8">
            <div className="flex gap-6">
              <button
                role="tab"
                aria-selected={activeTab === "books"}
                aria-controls="tab-panel-books"
                id="tab-books"
                onClick={() => setActiveTab("books")}
                className={`-mb-px py-3 text-base font-semibold focus:outline-none border-b-2 transition-colors ${
                  activeTab === "books"
                    ? "text-indigo-700 border-indigo-600"
                    : "text-gray-600 border-transparent hover:text-indigo-700"
                }`}
              >
                Books
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "comments"}
                aria-controls="tab-panel-comments"
                id="tab-comments"
                onClick={() => setActiveTab("comments")}
                className={`-mb-px py-3 text-base font-semibold focus:outline-none border-b-2 transition-colors ${
                  activeTab === "comments"
                    ? "text-indigo-700 border-indigo-600"
                    : "text-gray-600 border-transparent hover:text-indigo-700"
                }`}
              >
                Comments
              </button>
            </div>
          </div>

          {/* Panels */}
          {activeTab === "books" && (
            <div role="tabpanel" id="tab-panel-books" aria-labelledby="tab-books" className="mt-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-gray-600 mb-2">You haven’t added any books yet.</p>
                <p className="text-gray-500">
                  Browse the {" "}
                  <Link href="/library" className="text-indigo-700 hover:underline">
                    Library
                  </Link>{" "}
                  to add some.
                </p>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div role="tabpanel" id="tab-panel-comments" aria-labelledby="tab-comments" className="mt-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-gray-600 mb-2">No comments yet.</p>
                <p className="text-gray-500">Comments you make on books or translations will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
