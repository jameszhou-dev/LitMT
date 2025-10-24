"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

interface Book {
  _id: string;
  title: string;
  author: string;
  description?: string;
  original_language?: string;
  cover_image_url?: string;
  created_at?: string;
}

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${BACKEND_URL}/api/books`);

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }

      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(`Failed to load books. Make sure the backend is running at ${BACKEND_URL}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      (book.original_language && book.original_language.toLowerCase().includes(query))
    );
  });

  return (
    <main className="min-h-screen">
      <Header />

      {/* Top band gradient */}
      <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">
              Book Library
            </h1>
            <div className="w-16 h-1 bg-indigo-600 mb-4"></div>
            <p className="text-lg text-gray-700">
              Explore our collection of translated literary works from around the world
            </p>
          </div>
        </div>
      </section>

      {/* Content section on solid white to avoid global gradient showing below */}
      <section className="bg-white px-6 pb-12">
        <div className="mx-auto max-w-6xl">

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search by title, author, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-lg"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading books...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {searchQuery
                  ? "No books found matching your search."
                  : "No books available yet."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-6 py-2 text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Books Grid */}
          {!loading && filteredBooks.length > 0 && (
            <>
              <p className="text-gray-600 mb-6">
                Showing {filteredBooks.length} of {books.length} books
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <div key={book._id}>
                    <Link href={`/book/${book._id}`}>
                      <div className="bg-white border border-indigo-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-600 transition cursor-pointer h-full flex flex-col">
                      {/* Cover Image Placeholder */}
                      <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-6xl">📚</div>
                      </div>

                      {/* Book Info */}
                      <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-gray-700 font-semibold mb-3">
                        by {book.author}
                      </p>

                      {book.original_language && (
                        <p className="text-sm text-gray-600 mb-3">
                          Original Language:{" "}
                          <span className="font-semibold text-indigo-600">
                            {book.original_language}
                          </span>
                        </p>
                      )}

                      {book.description && (
                        <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-grow">
                          {book.description}
                        </p>
                      )}

                      <button className="mt-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                        View Translations
                      </button>
                    </div>
                  </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link href="/" className="text-indigo-600 font-semibold hover:text-indigo-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
