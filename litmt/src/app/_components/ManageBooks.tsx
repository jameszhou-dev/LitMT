// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const envBackend = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
const isPlaceholder = /your-backend-domain\.com/i.test(envBackend);
const rawBackend = envBackend && !isPlaceholder ? envBackend : "http://127.0.0.1:8080";
const withProtocol = /^https?:\/\//i.test(rawBackend) ? rawBackend : `http://${rawBackend}`;
const BACKEND_URL = withProtocol.replace(/\/$/, "");
const apiUrl = (path) => `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

type Translation = {
	id: string;
	language: string;
	filename?: string;
	file_id?: string | null;
    translated_by?: string | null;
};

type Book = {
	id: string;
	title: string;
	author?: string;
	year?: number;
	description?: string;
	original_language?: string;
	source?: string;
    source_filename?: string;
    source_file_id?: string | null;
	translated_books: Translation[];
};

export default function ManageBooks() {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>("");
    const [isAdmin, setIsAdmin] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<any>({
		title: "",
		author: "",
		year: "",
		description: "",
		original_language: "",
	});
	const [saving, setSaving] = useState(false);
	const [editSourceFile, setEditSourceFile] = useState<File | null>(null);
	const [uploadingSource, setUploadingSource] = useState(false);
	const [translationFiles, setTranslationFiles] = useState<Record<string, File | null>>({});
	const [uploadingTrans, setUploadingTrans] = useState<Record<string, boolean>>({});

	useEffect(() => {
		async function load() {
                // derive admin flag from localStorage for UI hints
                try {
                    const raw = localStorage.getItem("user");
                    if (raw) {
                        const u = JSON.parse(raw);
                        setIsAdmin(!!u?.isadmin);
                    }
                } catch {}
			try {
				const url = apiUrl("/api/books");
				console.log("Fetching books from:", url);
				const res = await fetch(url);
				if (!res.ok) throw new Error(`Failed to load books: ${res.status}`);
				const data = await res.json();
				setBooks(data);
			} catch (e: any) {
				console.error("Books load error:", e);
				setError((e?.message || "Failed to load books") + ` (backend: ${BACKEND_URL})`);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	const startEdit = (b: Book) => {
		setEditingId(b.id);
		setEditForm({
			title: b.title || "",
			author: b.author || "",
			year: b.year ?? "",
			description: b.description || "",
			original_language: b.original_language || "",
		});
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditForm({ title: "", author: "", year: "", description: "", original_language: "" });
	};

	const saveEdit = async (id: string) => {
		const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
		if (!token) {
			alert('You must be logged in as admin to update books.');
			return;
		}
		try {
			setSaving(true);
			const payload: any = {
				title: editForm.title?.trim(),
				author: editForm.author?.trim() || undefined,
				description: editForm.description?.trim() || undefined,
				original_language: editForm.original_language?.trim() || undefined,
			};

			const uploadOriginalSource = async (book: Book) => {
				const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
				if (!token) {
					alert('You must be logged in as admin to upload the original source.');
					return;
				}
				if (!editSourceFile) {
					alert('Please choose a .txt file to upload.');
					return;
				}
				try {
					setUploadingSource(true);
					const fd = new FormData();
					fd.append('file', editSourceFile);
					const res = await fetch(apiUrl(`/api/books/${book.id}/source`), {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${token}`,
						},
						body: fd,
					});
					if (!res.ok) {
						const txt = await res.text();
						throw new Error(`Upload failed (${res.status}): ${txt}`);
					}
					const data = await res.json();
					setBooks((prev) => prev.map((bk) => bk.id === book.id ? { ...bk, source_filename: data.source_filename, source_file_id: data.source_file_id } : bk));
					setEditSourceFile(null);
					alert('Original source uploaded.');
				} catch (e: any) {
					console.error('Source upload error', e);
					alert(e?.message || 'Failed to upload source file');
				} finally {
					setUploadingSource(false);
				}
			};

			const onTranslationFileChange = (tid: string, file: File | null) => {
				setTranslationFiles((prev) => ({ ...prev, [tid]: file }));
			};

			const replaceTranslationFile = async (book: Book, t: Translation) => {
				const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
				if (!token) {
					alert('You must be logged in as admin to upload translation files.');
					return;
				}
				const file = translationFiles[t.id] || null;
				if (!file) {
					alert('Choose a .txt file first.');
					return;
				}
				try {
					setUploadingTrans((prev) => ({ ...prev, [t.id]: true }));
					const fd = new FormData();
					fd.append('file', file);
					const res = await fetch(apiUrl(`/api/translations/${t.id}/file`), {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${token}` },
						body: fd,
					});
					if (!res.ok) {
						const txt = await res.text();
						throw new Error(`Upload failed (${res.status}): ${txt}`);
					}
					const updated = await res.json();
					setBooks((prev) => prev.map((bk) => {
						if (bk.id !== book.id) return bk;
						return {
							...bk,
							translated_books: bk.translated_books.map((tt) => tt.id === t.id ? { ...tt, filename: updated.filename, file_id: updated.file_id } : tt)
						}
					}));
					setTranslationFiles((prev) => ({ ...prev, [t.id]: null }));
					alert('Translation file updated.');
				} catch (e: any) {
					console.error('Replace translation error', e);
					alert(e?.message || 'Failed to upload translation file');
				} finally {
					setUploadingTrans((prev) => ({ ...prev, [t.id]: false }));
				}
			};
			const yr = parseInt(String(editForm.year), 10);
			if (!Number.isNaN(yr)) payload.year = yr;

			const res = await fetch(apiUrl(`/api/books/${id}`), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const txt = await res.text();
				throw new Error(`Update failed (${res.status}): ${txt}`);
			}
			const updated = await res.json();
			setBooks((prev) => prev.map((bk) => (bk.id === id ? { ...bk, ...updated } : bk)));
			cancelEdit();
		} catch (e: any) {
			console.error('Save error', e);
			alert(e?.message || 'Failed to save changes');
		} finally {
			setSaving(false);
		}
	};

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
			<header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
				{isAdmin && (
					<Link
						href="/managebooks/addbook"
						style={{
							padding: "10px 16px",
							backgroundColor: "#2196F3",
							color: "white",
							borderRadius: 6,
							textDecoration: "none",
							fontWeight: 600,
						}}
					>
						+ Add Book
					</Link>
				)}
			</header>

			{loading && <p>Loading...</p>}
			{error && (
				<div style={{ background: "#ffebee", padding: 12, border: "1px solid #ef5350", color: "#c62828", borderRadius: 4 }}>
					<div style={{ fontWeight: 700, marginBottom: 6 }}>Load failed</div>
					<div>{error}</div>
					<div style={{ marginTop: 6, fontSize: 12, color: "#7f1d1d" }}>Check NEXT_PUBLIC_BACKEND_URL and that the backend is running.</div>
				</div>
			)}

			{!loading && !error && books.length === 0 && (
				<p>No books yet. Click "Add Book" to create your first one.</p>
			)}

			<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
				{books.map((b) => (
					<div key={b.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div style={{ flex: 1, minWidth: 0 }}>
								{editingId === b.id ? (
									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
										<label style={{ display: 'flex', flexDirection: 'column' }}>
											<span style={{ fontSize: 12, color: '#555' }}>Title</span>
											<input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
										</label>
										<label style={{ display: 'flex', flexDirection: 'column' }}>
											<span style={{ fontSize: 12, color: '#555' }}>Author</span>
											<input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} />
										</label>
										<label style={{ display: 'flex', flexDirection: 'column' }}>
											<span style={{ fontSize: 12, color: '#555' }}>Year</span>
											<input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} />
										</label>
										<label style={{ display: 'flex', flexDirection: 'column' }}>
											<span style={{ fontSize: 12, color: '#555' }}>Language</span>
											<input value={editForm.original_language} onChange={(e) => setEditForm({ ...editForm, original_language: e.target.value })} />
										</label>
										<label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
											<span style={{ fontSize: 12, color: '#555' }}>Description</span>
											<textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
										</label>

										{/* Original Source uploader */}
										<div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<div style={{ fontWeight: 600 }}>Original Source (.txt)</div>
												<div style={{ fontSize: 12, color: '#555' }}>
													Current: {b.source_filename || '— None —'}
													{` `}
													<a href={apiUrl(`/api/books/${b.id}/source`)} target="_blank" rel="noreferrer">View</a>
												</div>
											</div>
											<div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
												<input type="file" accept=".txt,text/plain" onChange={(e) => setEditSourceFile(e.target.files?.[0] || null)} />
												<button disabled={uploadingSource} onClick={() => uploadOriginalSource(b)} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 600 }}>
													{uploadingSource ? 'Uploading…' : 'Upload'}
												</button>
											</div>
										</div>

										{/* Translation file replace section */}
										<div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
											<div style={{ fontWeight: 600, marginBottom: 8 }}>Translations</div>
											{(b.translated_books && b.translated_books.length > 0) ? (
												<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
													{b.translated_books.map((t) => (
														<div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
															<div style={{ fontSize: 14 }}>
																<strong>{t.language}</strong>
																{t.filename ? ` • ${t.filename}` : ''}
																{t.file_id && (
																	<>
																		{' '}
																		<a href={apiUrl(`/api/translations/${t.id}/view`)} target="_blank" rel="noreferrer">View</a>
																		{' | '}
																		<a href={apiUrl(`/api/translations/${t.id}/file`)}>Download</a>
																	</>
																)}
															</div>
															<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
																<input type="file" accept=".txt,text/plain" onChange={(e) => onTranslationFileChange(t.id, e.target.files?.[0] || null)} />
																<button disabled={!!uploadingTrans[t.id]} onClick={() => replaceTranslationFile(b, t)} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 600 }}>
																	{uploadingTrans[t.id] ? 'Uploading…' : 'Replace file'}
																</button>
															</div>
														</div>
													))}
												</div>
											) : (
												<p style={{ color: '#666' }}>No translations yet.</p>
											)}
										</div>
									</div>
								) : (
									<>
										<h3 style={{ margin: 0 }}>{b.title}</h3>
										<p style={{ margin: 0, color: "#666" }}>
											{b.author ? `${b.author}` : "Unknown author"}
											{b.year ? ` • ${b.year}` : ""}
											{b.original_language ? ` • ${b.original_language}` : ""}
										</p>
									</>
								)}
							</div>
						</div>
						{editingId === b.id ? null : (b.description && <p style={{ marginTop: 8 }}>{b.description}</p>)}

						<details style={{ marginTop: 8 }}>
							<summary>Translations ({b.translated_books?.length || 0})</summary>
							{b.translated_books && b.translated_books.length > 0 ? (
								<ul>
									{b.translated_books.map((t) => (
										<li key={t.id}>
											<strong>{t.language}</strong>
											{t.file_id && (
												<>
													{" "}
													<a href={apiUrl(`/api/translations/${t.id}/view`)} target="_blank" rel="noreferrer">
														View
													</a>
													{" | "}
													<a href={apiUrl(`/api/translations/${t.id}/file`)}>
														Download
													</a>
												</>
											)}
										</li>
									))}
								</ul>
							) : (
								<p style={{ color: "#666" }}>No translations yet.</p>
							)}
						</details>

						{isAdmin && (
							<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
								{editingId === b.id ? (
									<>
										<button disabled={saving} onClick={() => saveEdit(b.id)} style={{ padding: '8px 12px', background: '#16a34a', color: 'white', borderRadius: 6, fontWeight: 600 }}>
											{saving ? 'Saving…' : 'Save'}
										</button>
										<button disabled={saving} onClick={cancelEdit} style={{ padding: '8px 12px', background: '#e5e7eb', color: '#111827', borderRadius: 6, fontWeight: 600 }}>
											Cancel
										</button>
									</>
								) : (
									<button onClick={() => startEdit(b)} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', borderRadius: 6, fontWeight: 600 }}>
										Edit
									</button>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Debug footer (visible in dev) */}
			<div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>Backend: {BACKEND_URL}</div>
		</main>
	);
}
