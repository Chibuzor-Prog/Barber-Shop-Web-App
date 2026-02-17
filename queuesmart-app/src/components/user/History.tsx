import React from "react";
import Navbar from "../common/Navbar";

const History: React.FC = () => {
  const history = [
    { date: "2026-02-10", service: "Haircut & Beard", outcome: "Served" },
    { date: "2026-02-09", service: "Shampoo", outcome: "Cancelled" },
  ];

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">History</h2>
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Service</th>
              <th className="border px-2 py-1">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{h.date}</td>
                <td className="border px-2 py-1">{h.service}</td>
                <td className="border px-2 py-1">{h.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
