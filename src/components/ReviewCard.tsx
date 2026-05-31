import { timeAgo } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    service?: string | null;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    vehicleYear?: number | null;
    ownerReply?: string | null;
    createdAt: string | Date;
    user: { name?: string | null; image?: string | null };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: "#fff4ed", color: "#f97316" }}>
          {review.user.name?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="font-semibold text-gray-900 text-sm">{review.user.name ?? "Anonyme"}</span>
              {(review.vehicleMake || review.vehicleYear) && (
                <span className="ml-2 text-xs text-gray-500">
                  {review.vehicleYear} {review.vehicleMake} {review.vehicleModel}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-sm">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
            {review.service && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fff4ed", color: "#f97316" }}>{review.service}</span>
            )}
          </div>
          {review.title && (
            <p className="font-semibold text-gray-800 text-sm mt-2">{review.title}</p>
          )}
          {review.comment && (
            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{review.comment}</p>
          )}
          {review.ownerReply && (
            <div className="mt-3 rounded-lg p-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#f97316" }}>Réponse du garage</p>
              <p className="text-sm text-gray-700">{review.ownerReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
