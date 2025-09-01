import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";
import "./Profile.css";

type UserOut = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  job_title?: string | null;
  display_name?: string | null;
};

type UserUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  job_title?: string | null;
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function firstLatinLetter(s?: string | null): string {
  if (!s) return "";
  const c = s.trim().charAt(0);
  return /[a-z]/i.test(c) ? c.toUpperCase() : "";
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstLatinLetter(firstName);
  const l = firstLatinLetter(lastName);
  if (f && l) return f + l;
  if (f) return f;
  if (l) return l;
  return "AVATAR";
}

function toEnglishTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((part) =>
      /^[a-z]/i.test(part)
        ? part[0].toUpperCase() + part.slice(1).toLowerCase()
        : part
    )
    .join(" ");
}

export default function Profile() {
  const [me, setMe] = useState<UserOut | null>(null);
  const [form, setForm] = useState<UserUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`GET /auth/me failed (${res.status})`);
        const data: UserOut = await res.json();
        if (!mounted) return;
        setMe(data);
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          avatar_url: data.avatar_url ?? "",
          bio: data.bio ?? "",
          job_title: data.job_title ?? "",
        });
      } catch (e: any) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const changed = useMemo(() => {
    if (!me) return false;
    return (
      (form.first_name ?? "") !== (me.first_name ?? "") ||
      (form.last_name ?? "") !== (me.last_name ?? "") ||
      (form.avatar_url ?? "") !== (me.avatar_url ?? "") ||
      (form.bio ?? "") !== (me.bio ?? "") ||
      (form.job_title ?? "") !== (me.job_title ?? "")
    );
  }, [form, me]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      const payload: UserUpdate = {};
      if (form.first_name !== me?.first_name)
        payload.first_name = form.first_name?.trim() || null;
      if (form.last_name !== me?.last_name)
        payload.last_name = form.last_name?.trim() || null;
      if (form.avatar_url !== me?.avatar_url)
        payload.avatar_url = form.avatar_url?.trim() || null;
      if (form.bio !== me?.bio) payload.bio = form.bio?.trim() || null;
      if (form.job_title !== me?.job_title)
        payload.job_title = form.job_title?.trim() || null;

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`PUT /auth/me failed (${res.status}): ${t}`);
      }
      const updated: UserOut = await res.json();
      setMe(updated);
      setForm({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        avatar_url: updated.avatar_url ?? "",
        bio: updated.bio ?? "",
        job_title: updated.job_title ?? "",
      });
      setSavedMsg("Profile updated successfully.");
      setEditMode(false);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading profile…</div>;
  if (error) return <div style={{ color: "crimson" }}>{error}</div>;
  if (!me) return <div>Profile not found.</div>;

  const rawName =
    me.display_name ||
    `${me.first_name ?? ""} ${me.last_name ?? ""}`.trim() ||
    "—";
  const nameToShow = /^[a-z]/i.test(rawName) ? toEnglishTitleCase(rawName) : rawName;

  const roleLabel =
    me.job_title && me.job_title.trim() ? me.job_title.trim() : "Member";
  const hasAvatar = !!(me.avatar_url && me.avatar_url.trim() !== "");

  return (
    <div className="profile-container">
      <h1>User Profile</h1>

      <div className="profile-card">
        <div className="profile-card-header">
          {!editMode ? (
            <button
              className="btn btn-primary"
              onClick={() => setEditMode(true)}
              type="button"
            >
              Edit
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setEditMode(false)}
              type="button"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="profile-row">
          <div>
            {hasAvatar ? (
              <img src={me.avatar_url!} alt="avatar" className="avatar-lg" />
            ) : (
              <div className="avatar-fallback-lg">
                {getInitials(me.first_name, me.last_name)}
              </div>
            )}
          </div>

          <div className="profile-main">
            <div className="profile-name">{nameToShow}</div>
            <div className="profile-role">{roleLabel}</div>

            {me.bio && me.bio.trim() !== "" && (
              <>
                <div className="divider" />
                <div className="section-title">About me</div>
                <p className="bio">{me.bio}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {savedMsg && <div className="flash-ok">{savedMsg}</div>}

      {editMode && (
        <>
          <h3>Edit Profile</h3>
          <div className="profile-form-card">
            <form onSubmit={onSave} className="profile-form">
              <label>
                First name
                <input
                  value={form.first_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  maxLength={50}
                  required
                />
              </label>

              <label>
                Last name
                <input
                  value={form.last_name ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  maxLength={50}
                  required
                />
              </label>

              <label>
                Avatar URL
                <input
                  value={form.avatar_url ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, avatar_url: e.target.value }))
                  }
                  placeholder="https://…"
                  inputMode="url"
                />
              </label>

              {form.avatar_url && (
                <div className="avatar-preview">
                  <img src={form.avatar_url!} alt="avatar preview" />
                </div>
              )}

              <label>
                Job title
                <input
                  value={form.job_title ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, job_title: e.target.value }))
                  }
                  maxLength={100}
                  placeholder="e.g., Backend Developer"
                />
              </label>

              <label>
                Bio
                <textarea
                  value={form.bio ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  maxLength={280}
                  rows={4}
                  placeholder="Tell others a bit about you (max 280 chars)"
                />
              </label>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!changed || saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {error && <span className="err">{error}</span>}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
