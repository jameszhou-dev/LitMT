// @ts-nocheck
"use client";
import React, { useState } from "react";

// Resolve backend URL from environment (.env/.env.local)
const envBackend = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
const isPlaceholder = /your-backend-domain\.com/i.test(envBackend);
const rawBackend = envBackend && !isPlaceholder ? envBackend : "http://127.0.0.1:8080";
const withProtocol = /^https?:\/\//i.test(rawBackend) ? rawBackend : `http://${rawBackend}`;
const BACKEND_URL = withProtocol.replace(/\/$/, "");
const apiUrl = (path: string) => `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

export default function AddBook() {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [year, setYear] = useState("");
	const [description, setDescription] = useState("");
	const [source, setSource] = useState("");
	const [translations, setTranslations] = useState([
		{ language: "", filename: "", file: null },
	]);
	const [status, setStatus] = useState("");

	const addTranslationRow = () => setTranslations([...translations, { language: "", filename: "", file: null }]);
	const removeTranslationRow = (i) => setTranslations(translations.filter((_, idx) => idx !== i));
	const updateTranslation = (i, field, value) => {
		const copy = [...translations];
		copy[i][field] = value;
		setTranslations(copy);
	};

	async function handleSubmit(e) {
		e.preventDefault();
		setStatus("Creating book...");
		const bookBody = {
			title,
			author,
			year: year ? parseInt(year, 10) : undefined,
			description,
			source,
		};

		const res = await fetch(apiUrl("/api/books"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(bookBody),
		});
		if (!res.ok) {
			setStatus(`Failed to create book: ${res.status} ${res.statusText}`);
			return;
		}
		const created = await res.json();
		const bookId = created.id;
		setStatus("Uploading translations...");

		for (let i = 0; i < translations.length; i++) {
			const t = translations[i];
			if (!t.file) continue;
			const form = new FormData();
			form.append("language", t.language || "");
			form.append("file", t.file, t.file.name || t.filename || "translation.txt");
			const tRes = await fetch(apiUrl(`/api/books/${bookId}/translations`), {
				method: "POST",
				body: form,
			});
			if (!tRes.ok) {
				console.error(`Translation upload failed: ${tRes.status}`);
			}
		}

		setStatus("✅ Book created successfully!");
		// Reset form
		setTitle("");
		setAuthor("");
		setYear("");
		setDescription("");
		setSource("");
		setTranslations([{ language: "", filename: "", file: null }]);
	}

	return (
		<main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
			<h1>Add Book</h1>
			<p>Create a new book and upload translations</p>
      
			<form onSubmit={handleSubmit}>
				<fieldset style={{ marginBottom: 20, border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
					<legend style={{ fontSize: 16, fontWeight: "bold" }}>Book Information</legend>
          
					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
							Title <span style={{ color: "red" }}>*</span>
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							placeholder="Enter book title"
							style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
						/>
					</div>

					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Author</label>
						<input
							type="text"
							value={author}
							onChange={(e) => setAuthor(e.target.value)}
							placeholder="Enter author name"
							style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
						/>
					</div>

					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Year</label>
						<input
							type="number"
							value={year}
							onChange={(e) => setYear(e.target.value)}
							placeholder="e.g. 2024"
							style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
						/>
					</div>

					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Enter book description"
							rows={3}
							style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontFamily: "inherit" }}
						/>
					</div>

					<div style={{ marginBottom: 12 }}>
						<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Original Source Text</label>
						<textarea
							value={source}
							onChange={(e) => setSource(e.target.value)}
							placeholder="Paste the original text or provide a reference"
							rows={4}
							style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd", fontFamily: "monospace" }}
						/>
					</div>
				</fieldset>

				<fieldset style={{ marginBottom: 20, border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
					<legend style={{ fontSize: 16, fontWeight: "bold" }}>Translations</legend>

					{translations.map((t, i) => (
						<div
							key={i}
							style={{
								border: "1px solid #ddd",
								padding: 12,
								marginBottom: 12,
								borderRadius: 4,
								backgroundColor: "#f9f9f9",
							}}
						>
							<div style={{ marginBottom: 12 }}>
								<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Language</label>
								<input
									type="text"
									value={t.language}
									onChange={(e) => updateTranslation(i, "language", e.target.value)}
									placeholder="e.g. French, Spanish, German"
									style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
								/>
							</div>

							<div style={{ marginBottom: 12 }}>
								<label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Upload Translation File (.txt)</label>
								<input
									type="file"
									accept=".txt"
									onChange={(e) => updateTranslation(i, "file", e.target.files[0])}
									style={{ padding: 8 }}
								/>
								{t.file && <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>✓ File selected: {t.file.name}</p>}
							</div>

							{translations.length > 1 && (
								<button
									type="button"
									onClick={() => removeTranslationRow(i)}
									style={{
										padding: "6px 12px",
										backgroundColor: "#ff6b6b",
										color: "white",
										border: "none",
										borderRadius: 4,
										cursor: "pointer",
									}}
								>
									Remove Translation
								</button>
							)}
						</div>
					))}

					<button
						type="button"
						onClick={addTranslationRow}
						style={{
							padding: "8px 16px",
							backgroundColor: "#4CAF50",
							color: "white",
							border: "none",
							borderRadius: 4,
							cursor: "pointer",
							marginBottom: 12,
						}}
					>
						+ Add Translation
					</button>
				</fieldset>

				<div style={{ marginBottom: 16 }}>
					<button
						type="submit"
						style={{
							padding: "12px 24px",
							backgroundColor: "#2196F3",
							color: "white",
							border: "none",
							borderRadius: 4,
							cursor: "pointer",
							fontSize: 16,
							fontWeight: "bold",
						}}
					>
						Create Book
					</button>
				</div>
			</form>

			{status && (
				<div
					style={{
						marginTop: 16,
						padding: 12,
						borderRadius: 4,
						backgroundColor: status.includes("❌") || status.includes("Failed") ? "#ffebee" : "#e8f5e9",
						color: status.includes("❌") || status.includes("Failed") ? "#c62828" : "#2e7d32",
						border: `1px solid ${status.includes("❌") || status.includes("Failed") ? "#ef5350" : "#4caf50"}`,
					}}
				>
					{status}
				</div>
			)}
		</main>
	);
}