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
    <div className="w-full flex flex-col items-center gap-5">
      {/* Profile cards grid */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 w-full">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => router.push(`/${profile.id}`)}
              className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/10 hover:border-neon/40 transition-all duration-200 aspect-square bg-white/5 hover:bg-white/8"
            >
              {/* Level badge */}
              <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-bg/80 text-neon border border-neon/30 z-10">
                {profile.level}
              </span>

              {/* Avatar placeholder */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
              </div>

              {/* Name */}
              <div className="pb-3 text-center">
                <span className="text-white font-semibold text-sm">{profile.name}</span>
              </div>
            </button>
          ))}

          {/* New profile card */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex flex-col items-center justify-center rounded-2xl aspect-square border-2 border-dashed border-white/15 hover:border-neon/40 text-white/30 hover:text-neon/70 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <span className="text-2xl leading-none font-light">+</span>
              </div>
              <span className="text-xs font-medium tracking-wide">Neues Profil</span>
            </button>
          )}
        </div>
      )}

      {/* New profile button when no profiles exist */}
      {profiles.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center justify-center rounded-2xl w-36 h-36 border-2 border-dashed border-white/15 hover:border-neon/40 text-white/30 hover:text-neon/70 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <span className="text-2xl leading-none font-light">+</span>
          </div>
          <span className="text-xs font-medium tracking-wide">Neues Profil</span>
        </button>
      )}

      {/* Create profile form */}
      {showForm && (
        <div className="w-full bg-card-bg border border-neon/15 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-white tracking-wide">Neues Profil</h3>

          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              required
              autoFocus
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-colors"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-colors"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l} className="bg-gray-900">
                  {l}
                </option>
              ))}
            </select>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-neon text-app-bg font-semibold text-sm rounded-xl px-4 py-2.5 hover:brightness-110 disabled:opacity-50 transition-all neon-glow-sm"
              >
                {loading ? "Erstelle…" : "Erstellen"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage profiles button */}
      {profiles.length > 0 && (
        <button className="mt-1 px-6 py-2.5 rounded-full border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 text-xs font-semibold tracking-widest uppercase transition-colors">
          Profile verwalten
        </button>
      )}
    </div>
  );
}
