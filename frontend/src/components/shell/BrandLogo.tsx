import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/** Minimalist Concept 1 (Shield C Monogram) brand mark adapting to light/dark theme tokens. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 28, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    {/* Outer Shield C */}
    <path
      d="M50.5 23.2V20.2L31.5 9.2L12.5 20.2V43.8L31.5 54.8L50.5 43.8V40.8"
      className="stroke-app-text"
      strokeWidth="5"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
    {/* Inner Concentric Shield C */}
    <path
      d="M41.5 26.2V24.8L31.5 18.8L21.5 24.8V39.2L31.5 45.2L41.5 39.2V37.8"
      className="stroke-app-text"
      strokeWidth="4.8"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
    {/* Accent Hexagon Node */}
    <polygon
      points="49,26.6 53.7,29.3 53.7,34.7 49,37.4 44.3,34.7 44.3,29.3"
      className="fill-app-accent"
    />
  </svg>
);
