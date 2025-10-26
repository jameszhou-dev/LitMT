"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../_components/Header";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin editing states
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: "", author: "", year: "", original_language: "" });
  const [savingMeta, setSavingMeta] = useState(false);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descForm, setDescForm] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [uploadingSource, setUploadingSource] = useState(false);

  const [translationFiles, setTranslationFiles] = useState<Record<string, File | null>>({});
  const [uploadingTrans, setUploadingTrans] = useState<Record<string, boolean>>({});

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

  // Determine admin from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user");
        if (raw) {
          const u = JSON.parse(raw);
          const admin = u?.isadmin === true || u?.isadmin === "true" || u?.isadmin === 1 || u?.is_admin === true || u?.is_admin === "true";
          setIsAdmin(!!admin);
        }
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  // Handlers for admin edits
  const startEditMeta = () => {
    if (!book) return;
    setMetaForm({
      title: book.title || "",
      author: book.author || "",
      year: book.year ? String(book.year) : "",
      original_language: book.original_language || "",
    });
    setEditingMeta(true);
  };
  const cancelEditMeta = () => setEditingMeta(false);
  const saveMeta = async () => {
    if (!book) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("You must be logged in as admin to update books.");
      return;
    }
    try {
      setSavingMeta(true);
      const payload: any = {
        title: metaForm.title?.trim(),
        author: metaForm.author?.trim() || undefined,
        original_language: metaForm.original_language?.trim() || undefined,
      };
      const yr = parseInt(String(metaForm.year), 10);
      if (!Number.isNaN(yr)) payload.year = yr;
      const res = await fetch(`${BACKEND_URL}/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Update failed (${res.status}): ${txt}`);
      }
      const updated = await res.json();
      setBook((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditingMeta(false);
    } catch (e: any) {
      alert(e?.message || "Failed to save changes");
    } finally {
      setSavingMeta(false);
    }
  };

  const startEditDesc = () => {
    if (!book) return;
    setDescForm(book.description || "");
    setEditingDesc(true);
  };
  const cancelEditDesc = () => setEditingDesc(false);
  const saveDesc = async () => {
    if (!book) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("You must be logged in as admin to update books.");
      return;
    }
    try {
      setSavingDesc(true);
      const payload: any = { description: (descForm || "").trim() || null };
      const res = await fetch(`${BACKEND_URL}/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Update failed (${res.status}): ${txt}`);
      }
      const updated = await res.json();
      setBook((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditingDesc(false);
    } catch (e: any) {
      alert(e?.message || "Failed to save description");
    } finally {
      setSavingDesc(false);
    }
  };

  const uploadOriginalSource = async () => {
    if (!book) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("You must be logged in as admin to upload the original source.");
      return;
    }
    if (!sourceFile) {
      alert("Please choose a .txt file to upload.");
      return;
    }
    try {
      setUploadingSource(true);
      const fd = new FormData();
      fd.append("file", sourceFile);
      const res = await fetch(`${BACKEND_URL}/api/books/${book.id}/source`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed (${res.status}): ${txt}`);
      }
      // No immediate UI change required beyond success toast
      alert("Original source uploaded.");
      setSourceFile(null);
    } catch (e: any) {
      alert(e?.message || "Failed to upload source file");
    } finally {
      setUploadingSource(false);
    }
  };

  const onTranslationFileChange = (tid: string, file: File | null) => {
    setTranslationFiles((prev) => ({ ...prev, [tid]: file }));
  };
  const replaceTranslationFile = async (tid: string) => {
    if (!book) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("You must be logged in as admin to upload translation files.");
      return;
    }
    const file = translationFiles[tid] || null;
    if (!file) {
      alert("Choose a .txt file first.");
      return;
    }
    try {
      setUploadingTrans((prev) => ({ ...prev, [tid]: true }));
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BACKEND_URL}/api/translations/${tid}/file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed (${res.status}): ${txt}`);
      }
      const updated = await res.json();
      setBook((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          translated_books: prev.translated_books.map((t) =>
            t.id === tid ? { ...t, filename: updated.filename, file_id: updated.file_id } : t
          ),
        };
      });
      setTranslationFiles((p) => ({ ...p, [tid]: null }));
      alert("Translation file updated.");
    } catch (e: any) {
      alert(e?.message || "Failed to upload translation file");
    } finally {
      setUploadingTrans((prev) => ({ ...prev, [tid]: false }));
    }
  };

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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
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
                {isAdmin && (
                  <button
                    onClick={startEditMeta}
                    className="mt-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Edit details
                  </button>
                )}
              </div>

              {isAdmin && editingMeta && (
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Title</span>
                      <input className="border rounded-md px-3 py-2" value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Author</span>
                      <input className="border rounded-md px-3 py-2" value={metaForm.author} onChange={(e) => setMetaForm({ ...metaForm, author: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Year</span>
                      <input className="border rounded-md px-3 py-2" value={metaForm.year} onChange={(e) => setMetaForm({ ...metaForm, year: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-600">Original Language</span>
                      <input className="border rounded-md px-3 py-2" value={metaForm.original_language} onChange={(e) => setMetaForm({ ...metaForm, original_language: e.target.value })} />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={saveMeta} disabled={savingMeta} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-60">
                      {savingMeta ? "Saving…" : "Save"}
                    </button>
                    <button onClick={cancelEditMeta} disabled={savingMeta} className="px-4 py-2 border border-gray-300 rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Description</h2>
                    {isAdmin && !editingDesc && (
                      <button onClick={startEditDesc} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md">Edit</button>
                    )}
                  </div>
                  {!isAdmin || !editingDesc ? (
                    book?.description ? (
                      <p className="mt-3 text-gray-700 leading-relaxed">{book.description}</p>
                    ) : (
                      <p className="mt-3 text-gray-500 italic">No description provided.</p>
                    )
                  ) : (
                    <div className="mt-3">
                      <textarea rows={5} className="w-full border rounded-md px-3 py-2" value={descForm} onChange={(e) => setDescForm(e.target.value)} />
                      <div className="mt-3 flex justify-end gap-3">
                        <button onClick={saveDesc} disabled={savingDesc} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-60">
                          {savingDesc ? "Saving…" : "Save"}
                        </button>
                        <button onClick={cancelEditDesc} disabled={savingDesc} className="px-4 py-2 border border-gray-300 rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
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
                        <li key={t.id} className="py-4 flex flex-row items-start justify-between gap-4">
                          {/* Left: translation info + admin upload underneath */}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{t.language}</p>
                            {t.filename ? (
                              <p className="text-sm text-gray-500">{t.filename}</p>
                            ) : null}
                            {t.translated_by ? (
                              <p className="text-xs text-gray-500 mt-1">Translated by: <span className="font-medium">{t.translated_by}</span></p>
                            ) : null}
                            {isAdmin && (
                              <div className="mt-3 flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <input
                                    id={`upload-${t.id}`}
                                    type="file"
                                    accept=".txt,text/plain"
                                    onChange={(e) => onTranslationFileChange(t.id, e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`upload-${t.id}`}
                                    className="inline-flex items-center px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100 cursor-pointer shadow-sm"
                                  >
                                    Choose file
                                  </label>
                                  <span className="text-sm text-gray-700 truncate max-w-[240px]">
                                    {translationFiles[t.id]?.name || "No file chosen"}
                                  </span>
                                </div>
                                <button
                                  onClick={() => replaceTranslationFile(t.id)}
                                  disabled={!!uploadingTrans[t.id]}
                                  className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-md disabled:opacity-60 w-max"
                                >
                                  {uploadingTrans[t.id] ? "Uploading…" : "Upload new translation"}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Right: actions aligned at the far right */}
                          <div className="flex gap-3 self-start justify-end">
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
                    View the original text of this book.
                  </p>
                  <a
                    href={`${BACKEND_URL}/api/books/${book.id}/source`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition"
                  >
                    View Original
                  </a>
                  {isAdmin && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          id={`source-upload-${book.id}`}
                          type="file"
                          accept=".txt,text/plain"
                          onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor={`source-upload-${book.id}`}
                          className="inline-flex items-center px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100 cursor-pointer shadow-sm"
                        >
                          Choose file
                        </label>
                        <span className="text-sm text-gray-700 truncate max-w-[240px]">
                          {sourceFile?.name || "No file chosen"}
                        </span>
                      </div>
                      <button onClick={uploadOriginalSource} disabled={uploadingSource} className="self-start px-3 py-2 text-sm bg-emerald-600 text-white rounded-md disabled:opacity-60">
                        {uploadingSource ? "Uploading…" : "Upload new source"}
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
