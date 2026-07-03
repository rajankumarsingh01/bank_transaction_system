import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, RotateCcw, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

import { accountApi } from "../api/account.api";
import { transactionApi } from "../api/transaction.api";
import Card from "../components/ui/Card";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { TableSkeleton } from "../components/ui/Skeleton";

const statusVariant = {
    COMPLETED: "success",
    PENDING: "warning",
    FAILED: "danger",
    REVERSED: "default"
};

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function HistoryPage() {

    const [page, setPage] = useState(1);
    const [reversingId, setReversingId] = useState(null);
    const queryClient = useQueryClient();

    const { data: accountData } = useQuery({
        queryKey: ["account"],
        queryFn: accountApi.getMe
    });

    const account = accountData?.data;

    const { data: historyData, isLoading } = useQuery({
        queryKey: ["transactions", page],
        queryFn: () => transactionApi.getHistory(page, 10),
        keepPreviousData: true
    });

    const transactions = historyData?.data?.transactions || [];
    const pagination = historyData?.data?.pagination;

    async function handleReverse(transactionId) {

        setReversingId(transactionId);

        try {

            await transactionApi.reverse(transactionId);

            toast.success("Transaction reversed successfully");

            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["account"] });

        } catch (err) {

            const message = err.response?.data?.message || "Failed to reverse transaction";
            toast.error(message);

        } finally {
            setReversingId(null);
        }

    }

    return (
        <div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-sm text-gray-500 mt-1">All your incoming and outgoing transactions.</p>
            </div>

            <Card className="overflow-hidden">

              {isLoading ? (
                    <TableSkeleton />
                ) : transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-16">No transactions found.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-gray-500">
                                        <th className="px-6 py-3.5 font-medium">Type</th>
                                        <th className="px-6 py-3.5 font-medium">Amount</th>
                                        <th className="px-6 py-3.5 font-medium">Date</th>
                                        <th className="px-6 py-3.5 font-medium">Status</th>
                                        <th className="px-6 py-3.5 font-medium">Risk Score</th>
                                        <th className="px-6 py-3.5 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((txn) => {

                                        const isOutgoing = txn.fromAccount === account?._id;
                                        const canReverse =
                                            txn.status === "COMPLETED" && !txn.reversalOf;

                                        return (
                                            <tr key={txn._id} className="hover:bg-gray-50/60">

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                                            isOutgoing ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                                                        }`}>
                                                            {isOutgoing
                                                                ? <ArrowUpRight className="h-4 w-4" />
                                                                : <ArrowDownLeft className="h-4 w-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {isOutgoing ? "Sent" : "Received"}
                                                                {txn.reversalOf && (
                                                                    <span className="ml-1.5 text-xs text-gray-400 font-normal">(reversal)</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-mono">
                                                                {txn._id.slice(-8)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`font-semibold ${isOutgoing ? "text-gray-900" : "text-emerald-600"}`}>
                                                        {isOutgoing ? "-" : "+"}{formatCurrency(txn.amount)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-gray-500">
                                                    {formatDate(txn.createdAt)}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <Badge variant={statusVariant[txn.status]}>{txn.status}</Badge>
                                                </td>

                                                <td className="px-6 py-4 text-gray-500">
                                                    {txn.riskScore !== null && txn.riskScore !== undefined
                                                        ? (
                                                            <span className={txn.riskScore >= 0.5 ? "text-amber-600 font-medium" : "text-gray-400"}>
                                                                {(txn.riskScore * 100).toFixed(1)}%
                                                            </span>
                                                        )
                                                        : <span className="text-gray-300">—</span>}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    {canReverse && isOutgoing && (
                                                        <Button
                                                            variant="ghost"
                                                            className="!px-2.5 !py-1.5 text-xs"
                                                            isLoading={reversingId === txn._id}
                                                            onClick={() => handleReverse(txn._id)}
                                                        >
                                                            <Undo2 className="h-3.5 w-3.5" />
                                                            Reverse
                                                        </Button>
                                                    )}
                                                </td>

                                            </tr>
                                        );

                                    })}
                                </tbody>
                            </table>
                        </div>

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="!px-3 !py-1.5"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="!px-3 !py-1.5"
                                        disabled={page >= pagination.totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
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

export default HistoryPage;