// Shown while a page's server render is in flight. Without one, Next.js leaves the previous page on screen at reduced opacity, which reads as a rendering fault rather than as loading.

export function PageSkeleton({
  variant = "table",
}: {
  variant?: "table" | "detail" | "form" | "dashboard";
}) {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-96 bg-gray-100 rounded mt-3" />
      </div>

      {variant === "dashboard" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-7 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-5 w-56 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      )}

      {variant === "form" ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="h-4 w-32 bg-gray-200 rounded mb-5" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, field) => (
                  <div key={field}>
                    <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                    <div className="h-10 w-full bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-3 flex-1 bg-gray-200 rounded" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="border-b border-gray-100 p-4 flex gap-6 items-center">
              {Array.from({ length: 4 }).map((_, cell) => (
                <div key={cell} className="h-4 flex-1 bg-gray-100 rounded" />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PageSkeleton;
