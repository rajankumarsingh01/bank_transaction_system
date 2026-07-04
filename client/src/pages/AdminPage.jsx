import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, TrendingUp, AlertTriangle, Activity } from "lucide-react";

import { adminApi } from "../api/admin.api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
}

function AdminPage() {

    const [page, setPage] = useState(1);

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: adminApi.getStats
    });

    const { data: flaggedData, isLoading: flaggedLoading } = useQuery({
        queryKey: ["admin-flagged", page],
        queryFn: () => adminApi.getFlaggedTransactions(page, 15)
    });

    const stats = statsData?.data;
    const flagged = flaggedData?.data?.transactions || [];
    const pagination = flaggedData?.data?.pagination;

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-indigo-600" />
                    Fraud Review Panel
                </h1>
                <p className="text-sm text-gray-500 mt-1">System-wide monitoring and risk review.</p>
            </div>

            {!statsLoading && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <Card className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <Activity className="h-3.5 w-3.5" /> Total Volume
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalVolume)}</p>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Total Transactions
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Flagged (High Risk)
                        </div>
                        <p className="text-xl font-bold text-amber-600">{stats.flaggedCount}</p>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                            <ShieldAlert className="h-3.5 w-3.5" /> Avg. Risk Score
                        </div>
                        <p className="text-xl font-bold text-gray-900">{(stats.averageRiskScore * 100).toFixed(1)}%</p>
                    </Card>

                </div>
            )}

            <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 text-sm">Elevated & High Risk Transactions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Transactions scored at or above the review threshold.</p>
                </div>

                {flaggedLoading ? (
                    <TableSkeleton />
                ) : flagged.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-16">No elevated-risk transactions found. 🎉</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-gray-500">
                                        <th className="px-6 py-3.5 font-medium">Transaction</th>
                                        <th className="px-6 py-3.5 font-medium">Amount</th>
                                        <th className="px-6 py-3.5 font-medium">Risk Score</th>
                                        <th className="px-6 py-3.5 font-medium">Status</th>
                                        <th className="px-6 py-3.5 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {flagged.map((txn) => (
                                        <tr key={txn._id} className="hover:bg-gray-50/60">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {txn._id.slice(-10)}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {formatCurrency(txn.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={txn.riskScore >= 0.7 ? "danger" : "warning"}>
                                                    {(txn.riskScore * 100).toFixed(1)}%
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={txn.status === "COMPLETED" ? "success" : "default"}>
                                                    {txn.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{formatDate(txn.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="!px-3 !py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                        Prev
                                    </Button>
                                    <Button variant="secondary" className="!px-3 !py-1.5" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

        </div>
    );

}

export default AdminPage;