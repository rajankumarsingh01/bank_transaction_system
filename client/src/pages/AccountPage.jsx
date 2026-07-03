import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Shield, Snowflake, XCircle, PlayCircle, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

import { accountApi } from "../api/account.api";
import { useAuthStore } from "../store/authStore";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const statusVariant = {
    ACTIVE: "success",
    FROZEN: "warning",
    CLOSED: "danger"
};

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function AccountPage() {

    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);

    const { data: accountData, isLoading } = useQuery({
        queryKey: ["account"],
        queryFn: accountApi.getMe
    });

    const account = accountData?.data;

    async function handleStatusChange(newStatus) {

        const confirmMessages = {
            FROZEN: "Freeze your account? You won't be able to send money until it's reactivated.",
            ACTIVE: "Reactivate your account?",
            CLOSED: "Close your account permanently? This cannot be undone."
        };

        if (!window.confirm(confirmMessages[newStatus])) return;

        setIsUpdating(true);

        try {

            await accountApi.updateStatus(newStatus);

            toast.success(`Account ${newStatus.toLowerCase()} successfully`);
            queryClient.invalidateQueries({ queryKey: ["account"] });

        } catch (err) {

            const message = err.response?.data?.message || "Failed to update account status";
            toast.error(message);

        } finally {
            setIsUpdating(false);
        }

    }

    function copyAccountId() {
        navigator.clipboard.writeText(account._id);
        setCopied(true);
        toast.success("Account ID copied");
        setTimeout(() => setCopied(false), 2000);
    }

    if (isLoading) {
        return <Spinner className="py-24" />;
    }

    return (
        <div className="max-w-2xl space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your profile and account status.</p>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{user?.name}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Current Balance</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Account Status</p>
                        <Badge variant={statusVariant[account.status]}>{account.status}</Badge>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 text-sm">Account Details</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Account ID</span>
                        <button
                            onClick={copyAccountId}
                            className="flex items-center gap-1.5 font-mono text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            {account._id}
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Currency</span>
                        <span className="text-gray-700 font-medium">{account.currency}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500">Member Since</span>
                        <span className="text-gray-700 font-medium">
                            {new Date(account.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-amber-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Account Controls</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Manage your account's operational status. Closing requires a zero balance.
                </p>

                <div className="flex flex-wrap gap-2.5">

                    {account.status === "ACTIVE" && (
                        <Button
                            variant="secondary"
                            isLoading={isUpdating}
                            onClick={() => handleStatusChange("FROZEN")}
                        >
                            <Snowflake className="h-4 w-4" />
                            Freeze Account
                        </Button>
                    )}

                    {account.status === "FROZEN" && (
                        <Button
                            variant="secondary"
                            isLoading={isUpdating}
                            onClick={() => handleStatusChange("ACTIVE")}
                        >
                            <PlayCircle className="h-4 w-4" />
                            Reactivate Account
                        </Button>
                    )}

                    {account.status !== "CLOSED" && (
                        <Button
                            variant="danger"
                            isLoading={isUpdating}
                            onClick={() => handleStatusChange("CLOSED")}
                        >
                            <XCircle className="h-4 w-4" />
                            Close Account
                        </Button>
                    )}

                    {account.status === "CLOSED" && (
                        <p className="text-sm text-gray-400 italic">This account has been permanently closed.</p>
                    )}

                </div>
            </Card>

        </div>
    );

}

export default AccountPage;