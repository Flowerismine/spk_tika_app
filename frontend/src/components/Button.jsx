import React from 'react';

const Button = ({ bgColor, color, size, text, borderRadius, icon, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: bgColor, color, borderRadius }}
      className={`flex items-center test-${size} p-3 hover:drop-shadow-xl`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {text}
    </button>
  );
};

export default Button;
