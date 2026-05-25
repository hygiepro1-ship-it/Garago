"use client";

import { useState } from "react";
import { BRAND_MAP } from "@/lib/vehicleBrands";

interface BrandLogoProps {
  brand: string;
  size?: number;       // px — applies to both width and height
  className?: string;
  showName?: boolean;  // show brand name below the logo
}

export default function BrandLogo({ brand, size = 32, className = "", showName = false }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const info    = BRAND_MAP.get(brand);
  const color   = info?.color ?? "#64748b";
  const logoUrl = info?.logoUrl;

  // Initials: first letter of each word, max 2
  const initials = brand
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const wrapStyle: React.CSSProperties = {
    width:  size,
    height: size,
    flexShrink: 0,
  };

  const content =
    logoUrl && !failed ? (
      <img
        src={logoUrl}
        alt={brand}
        width={size}
        height={size}
        style={{ objectFit: "contain", width: size, height: size }}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    ) : (
      <div
        style={{
          width:  size,
          height: size,
          backgroundColor: color,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: Math.max(9, size * 0.35),
          letterSpacing: "-0.02em",
          userSelect: "none",
        }}
      >
        {initials}
      </div>
    );

  if (showName) {
    return (
      <div className={`flex flex-col items-center gap-1.5 ${className}`}>
        <div style={wrapStyle} className="flex items-center justify-center">
          {content}
        </div>
        <span className="text-xs font-medium text-gray-600 text-center leading-tight" style={{ maxWidth: size + 16 }}>
          {brand}
        </span>
      </div>
    );
  }

  return (
    <div style={wrapStyle} className={`flex items-center justify-center ${className}`}>
      {content}
    </div>
  );
}
