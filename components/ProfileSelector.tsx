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
              className="group relative flex flex-col rounded-2xl overflow-hidden border border-border-warm hover:border-forest bg-cream hover:shadow-md transition-all duration-200 aspect-square"
            >
              {/* Level badge */}
              <span className="absolute top-2.5 right-2.5 font-jetbrains text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-gold z-10">
                {profile.level}
              </span>

              {/* Avatar */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center">
                  <span className="font-playfair font-bold text-2xl text-gold leading-none">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Name */}
              <div className="pb-3 text-center">
                <span className="font-source-serif font-semibold text-sm text-forest">{profile.name}</span>
              </div>
            </button>
          ))}

          {/* New profile card */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex flex-col items-center justify-center rounded-2xl aspect-square border-2 border-dashed border-border-warm hover:border-forest text-muted-brown hover:text-forest transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-border-warm/40 flex items-center justify-center mb-2">
                <span className="text-2xl leading-none font-light">+</span>
              </div>
              <span className="font-jetbrains text-xs tracking-wide">Neues Profil</span>
            </button>
          )}
        </div>
      )}

      {/* New profile button when no profiles exist */}
      {profiles.length === 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center justify-center rounded-2xl w-36 h-36 border-2 border-dashed border-border-warm hover:border-forest text-muted-brown hover:text-forest transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-border-warm/40 flex items-center justify-center mb-2">
            <span className="text-2xl leading-none font-light">+</span>
          </div>
          <span className="font-jetbrains text-xs tracking-wide">Neues Profil</span>
        </button>
      )}

      {/* Create profile form */}
      {showForm && (
        <div className="w-full bg-cream border border-border-warm rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-playfair font-bold text-forest text-lg">Neues Profil</h3>

          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              required
              autoFocus
              className="bg-parchment border border-border-warm rounded-xl px-4 py-2.5 text-sm text-forest placeholder-muted-brown focus:outline-none focus:border-forest transition-colors font-source-serif"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-parchment border border-border-warm rounded-xl px-4 py-2.5 text-sm text-forest focus:outline-none focus:border-forest transition-colors font-jetbrains"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-forest text-cream font-jetbrains font-semibold text-sm rounded-xl px-4 py-2.5 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {loading ? "Erstelle…" : "Erstellen"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-muted-brown hover:text-forest hover:bg-border-warm/40 transition-colors font-jetbrains text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
