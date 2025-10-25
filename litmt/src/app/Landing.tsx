"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "./_components/Header";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUsername(user.username || null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-24 px-6 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="bg-white">
        {/* SECTION 1: Hero */}
        <section className="pt-32 pb-24 px-6 relative overflow-hidden bg-gradient-to-b from-indigo-100 to-white">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl"></div>
          </div>
          <div className="mx-auto max-w-6xl relative z-10">
            <div className="grid md:grid-cols-3 gap-12 items-center">
                            <div className="md:col-span-2">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                  Bringing World Literature Across Language Barriers
                </h1>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  LitMT makes previously-untranslated literary works accessible to global audiences through machine translation and reader collaboration.
                </p>
                
                {isLoggedIn ? (
                  <div className="flex flex-wrap gap-4 mb-6">
                    <p className="text-lg text-gray-800 font-semibold">
                      Welcome back, <span className="text-indigo-600">{username}</span>!
                    </p>
                    <div className="w-full">
                      <Link
                        href="/library"
                        className="inline-block px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
                      >
                        Go to Library
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 mb-6">
                    <Link
                      href="/create-account"
                      className="px-8 py-4 border-2 bg-indigo-600  border-indigo-600 text-white font-semibold rounded-lg  transition"
                    >
                      Create an Account
                    </Link>
                    <Link
                      href="/sign-in"
                      className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
                <p className="text-sm italic text-gray-600">
                  Some features may be incomplete.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: About the Project */}
        <section id="about" className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16">
              <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">About LitMT</h3>
              <div className="w-16 h-1 bg-indigo-600"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  LitMT is a research platform developed by researchers at the University of Massachusetts, Amherst. We aim to make previously-untranslated world literature accessible beyond language barriers.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🌐</span>
                    <div>
                      <h4 className="font-bold text-gray-900">Translations in 24 languages</h4>
                      <p className="text-gray-600 text-sm">Reaching diverse global audiences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">💬</span>
                    <div>
                      <h4 className="font-bold text-gray-900">Community feedback improves AI</h4>
                      <p className="text-gray-600 text-sm">Every comment refines our translations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🔍</span>
                    <div>
                      <h4 className="font-bold text-gray-900">Open & research-driven</h4>
                      <p className="text-gray-600 text-sm">Transparent, ethical, privacy-conscious</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50  p-8 rounded-2xl border border-indigo-200">
                <h4 className="font-serif text-2xl font-bold text-gray-900 mb-6">The Process</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-gray-900">Select Book</p>
                      <p className="text-sm text-gray-600">From public domain literature</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-gray-900">Translate</p>
                      <p className="text-sm text-gray-600">Using advanced LLMs</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-gray-900">Gather Feedback</p>
                      <p className="text-sm text-gray-600">Community improves quality</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-gray-900">Refine Model</p>
                      <p className="text-sm text-gray-600">Improve translations continuously</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: AI Translation & Ethics */}
        {/* SECTION 3: AI Translation & Ethics */}
        <section id="ethics" className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">AI Translation & Ethics</h3>
            <div className="w-16 h-1 bg-indigo-600 mb-12"></div>            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-2">
                <div className="bg-white p-8 rounded-xl border-l-4 border-indigo-600 mb-8">
                  <p className="text-2xl font-serif italic text-indigo-600 mb-4">
                    "Translation is not replacement. It's collaboration."
                  </p>
                </div>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  We do not believe that machines can replace humans for literary translation. State-of-the-art machine translation still does not convey the subtleties that human translators bring—such as author's voice, cultural nuance, and stylistic choices.
                </p>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  The future lies in <strong>collaborative translation</strong>, where humans use AI-augmented tools to obtain suggestions and feedback on their work. This approach harnesses machine efficiency while preserving human creativity and judgment.
                </p>
                <a 
                  href="https://www.tandfonline.com/doi/full/10.1080/0907676X.2018.1520907"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  Read: Ethical Issues in Literary Translation →
                </a>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-indigo-200">
                <h4 className="font-serif text-xl font-bold text-gray-900 mb-6">Human ↔ AI Collaboration</h4>
                <div className="space-y-4">
                  <div className="text-center py-3 bg-white rounded border-2 border-indigo-300">
                    <p className="font-semibold text-gray-900">Human Translator</p>
                  </div>
                  <div className="text-center text-indigo-600 font-bold">↕️</div>
                  <div className="text-center py-3 bg-white rounded border-2 border-indigo-300">
                    <p className="font-semibold text-gray-900">AI Suggestions</p>
                  </div>
                  <div className="text-center text-indigo-600 font-bold">↕️</div>
                  <div className="text-center py-3 bg-white rounded border-2 border-indigo-300">
                    <p className="font-semibold text-gray-900">Refined Translation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Book & Language Selection */}
        <section className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">Diversity & Selection</h3>
            <div className="w-16 h-1 bg-indigo-600 mb-12"></div>
            
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <h4 className="text-2xl font-serif font-bold text-gray-900 mb-4">How We Choose Books</h4>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Every book on LitMT is in the public domain, ensuring freedom from copyright restrictions. We prioritize works that have not been widely translated into our target languages, bringing new voices to global readers.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong>Diversity is core:</strong> We feature books from varied cultures and maintain balanced representation from both male and female authors, ensuring our collection reflects the richness of world literature.
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-serif font-bold text-gray-900 mb-4">Language Selection</h4>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  We selected our 24 target languages based on speaker populations (via Ethnologue data), linguistic diversity, and representation of different writing scripts and morphological features.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  This thoughtful approach ensures that our translations reach the maximum number of readers while promoting linguistic diversity and cultural representation.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100">
              <h4 className="font-serif text-xl font-bold text-gray-900 mb-6">Supported Languages</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {["English", "French", "Spanish", "German", "Italian", "Portuguese", "Dutch", "Polish", "Russian", "Turkish", "Arabic", "Hindi", "Chinese", "Japanese", "Korean", "Vietnamese", "Thai", "Indonesian", "Tagalog", "Swahili", "Hebrew", "Greek", "Bulgarian", "Romanian"].map((lang) => (
                  <div key={lang} className="bg-white px-4 py-3 rounded-lg text-center font-semibold text-gray-900 hover:shadow-md transition">
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Research & Limitations */}
        <section id="research" className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">Machine Translation Research</h3>
            <div className="w-16 h-1 bg-indigo-600 mb-12"></div>
            
            <p className="text-lg text-gray-700 mb-12 leading-relaxed">
              All our translations use large language models (ChatGPT, GPT-4) following methods described in our research. We're committed to transparency about limitations:
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <a
                href="https://arxiv.org/abs/2304.03245"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-8 rounded-xl border-2 border-indigo-200 hover:shadow-lg hover:border-indigo-600 transition"
              >
                <div className="text-4xl mb-4">📄</div>
                <h4 className="font-serif text-xl font-bold text-gray-900 mb-3">Document-Level Literary Translation</h4>
                <p className="text-gray-700 text-sm mb-4">
                  Large language models effectively leverage context, but critical errors persist across languages.
                </p>
                <p className="text-indigo-600 font-semibold text-sm">Read on ArXiv →</p>
              </a>
              <a
                href="https://arxiv.org/abs/2210.14250"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-8 rounded-xl border-2 border-indigo-200 hover:shadow-lg hover:border-indigo-600 transition"
              >
                <div className="text-4xl mb-4">🔬</div>
                <h4 className="font-serif text-xl font-bold text-gray-900 mb-3">Parallel Paragraphs from World Literature</h4>
                <p className="text-gray-700 text-sm mb-4">
                  Exploring document-level approaches for improving translation quality across literary works.
                </p>
                <p className="text-indigo-600 font-semibold text-sm">Read on ArXiv →</p>
              </a>
            </div>

            <div className="bg-white border-l-4 border-indigo-600 p-8 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-3">⚠️ Known Limitations</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span>•</span>
                  <span>Translations may contain errors, awkward phrasing, and miss subtleties of the original text</span>
                </li>
                <li className="flex gap-3">
                  <span>•</span>
                  <span>Some languages are more affected by these limitations than others</span>
                </li>
                <li className="flex gap-3">
                  <span>•</span>
                  <span>AI-generated author bios and summaries may not be 100% accurate</span>
                </li>
              </ul>
              <p className="text-gray-700 mt-4 text-sm italic">
                Help us improve by providing feedback on translation quality!
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: Community Participation */}
        <section id="community" className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">Join the Conversation</h3>
            <div className="w-16 h-1 bg-indigo-600 mb-12"></div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-2xl font-serif font-bold text-gray-900 mb-6">How You Can Help</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="text-3xl">💬</span>
                    <div>
                      <h5 className="font-bold text-gray-900">Comment on Translations</h5>
                      <p className="text-gray-600 text-sm">Point out errors, discuss quality, share insights</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-3xl">📚</span>
                    <div>
                      <h5 className="font-bold text-gray-900">Suggest Books</h5>
                      <p className="text-gray-600 text-sm">Recommend literary works you'd like translated</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-3xl">🗣️</span>
                    <div>
                      <h5 className="font-bold text-gray-900">Discuss Scenes & Stories</h5>
                      <p className="text-gray-600 text-sm">Connect with fellow readers across languages</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-3xl">🔍</span>
                    <div>
                      <h5 className="font-bold text-gray-900">Support Research</h5>
                      <p className="text-gray-600 text-sm">Your feedback helps improve AI translation models</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-500 p-12 rounded-2xl text-white flex flex-col justify-center">
                <h4 className="text-3xl font-serif font-bold mb-4">Have a Book You Love?</h4>
                <p className="text-indigo-100 mb-8">
                  Share your suggestion with our team. We're always looking for diverse literary works to bring to a global audience.
                </p>
                <a
                  href="https://forms.gle/4WFWsU92nze1hSfv8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-50 transition text-center"
                >
                    Suggest a Book
                </a>
              </div>
            </div>

            <div className="mt-12 p-8 bg-white rounded-xl border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3">🔒 Your Privacy Matters</h4>
              <p className="text-gray-700">
                We collect feedback to improve our research, but <strong>all comments are anonymized</strong> to protect your identity. We're committed to safeguarding your personal information.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: Team & Acknowledgments */}
        <section id="team" className="py-24 px-6 bg-white">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-4xl font-serif font-bold text-gray-900 mb-4">Our Team</h3>
            <div className="w-16 h-1 bg-indigo-600 mb-12"></div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { name: "Marzena Karpinska", url: "https://marzenakrp.github.io/" },
                { name: "Katherine Thai", url: "https://katherinethai.github.io/" },
                { name: "Mohit Iyyer", url: "https://people.cs.umass.edu/~miyyer/" },
              ].map((member) => (
                <a
                  key={member.name}
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center group"
                >
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-200 to-yellow-200 rounded-full flex items-center justify-center mb-4 group-hover:shadow-lg transition">
                    <span className="text-5xl">👩‍🔬</span>
                  </div>
                  <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                    {member.name}
                  </h4>
                  <p className="text-sm text-indigo-600">View Profile →</p>
                </a>
              ))}
            </div>

            <div className="bg-white p-8 rounded-xl border border-blue-200 text-center mb-12">
              <p className="text-lg text-gray-700 mb-4">
                This project is funded by an award from <strong>Open Philanthropy</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                A University of Massachusetts Amherst NLP Research Initiative
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
