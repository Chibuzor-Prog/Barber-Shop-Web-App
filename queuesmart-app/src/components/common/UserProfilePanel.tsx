// src/common/UserProfilePanel.tsx
//
// A slide-in panel (not a modal) that shows the logged-in user's profile.
// Triggered by clicking the user avatar icon in the sidebar.
//
// Editable fields: Full Name, Phone Number, Contact Information.
// Read-only fields: Email, Role.
//
// On Save: calls PATCH /profile/:credentialId — persists to MongoDB or PostgreSQL.
// On Close: slides out without saving.

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../api/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type Profile = {
  id:          string;
  credentialId:string;
  email:       string;
  fullName:    string;
  phone:       string;
  contactInfo: string;
  role:        string;
  updatedAt:   string;
};

type Props = {
  isOpen:  boolean;
  onClose: () => void;
};

// ── Role badge colour ─────────────────────────────────────────────────────────
function roleBadgeClass(role: string) {
  return role === "admin"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-50 text-blue-700";
}

// ── Component ─────────────────────────────────────────────────────────────────
const UserProfilePanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  // Editable field state (mirrors profile while editing)
  const [editFullName,    setEditFullName]    = useState("");
  const [editPhone,       setEditPhone]       = useState("");
  const [editContactInfo, setEditContactInfo] = useState("");

  // ── Fetch profile from backend ────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await profileApi.get(user.id);
      setProfile(data);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch whenever the panel opens
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setEditing(false);
      setSuccess("");
      setError("");
    }
  }, [isOpen, fetchProfile]);

  // ── Enter edit mode ───────────────────────────────────────────────────────
  const handleEdit = () => {
    if (!profile) return;
    setEditFullName(profile.fullName);
    setEditPhone(profile.phone);
    setEditContactInfo(profile.contactInfo);
    setEditing(true);
    setSuccess("");
    setError("");
  };

  // ── Cancel edit ───────────────────────────────────────────────────────────
  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
  };

  // ── Save changes ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || !profile) return;

    if (!editFullName.trim()) {
      setError("Full name cannot be empty");
      return;
    }
    if (editPhone.trim().length > 20) {
      setError("Phone number must be 20 characters or fewer");
      return;
    }
    if (editContactInfo.trim().length > 300) {
      setError("Contact information must be 300 characters or fewer");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await profileApi.update(user.id, {
        fullName:    editFullName.trim(),
        phone:       editPhone.trim(),
        contactInfo: editContactInfo.trim(),
      });
      setProfile(result.profile);
      setEditing(false);
      setSuccess("Profile saved successfully");
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop — clicking it closes the panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`
          fixed top-0 right-0 z-40 h-full w-full max-w-md
          bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        aria-label="User Profile Panel"
        role="complementary"
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close profile panel"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition"
          >
            {/* X icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {profile && !loading && (
            <>
              {/* ── Avatar + Role ────────────────────────────────────────── */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleBadgeClass(profile.role)}`}
                >
                  {profile.role}
                </span>
              </div>

              {/* ── Field list ───────────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      maxLength={100}
                      value={editFullName}
                      onChange={e => setEditFullName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {profile.fullName}
                    </p>
                  )}
                </div>

                {/* Email — read-only */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-900">
                    {profile.email}
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      maxLength={20}
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-900">
                      {profile.phone || <span className="italic text-gray-400">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Contact Information — editable */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contact Information
                  </label>
                  {editing ? (
                    <textarea
                      maxLength={300}
                      rows={4}
                      value={editContactInfo}
                      onChange={e => setEditContactInfo(e.target.value)}
                      placeholder="Address, additional contact details…"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  ) : (
                    <p className="min-h-[4rem] rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-900 whitespace-pre-wrap">
                      {profile.contactInfo || <span className="italic text-gray-400">Not set</span>}
                    </p>
                  )}
                  {editing && (
                    <p className="mt-1 text-right text-xs text-gray-400">
                      {editContactInfo.length}/300
                    </p>
                  )}
                </div>

                {/* Role — read-only */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </label>
                  <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm capitalize text-gray-900">
                    {profile.role}
                  </p>
                </div>

              </div>
            </>
          )}
        </div>

        {/* ── Footer: action buttons ────────────────────────────────────────── */}
        {profile && !loading && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {editing ? (
              <div className="flex gap-3">
                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {/* Cancel */}
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* Edit */
              <button
                onClick={handleEdit}
                className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfilePanel;
