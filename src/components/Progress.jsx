import React from "react";

const Progress = ({ value, className }) => (
  <div className={`w-full bg-gray-200 rounded ${className}`}>
    <div
      className="bg-blue-500 h-full rounded"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default Progress;
