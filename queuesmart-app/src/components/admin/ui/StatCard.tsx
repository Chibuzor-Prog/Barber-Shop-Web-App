
import React from "react";

type Props = {
  label: string;
  value: string | number;
  sub?:  string;
};

const StatCard: React.FC<Props> = ({ label, value, sub }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
};

export default StatCard;
