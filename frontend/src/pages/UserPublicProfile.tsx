// src/pages/UserPublicProfile.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import "./Profile.css";
import { useAuth } from "../contexts/AuthContext";

type UserPublic = {
  id: number;
  display_name: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  email: string; // used for Message only (not shown)
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function initialsFromDisplayName(name?: string | null): string {
  const n = (name || "").trim();
  if (!n) return "AVATAR";
  const parts = n.split(/\s+/);
  const a = parts[0]?.[0]?.toUpperCase() || "";
  const b = parts[1]?.[0]?.toUpperCase() || "";
  return a && b ? a + b : (a || b || "AVATAR");
}

export default function UserPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [user, setUser] = useState<UserPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null); // reset old error before fetching
        const res = await fetch(`${API_BASE}/users/${id}/public`, {
          headers: authHeaders(),
        });
        if (res.status === 404) {
          throw new Error("User not found");
        }
        if (!res.ok) {
          throw new Error(`GET /users/${id}/public failed (${res.status})`);
        }
        const data: UserPublic = await res.json();
        if (!mounted) return;
        setUser(data);
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="profile-container">
        <div className="err">User not found</div>
      </div>
    );
  }
  if (loading) {
    return <div className="profile-container">Loading…</div>;
  }
  if (error || !user) {
    return (
      <div className="profile-container">
        <div className="err">{error || "Not found"}</div>
      </div>
    );
  }

  const nameToShow = user.display_name?.trim() || "—";
  const roleLabel = user.job_title?.trim() || "Member";
  const hasAvatar = !!(user.avatar_url && user.avatar_url.trim() !== "");
  const isSelf =
    !!me?.email &&
    !!user.email &&
    me.email.toLowerCase() === user.email.toLowerCase();

  const handleMessage = () => {
    if (!user.email) return; // guard for future changes
    if (isSelf) return; // prevent opening chat with yourself
    navigate(`/chat?to=${encodeURIComponent(user.email)}`);
  };

  return (
    <div className="profile-container profile-public">
      <div className="profile-card">
        <div className="profile-row">
          <div>
            {hasAvatar ? (
              <img src={user.avatar_url!} alt="User avatar" className="avatar-lg" />
            ) : (
              <div className="avatar-fallback-lg" aria-label="User initials">
                {initialsFromDisplayName(nameToShow)}
              </div>
            )}
          </div>

          <div className="profile-main">
            <div className="profile-name">{nameToShow}</div>

            <div className="profile-actions">
              <span className="badge" aria-label="User role">
                {roleLabel}
              </span>
            </div>

            {user.bio && user.bio.trim() !== "" && (
              <>
                <div className="divider" />
                <div className="section-title">About</div>
                <p className="bio">{user.bio}</p>
              </>
            )}

            <div className="profile-actions" style={{ marginTop: 12 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleMessage}
                aria-label={`Message ${nameToShow}`}
                title={isSelf ? "You can't message yourself" : undefined}
              >
                Message
              </button>
              {/* <button className="btn btn-ghost" type="button">Follow</button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
