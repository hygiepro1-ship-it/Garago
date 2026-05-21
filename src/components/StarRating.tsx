"use client";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const sizeClass = { sm: "text-base", md: "text-2xl", lg: "text-3xl" }[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <span className={star <= value ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}
