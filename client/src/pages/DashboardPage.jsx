import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, AlertCircle } from "lucide-react";

import { accountApi } from "../api/account.api";
import { transactionApi } from "../api/transaction.api";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import AnalyticsSection from "../components/AnalyticsSection";

const statusVariant = {
    COMPLETED: "success",
    PENDING: "warning",
    FAILED: "danger",
    REVERSED: "default"
};

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function DashboardPage() {

    const user = useAuthStore((state) => state.user);

    const {
        data: accountData,
        isLoading: accountLoading,
        isError: accountError
    } = useQuery({
        queryKey: ["account"],
        queryFn: accountApi.getMe,
        retry: false
    });

    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ["transactions", 1],
        queryFn: () => transactionApi.getHistory(1, 5),
        enabled: !!accountData
    });

    const account = accountData?.data;
    const transactions = historyData?.data?.transactions || [];

   if (accountLoading) {
        return <DashboardSkeleton />;
    }

    if (accountError || !account) {
        return (
            <Card className="p-10 text-center max-w-md mx-auto mt-12">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No account found</h2>
                <p className="text-sm text-gray-500 mb-6">You don't have a ledger account yet. Create one to get started.</p>
                <CreateAccountButton />
            </Card>
        );
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening with your account today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Card className="p-6 col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-indigo-200 text-sm">
                            <Wallet className="h-4 w-4" />
                            Available Balance
                        </div>
                        <Badge variant={account.status === "ACTIVE" ? "success" : "warning"}>
                            {account.status}
                        </Badge>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
                    <p className="text-indigo-200 text-xs mt-2 font-mono">A/C: {account._id}</p>
                </Card>

                <Card className="p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                        <TrendingUp className="h-4 w-4" />
                        Quick Actions
                    </div>
                    <div className="space-y-2">
                        <Link to="/transfer">
                            <Button className="w-full justify-start" variant="secondary">
                                <ArrowUpRight className="h-4 w-4" /> Send Money
                            </Button>
                        </Link>
                        <Link to="/history">
                            <Button className="w-full justify-start" variant="secondary">
                                <ArrowDownLeft className="h-4 w-4" /> View History
                            </Button>
                        </Link>
                    </div>
                </Card>

            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
                    <Link to="/history" className="text-sm text-indigo-600 font-medium hover:underline">
                        View all
                    </Link>
                </div>

              {historyLoading ? (
                    <div className="space-y-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                                    <div className="space-y-1.5">
                                        <div className="h-3.5 w-16 bg-gray-200 rounded" />
                                        <div className="h-3 w-14 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No transactions yet.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((txn) => {

                            const isOutgoing = txn.fromAccount === account._id;

                            return (
                                <div key={txn._id} className="flex items-center justify-between py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                            isOutgoing ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                                        }`}>
                                            {isOutgoing ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownLeft className="h-4.5 w-4.5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {isOutgoing ? "Sent" : "Received"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${isOutgoing ? "text-gray-900" : "text-emerald-600"}`}>
                                            {isOutgoing ? "-" : "+"}{formatCurrency(txn.amount)}
                                        </p>
                                        <Badge variant={statusVariant[txn.status]}>{txn.status}</Badge>
                                    </div>
                                </div>
                            );

                        })}
                    </div>
                )}
            </Card>

             <div>
                <h2 className="font-semibold text-gray-900 mb-4">Spending Insights</h2>
                <AnalyticsSection />
            </div>

        </div>
    );

}

function CreateAccountButton() {

    const handleCreate = async () => {
        try {
            const { accountApi } = await import("../api/account.api");
            await accountApi.create();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    return <Button onClick={handleCreate}>Create Account</Button>;

}

export default DashboardPage;