import React from "react";

export const Input = ({ type, placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="border p-2 rounded w-full mt-2"
  />
);
