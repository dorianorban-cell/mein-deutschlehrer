"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  level: string;
  createdAt: string;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-900 text-emerald-300",
  A2: "bg-teal-900 text-teal-300",
  B1: "bg-blue-900 text-blue-300",
  B2: "bg-violet-900 text-violet-300",
  C1: "bg-rose-900 text-rose-300",
};

export default function ProfileSelector() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("A1");
  const [loading, setLoading] = useState(false);

  async function loadProfiles() {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), level }),
    });
    setName("");
    setLevel("A1");
    setShowForm(false);
    setLoading(false);
    await loadProfiles();
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Profile cards */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => router.push(`/${profile.id}`)}
              className="group flex flex-col items-start gap-3 p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800 transition-all duration-150 text-left"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl font-bold text-white group-hover:text-gray-100">
                  {profile.name}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    LEVEL_COLORS[profile.level] ?? "bg-gray-800 text-gray-400"
                  }`}
                >
                  {profile.level}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Profil öffnen →
              </span>
            </button>
          ))}
        </div>
      )}

      {/* New profile form / button */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
        >
          <h3 className="text-lg font-semibold text-white">Neues Profil</h3>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Anna"
              required
              autoFocus
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400" htmlFor="profile-level">
              Niveau
            </label>
            <select
              id="profile-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-gray-950 font-semibold rounded-lg px-4 py-2.5 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {loading ? "Wird erstellt…" : "Profil erstellen"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto flex items-center gap-2 px-6 py-3 rounded-2xl border border-dashed border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all duration-150"
        >
          <span className="text-xl leading-none">+</span>
          <span className="font-medium">Neues Profil</span>
        </button>
      )}
    </div>
  );
}
