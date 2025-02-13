import React from "react";

const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-md p-4 ${className}`}>{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

export { CardContent };
export default Card;
