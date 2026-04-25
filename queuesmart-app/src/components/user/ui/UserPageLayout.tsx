// src/user/ui/UserPageLayout.tsx
// Wraps every user page with a consistent header and scrollable body.

import React from "react";

type Props = {
  title:    string;
  children: React.ReactNode;
};

const UserPageLayout: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="flex h-full flex-col">

      {/* Page header */}
      <header className="flex flex-shrink-0 items-center
        border-b border-gray-200 bg-white px-8 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
};

export default UserPageLayout;
