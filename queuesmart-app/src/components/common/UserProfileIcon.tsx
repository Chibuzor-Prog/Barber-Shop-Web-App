

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import UserProfilePanel from "./UserProfilePanel";

const UserProfileIcon: React.FC = () => {
  const { user } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!user) return null;

  // Show first letter of name as initials
  const initials = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <>
      {/* Avatar button in the sidebar */}
      <button
        onClick={() => setPanelOpen(true)}
        aria-label="Open user profile"
        title={`Profile: ${user.name || user.email}`}
        className="
          group flex w-full items-center gap-3 rounded-xl px-3 py-2
          text-left transition hover:bg-white/10
        "
      >
        {/* Circle avatar with initials */}
        <span className="
          flex h-9 w-9 flex-shrink-0 items-center justify-center
          rounded-full bg-white/20 text-sm font-bold text-white
          ring-2 ring-white/30 group-hover:ring-white/60 transition
        ">
          {initials}
        </span>

        {/* Name + role label */}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {user.name || user.email}
          </span>
          <span className="block text-xs capitalize text-white/60">
            {user.role}
          </span>
        </span>

        {/* Chevron right */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 flex-shrink-0 text-white/50 group-hover:text-white/80 transition"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Profile slide-in panel */}
      <UserProfilePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
};

export default UserProfileIcon;
