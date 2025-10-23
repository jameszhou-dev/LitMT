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
};

type Book = {
	id: string;
	title: string;
	author?: string;
	year?: number;
	description?: string;
	source?: string;
	translated_books: Translation[];
};

export default function ManageBooks() {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		async function load() {
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

	return (
		<main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
			<header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
				<div>
					<h1 style={{ margin: 0 }}>📚 Manage Books</h1>
					<p style={{ margin: 0, color: "#666" }}>View all books and their translations</p>
				</div>
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
							<div>
								<h3 style={{ margin: 0 }}>{b.title}</h3>
								<p style={{ margin: 0, color: "#666" }}>
									{b.author ? `${b.author}` : "Unknown author"}
									{b.year ? ` • ${b.year}` : ""}
								</p>
							</div>
						</div>
						{b.description && <p style={{ marginTop: 8 }}>{b.description}</p>}

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
					</div>
				))}
			</div>

			{/* Debug footer (visible in dev) */}
			<div style={{ marginTop: 16, fontSize: 12, color: "#666" }}>Backend: {BACKEND_URL}</div>
		</main>
	);
}
