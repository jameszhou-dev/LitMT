"use client";
import { useEffect, useState } from "react";
import Header from "../_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function SuggestBookPage() {
  const [authorized, setAuthorized] = useState<null | boolean>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      // Require a real JWT for submitting suggestions
      if (!user || !token) {
        setAuthorized(false);
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return;
      }
      setAuthorized(true);
    } catch {
      setAuthorized(false);
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    }
  }, []);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setOriginalLanguage("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be signed in to suggest a book.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || undefined,
          original_language: originalLanguage.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to submit suggestion (${res.status})`);
      }

      setSuccess("Thanks! Your suggestion was sent to the LitMT team.");
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Something went wrong while submitting your suggestion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Top band gradient */}
      <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Suggest a Book</h1>
          <div className="w-16 h-1 bg-indigo-600 mb-4" />
          {authorized !== true && (
            <p className="text-gray-600">Checking permissions…</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-white px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          {authorized === true && (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter the book title"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="author" className="block text-sm font-semibold text-gray-900 mb-2">
                    Author (optional)
                  </label>
                  <input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Enter the author name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="originalLanguage" className="block text-sm font-semibold text-gray-900 mb-2">
                    Original Language (optional)
                  </label>
                  <input
                    id="originalLanguage"
                    type="text"
                    value={originalLanguage}
                    onChange={(e) => setOriginalLanguage(e.target.value)}
                    placeholder="e.g., Spanish, Chinese"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                    Why this book? (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Share context, links to public domain source, or why it matters."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting…" : "Submit Suggestion"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
