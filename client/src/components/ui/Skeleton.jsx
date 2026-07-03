function Skeleton({ className }) {
    return <div className={`animate-pulse bg-gray-200 rounded-md ${className || "h-4 w-full"}`} />;
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-7 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                    <Skeleton className="h-4 w-32 mb-8" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-3.5 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TableSkeleton() {
    return (
        <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    );
}

export default Skeleton;