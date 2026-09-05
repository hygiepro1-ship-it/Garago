export default function GarageCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)" }} />
      <div className="flex flex-col sm:flex-row">
        {/* Gauche */}
        <div className="sm:w-[88px] flex sm:flex-col items-center gap-3 px-4 py-3 sm:py-5 sm:px-3"
          style={{ borderRight: "1px solid #f1f5f9" }}>
          <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl skel flex-shrink-0" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="skel h-2.5 w-16 rounded" />
            <div className="skel h-3 w-8 rounded" />
            <div className="skel h-2 w-10 rounded" />
          </div>
        </div>
        {/* Centre */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="skel h-4 rounded" style={{ width: "55%" }} />
            <div className="skel h-4 w-20 rounded-md" />
          </div>
          <div className="skel h-3 w-32 rounded" />
          <div className="flex gap-1.5 flex-wrap">
            <div className="skel h-5 w-16 rounded-full" />
            <div className="skel h-5 w-20 rounded-full" />
            <div className="skel h-5 w-12 rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <div className="skel h-5 w-10 rounded-lg" />
            <div className="skel h-5 w-10 rounded-lg" />
            <div className="skel h-5 w-10 rounded-lg" />
          </div>
        </div>
        {/* Droite */}
        <div className="sm:w-48 px-4 py-3 sm:py-4 sm:border-l flex flex-col gap-3"
          style={{ borderColor: "#f1f5f9", background: "#fafcff" }}>
          <div className="skel h-3 w-24 rounded" />
          <div className="flex flex-col gap-1.5">
            <div className="skel h-6 rounded-lg" style={{ width: "85%" }} />
            <div className="skel h-6 rounded-lg" style={{ width: "75%" }} />
            <div className="skel h-6 rounded-lg" style={{ width: "80%" }} />
          </div>
          <div className="mt-auto skel h-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
