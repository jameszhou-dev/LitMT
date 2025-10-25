"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  original_language?: string;
  cover_image_url?: string;
  created_at?: string;
}

export default function Library() {
  const [authorized, setAuthorized] = useState<null | boolean>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("libraryViewMode");
    return (saved === "list" || saved === "grid") ? (saved as "grid" | "list") : "grid";
  });
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<
    | "title-asc"
    | "title-desc"
    | "author-asc"
    | "author-desc"
    | "language-asc"
    | "language-desc"
    | "created-desc"
    | "created-asc"
  >(() => {
    if (typeof window === "undefined") return "title-asc";
    const saved = localStorage.getItem("librarySortBy");
    const allowed = [
      "title-asc",
      "title-desc",
      "author-asc",
      "author-desc",
      "language-asc",
      "language-desc",
      "created-desc",
      "created-asc",
    ];
    return (saved && allowed.includes(saved)) ? (saved as any) : "title-asc";
  });

  useEffect(() => {
    // Auth guard: require logged-in user
    try {
      const user = localStorage.getItem("user");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!user || isLoggedIn !== "true") {
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
      return;
    }

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

  // Persist view preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("libraryViewMode", viewMode);
    }
  }, [viewMode]);

  // Persist sort preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("librarySortBy", sortBy);
    }
  }, [sortBy]);

  // Close sort menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      (book.original_language && book.original_language.toLowerCase().includes(query))
    );
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const safe = (v?: string) => (v || "").toLowerCase();
    switch (sortBy) {
      case "title-asc":
        return safe(a.title).localeCompare(safe(b.title));
      case "title-desc":
        return safe(b.title).localeCompare(safe(a.title));
      case "author-asc":
        return safe(a.author).localeCompare(safe(b.author));
      case "author-desc":
        return safe(b.author).localeCompare(safe(a.author));
      case "language-asc":
        return safe(a.original_language).localeCompare(safe(b.original_language));
      case "language-desc":
        return safe(b.original_language).localeCompare(safe(a.original_language));
      case "created-desc": {
        const ad = a.created_at ? Date.parse(a.created_at) : 0;
        const bd = b.created_at ? Date.parse(b.created_at) : 0;
        return bd - ad;
      }
      case "created-asc": {
        const ad = a.created_at ? Date.parse(a.created_at) : 0;
        const bd = b.created_at ? Date.parse(b.created_at) : 0;
        return ad - bd;
      }
      default:
        return 0;
    }
  });

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Top band gradient */}
      <section className="pt-28 pb-10 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">
              Library
            </h1>
            <div className="w-16 h-1 bg-indigo-600 mb-4"></div>
            {authorized !== true && (
              <p className="text-gray-600">Checking permissions…</p>
            )}
          </div>
        </div>
      </section>

      {/* Content section on solid white to avoid global gradient showing below */}
      <section className="bg-white px-6 pb-12">
        <div className="mx-auto max-w-6xl">
          {authorized !== true && (
            <div className="text-center py-12 text-gray-600">Redirecting to sign in…</div>
          )}

          {/* Search + View Toggle */}
          {authorized === true && (
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative" ref={sortRef}>
              <input
                type="text"
                placeholder="Search by title, author, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-lg"
              />
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                aria-label="Change sort order"
                onClick={() => setSortOpen((v) => !v)}
                className="absolute right-2 inset-y-0 my-auto p-2 rounded-md text-gray-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-7 h-7"
                  style={{
                    WebkitMaskImage: 'url(/filter.svg)',
                    maskImage: 'url(/filter.svg)',
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
              {sortOpen && (
                <div role="menu" aria-label="Sort options" className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'title-asc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('title-asc'); setSortOpen(false); }}
                  >
                    Title (A–Z)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'title-desc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('title-desc'); setSortOpen(false); }}
                  >
                    Title (Z–A)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'author-asc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('author-asc'); setSortOpen(false); }}
                  >
                    Author (A–Z)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'author-desc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('author-desc'); setSortOpen(false); }}
                  >
                    Author (Z–A)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'language-asc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('language-asc'); setSortOpen(false); }}
                  >
                    Language (A–Z)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'language-desc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('language-desc'); setSortOpen(false); }}
                  >
                    Language (Z–A)
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'created-desc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('created-desc'); setSortOpen(false); }}
                  >
                    Newest
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'created-asc' ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}
                    onClick={() => { setSortBy('created-asc'); setSortOpen(false); }}
                  >
                    Oldest
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`px-3 py-2 rounded-md border text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="block w-5 h-5"
                  style={{
                    WebkitMaskImage: 'url(/grid.svg)',
                    maskImage: 'url(/grid.svg)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    backgroundColor: 'currentColor',
                  }}
                />
                <span className="sr-only">Grid view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`px-3 py-2 rounded-md border text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="block w-5 h-5"
                  style={{
                    WebkitMaskImage: 'url(/list.svg)',
                    maskImage: 'url(/list.svg)',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    backgroundColor: 'currentColor',
                  }}
                />
                <span className="sr-only">List view</span>
              </button>
            </div>
          </div>
          )}

          {/* Error Message */}
          {authorized === true && error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {authorized === true && loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading books...</p>
            </div>
          )}

          {/* Empty State */}
          {authorized === true && !loading && filteredBooks.length === 0 && (
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

          {/* Books View */}
          {authorized === true && !loading && sortedBooks.length > 0 && (
            <>
              <p className="text-gray-600 mb-6">
                Showing {sortedBooks.length} of {books.length} books
              </p>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedBooks.map((book) => (
                    <div key={book.id}>
                      <Link href={`/book/${book.id}`}>
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
                            <p className="text-gray-700 text-sm mb-4 line-clamp-3 overflow-hidden flex-grow">
                              {book.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-gray-600 border-b border-gray-200">
                    <div className="col-span-6 sm:col-span-6">Title</div>
                    <div className="col-span-4 sm:col-span-4">Author</div>
                    <div className="col-span-2 sm:col-span-2">Language</div>
                  </div>
                  <ul>
                    {sortedBooks.map((book) => (
                      <li key={book.id} className="border-b last:border-b-0 border-gray-100 hover:bg-indigo-50/40 transition">
                        <Link href={`/book/${book.id}`} className="grid grid-cols-12 gap-2 px-4 py-4 items-center min-w-0">
                          <div className="col-span-6 sm:col-span-6 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-1 truncate">{book.title}</div>
                            {book.description && (
                              <div className="hidden sm:block text-xs text-gray-600 line-clamp-1 truncate">{book.description}</div>
                            )}
                          </div>
                          <div className="col-span-4 sm:col-span-4 text-sm text-gray-700 line-clamp-1 truncate min-w-0">
                            {book.author}
                          </div>
                          <div className="col-span-2 sm:col-span-2 text-sm">
                            {book.original_language ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {book.original_language}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
