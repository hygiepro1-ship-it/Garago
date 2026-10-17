"use client";

interface ArticleImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  /** "high" pour la photo d'en-tête (élément principal de la page) */
  fetchPriority?: "high" | "low" | "auto";
  srcSet?: string;
  sizes?: string;
}

/** Photo d'article : affichée dès qu'elle arrive (pas de fondu piloté par JavaScript) ; masquée si le fichier manque. */
export function ArticleImage({ src, alt, className, style, loading, width, height, fetchPriority, srcSet, sizes }: ArticleImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
      style={style}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      // Erreur survenue avant l'hydratation (onError pas encore branché) : on masque aussi.
      ref={(el) => { if (el?.complete && el.naturalWidth === 0) el.style.display = "none"; }}
    />
  );
}
