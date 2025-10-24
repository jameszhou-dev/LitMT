"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

interface Translation {
  id: string;
  book_id: string;
  language: string;
  filename: string;
  text?: string | null;
  file_id?: string | null;
  translated_by?: string | null;
}

interface BookDetail {
  id: string;
  title: string;
  author?: string;
  year?: number;
  description?: string;
  source?: string;
  original_language?: string;
  translated_books: Translation[];
}

export default function BookPage() {
  const params = useParams<{ id: string }>();
  const bookId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : params?.id), [params]);

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      setLoading(true);
      setError(null);
      try {
        // No dedicated GET /books/{id} endpoint, so fetch all and filter
        const res = await fetch(`${BACKEND_URL}/api/books`);
        if (!res.ok) throw new Error(`Failed to fetch books (${res.status})`);
        const data: BookDetail[] = await res.json();
        const found = data.find((b) => b.id === bookId);
        if (!found) {
          setError("Book not found.");
          setBook(null);
        } else {
          setBook(found);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load book.");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Top band gradient */}
      <section className="pt-28 pb-8 px-6 bg-gradient-to-b from-indigo-100 to-white">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="py-8 text-gray-600">Loading book…</div>
          ) : error ? (
            <div className="py-8 text-red-700">{error}</div>
          ) : (
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">
                {book?.title}
              </h1>
              <div className="w-16 h-1 bg-indigo-600 mb-4" />
              <p className="text-gray-700">
                {book?.author ? (
                  <>
                    by <span className="font-semibold">{book.author}</span>
                  </>
                ) : (
                  <span className="italic text-gray-500">Unknown author</span>
                )}
                {book?.year ? <span className="text-gray-500"> · {book.year}</span> : null}
                {book?.original_language ? (
                  <span className="ml-2 text-sm text-gray-600">
                    (Original: <span className="font-medium text-indigo-700">{book.original_language}</span>)
                  </span>
                ) : null}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="bg-white px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          {!loading && !error && book && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left: Book meta */}
              <div className="md:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">About this book</h2>
                  {book.description ? (
                    <p className="text-gray-700 leading-relaxed">{book.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided.</p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Translations</h2>
                    <span className="text-sm text-gray-600">
                      {book.translated_books?.length || 0} available
                    </span>
                  </div>

                  {book.translated_books && book.translated_books.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {book.translated_books.map((t) => (
                        <li key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{t.language}</p>
                            {t.filename ? (
                              <p className="text-sm text-gray-500">{t.filename}</p>
                            ) : null}
                            {t.translated_by ? (
                              <p className="text-xs text-gray-500 mt-1">Translated by: <span className="font-medium">{t.translated_by}</span></p>
                            ) : null}
                          </div>
                          <div className="flex gap-3">
                            <a
                              href={`${BACKEND_URL}/api/translations/${t.id}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                              View
                            </a>
                            <a
                              href={`${BACKEND_URL}/api/translations/${t.id}/file`}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                              Download
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No translations uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Right: Original source */}
              <aside>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Original Source</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View the original text of this book. Large texts open in a new tab.
                  </p>
                  <a
                    href={`${BACKEND_URL}/api/books/${book.id}/source`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition"
                  >
                    View Original
                  </a>
                </div>
              </aside>
            </div>
          )}

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link href="/library" className="text-indigo-600 font-semibold hover:text-indigo-700">
              ← Back to Library
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
