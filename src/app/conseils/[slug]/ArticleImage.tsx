"use client";

interface ArticleImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
}

export function ArticleImage({ src, alt, className, style, loading }: ArticleImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      style={{ ...style, opacity: 0, transition: "opacity 0.5s" }}
      onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}
