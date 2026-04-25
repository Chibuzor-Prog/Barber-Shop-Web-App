// src/admin/ui/AdminPageLayout.tsx
// Wraps every admin page with a consistent header (title + optional actions)
// and a scrollable content area.

import React from "react";

type Props = {
  title:    string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const AdminPageLayout: React.FC<Props> = ({ title, actions, children }) => {
  return (
    <div className="flex h-full flex-col">

      {/* Page header */}
      <header className="flex flex-shrink-0 items-center justify-between
        border-b border-gray-200 bg-white px-8 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>

      {/* Scrollable page body */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-8 py-6 space-y-6">
        {children}
      </div>
    </div>
  );
};

export default AdminPageLayout;
