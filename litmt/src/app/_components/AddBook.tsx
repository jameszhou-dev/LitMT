// @ts-nocheck
"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
	const sourceInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
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
  const [isUploading, setIsUploading] = useState(false);

	const addTranslationRow = () => setTranslations([...translations, { language: "", filename: "", file: null, translated_by: "" }]);
	const removeTranslationRow = (i) => setTranslations(translations.filter((_, idx) => idx !== i));
	const updateTranslation = (i, field, value) => {
		const copy = [...translations];
		copy[i][field] = value;
		setTranslations(copy);
	};

	const openSourcePicker = () => {
		try { sourceInputRef.current?.click(); } catch {}
	};

	const openTranslationPicker = (i: number) => {
		try {
			const el = document.getElementById(`trans-file-${i}`) as HTMLInputElement | null;
			el?.click();
		} catch {}
	};

	async function handleSubmit(e) {
		e.preventDefault();
    setIsUploading(true);
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
      setIsUploading(false);
			return;
		}
		const created = await res.json();
		const bookId = created.id;

    // Build uploads and run in parallel to reduce total time
    const uploads: Promise<Response>[] = [];
    if (sourceFile) {
      const fd = new FormData();
      fd.append("file", sourceFile, sourceFile.name || "original.txt");
      uploads.push(
        fetch(apiUrl(`/api/books/${bookId}/source`), {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : PUBLIC_ADMIN_KEY ? { Authorization: `Bearer ${PUBLIC_ADMIN_KEY}` } : {}),
          },
          body: fd,
        })
      );
    }
    translations.forEach((t) => {
      if (!t.file) return;
      const form = new FormData();
      form.append("language", t.language || "");
      form.append("file", t.file, t.file.name || t.filename || "translation.txt");
      if (t.translated_by) form.append("translated_by", t.translated_by);
      uploads.push(
        fetch(apiUrl(`/api/books/${bookId}/translations`), {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : PUBLIC_ADMIN_KEY ? { Authorization: `Bearer ${PUBLIC_ADMIN_KEY}` } : {}),
          },
          body: form,
        })
      );
    });

    if (uploads.length > 0) {
      setStatus(`Uploading ${uploads.length} file${uploads.length > 1 ? "s" : ""}...`);
      await Promise.allSettled(uploads);
    }
    setStatus("Finalizing...");

		// Reset form and navigate to the new book page
		setTitle("");
		setAuthor("");
		setYear("");
		setDescription("");
		setOriginalLanguage("");
		setSourceFile(null);
		setTranslations([{ language: "", filename: "", file: null, translated_by: "" }]);
    setIsUploading(false);
    try { router.push(`/book/${bookId}`); } catch { window.location.href = `/book/${bookId}`; }
	}

	return (
		<div className="bg-white border border-gray-200 rounded-xl p-6 relative">
			{isUploading && (
				<div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90">
					<div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent mb-4" />
					<p className="text-gray-800 font-medium">{status || "Uploading..."}</p>
					<p className="text-gray-500 text-sm mt-1">Large text files can take a while. You can keep this tab open.</p>
				</div>
			)}
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
								ref={sourceInputRef}
								id="source-file"
								type="file"
								accept=".txt,text/plain"
								onChange={(e) => setSourceFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
								className="hidden"
							/>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={openSourcePicker}
									className="inline-flex items-center px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100"
								>
									Choose file
								</button>
								<span className="text-xs text-gray-700 truncate">
									{sourceFile ? `Selected: ${sourceFile.name}` : "No file chosen"}
								</span>
							</div>
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
											id={`trans-file-${i}`}
											type="file"
											accept=".txt,text/plain"
											onChange={(e) => updateTranslation(i, "file", (e.target.files && e.target.files[0]) || null)}
											className="hidden"
										/>
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={() => openTranslationPicker(i)}
												className="inline-flex items-center px-3 py-2 border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100"
											>
												Choose file
											</button>
											<span className="text-xs text-gray-700 truncate">
												{t.file ? `Selected: ${t.file.name}` : "No file chosen"}
											</span>
										</div>
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