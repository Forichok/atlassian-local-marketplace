import React, { useState } from "react";

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "success" | "danger" | "warning";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  disabled = false,
  type = "button",
  fullWidth = false,
}) => {
  const [pressed, setPressed] = useState(false);

  const colors = {
    primary: {
      bg: "#0C66E4",
      hover: "#0055CC",
    },
    success: {
      bg: "#1F845A",
      hover: "#166F4B",
    },
    danger: {
      bg: "#C9372C",
      hover: "#AE2E24",
    },
    warning: {
      bg: "#E2B203",
      hover: "#CF9F02",
    },
  }[variant];

  const sizes = {
    small: {
      padding: "8px 16px",
      fontSize: "13px",
      radius: "8px",
    },
    medium: {
      padding: "12px 20px",
      fontSize: "15px",
      radius: "10px",
    },
    large: {
      padding: "16px 28px",
      fontSize: "17px",
      radius: "12px",
    },
  }[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        backgroundColor: disabled ? "#DFE1E6" : colors.bg,
        color: disabled ? "#6B778C" : "#FFFFFF",
        border: "none",
        borderRadius: sizes.radius,
        padding: sizes.padding,
        fontSize: sizes.fontSize,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",

        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",

        transition: "all 0.2s ease",
        transform: pressed ? "translateY(1px)" : "translateY(0)",

        boxShadow: disabled
          ? "none"
          : pressed
          ? "0 2px 6px rgba(0, 0, 0, 0.15)"
          : "0 4px 12px rgba(0, 0, 0, 0.18)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.hover;
        }
      }}
    >
      {children}
    </button>
  );
};
