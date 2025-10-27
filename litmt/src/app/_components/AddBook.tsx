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
// Prefer JWT from login; fallback to a dev-only public admin key if set
const PUBLIC_ADMIN_KEY = (process.env.NEXT_PUBLIC_ADMIN_API_KEY || "").trim();

export default function AddBook() {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [year, setYear] = useState("");
	const [originalLanguage, setOriginalLanguage] = useState("");
	const [description, setDescription] = useState("");
	const [sourceFile, setSourceFile] = useState(null);
	const [translations, setTranslations] = useState([
		{ language: "", filename: "", file: null, translated_by: "" },
	]);
	const [status, setStatus] = useState("");

	const addTranslationRow = () => setTranslations([...translations, { language: "", filename: "", file: null, translated_by: "" }]);
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
			original_language: originalLanguage || undefined,
			// prefer uploading original source as a file after creation
		};

				const token = (typeof window !== "undefined" && localStorage.getItem("token")) || "";
				const res = await fetch(apiUrl("/api/books"), {
			method: "POST",
				headers: {
					"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : PUBLIC_ADMIN_KEY ? { Authorization: `Bearer ${PUBLIC_ADMIN_KEY}` } : {}),
				},
			body: JSON.stringify(bookBody),
		});
		if (!res.ok) {
			setStatus(`Failed to create book: ${res.status} ${res.statusText}`);
			return;
		}
		const created = await res.json();
		const bookId = created.id;

		// If an original source file was selected, upload it now
		if (sourceFile) {
			setStatus("Uploading original source...");
			try {
				const fd = new FormData();
				fd.append("file", sourceFile, sourceFile.name || "original.txt");
				const srcRes = await fetch(apiUrl(`/api/books/${bookId}/source`), {
					method: "POST",
					headers: {
						...(token ? { Authorization: `Bearer ${token}` } : PUBLIC_ADMIN_KEY ? { Authorization: `Bearer ${PUBLIC_ADMIN_KEY}` } : {}),
					},
					body: fd,
				});
				if (!srcRes.ok) {
					console.error(`Source upload failed: ${srcRes.status}`);
					setStatus(`Failed to upload original source (${srcRes.status})`);
				} else {
					setStatus("Uploading translations...");
				}
			} catch (e) {
				console.error("Source upload error", e);
				setStatus("Failed to upload original source");
			}
		} else {
			setStatus("Uploading translations...");
		}

		for (let i = 0; i < translations.length; i++) {
			const t = translations[i];
			if (!t.file) continue;
			const form = new FormData();
			form.append("language", t.language || "");
			form.append("file", t.file, t.file.name || t.filename || "translation.txt");
			if (t.translated_by) {
				form.append("translated_by", t.translated_by);
			}
							const tRes = await fetch(apiUrl(`/api/books/${bookId}/translations`), {
				method: "POST",
						headers: {
									...(token ? { Authorization: `Bearer ${token}` } : PUBLIC_ADMIN_KEY ? { Authorization: `Bearer ${PUBLIC_ADMIN_KEY}` } : {}),
						},
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
		setOriginalLanguage("");
		setSourceFile(null);
		setTranslations([{ language: "", filename: "", file: null, translated_by: "" }]);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-xl p-6">
			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Book Information */}
				<div>
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Book Information</h2>
					<div className="grid md:grid-cols-2 gap-6">
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Title <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								placeholder="Enter book title"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
							<input
								type="text"
								value={author}
								onChange={(e) => setAuthor(e.target.value)}
								placeholder="Enter author name"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
							<input
								type="number"
								value={year}
								onChange={(e) => setYear(e.target.value)}
								placeholder="e.g. 2024"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Original Language</label>
							<input
								type="text"
								value={originalLanguage}
								onChange={(e) => setOriginalLanguage(e.target.value)}
								placeholder="e.g. English, Chinese, Spanish"
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Enter book description"
								rows={3}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
							/>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-2">Upload Original Source (.txt)</label>
							<input
								type="file"
								accept=".txt"
								onChange={(e) => setSourceFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
								className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
							/>
							{sourceFile && (
								<p className="text-xs text-gray-600 mt-2">✓ File selected: {sourceFile.name}</p>
							)}
						</div>
					</div>
				</div>

				{/* Translations */}
				<div>
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Translations</h2>
					<div className="space-y-4">
						{translations.map((t, i) => (
							<div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
										<input
											type="text"
											value={t.language}
											onChange={(e) => updateTranslation(i, "language", e.target.value)}
											placeholder="e.g. French, Spanish, German"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Translated by (model)</label>
										<input
											type="text"
											value={t.translated_by}
											onChange={(e) => updateTranslation(i, "translated_by", e.target.value)}
											placeholder="e.g. gpt-4o, nllb-200, custom"
											className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
										/>
									</div>

									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">Upload Translation File (.txt)</label>
										<input
											type="file"
											accept=".txt"
											onChange={(e) => updateTranslation(i, "file", e.target.files[0])}
											className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
										/>
										{t.file && <p className="text-xs text-gray-600 mt-2">✓ File selected: {t.file.name}</p>}
									</div>
								</div>

								{translations.length > 1 && (
									<button
										type="button"
										onClick={() => removeTranslationRow(i)}
										className="mt-3 px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
									>
										Remove Translation
									</button>
								)}
							</div>
						))}
					</div>

					<button
						type="button"
						onClick={addTranslationRow}
						className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
					>
						+ Add Translation
					</button>
				</div>

				<div>
					<button
						type="submit"
						className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
					>
						Create Book
					</button>
				</div>
			</form>

			{status && (
				<div
					className={`mt-4 p-3 rounded-lg border ${
						status.includes("❌") || status.includes("Failed")
							? "bg-red-50 text-red-700 border-red-200"
							: "bg-green-50 text-green-700 border-green-200"
					}`}
				>
					{status}
				</div>
			)}
		</div>
	);
}