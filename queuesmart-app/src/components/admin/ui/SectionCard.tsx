// src/admin/ui/SectionCard.tsx
// White rounded card container used to group related content on a page.

import React from "react";

type Props = {
  children:  React.ReactNode;
  className?: string;
};

const SectionCard: React.FC<Props> = ({ children, className = "" }) => {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export default SectionCard;
