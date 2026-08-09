import { forwardRef } from "react";

const Input = forwardRef(function Input({ error, className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`vc-input ${error ? "invalid" : ""} ${className}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});

export default Input;
