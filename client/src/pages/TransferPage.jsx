import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { accountApi } from "../api/account.api";
import { transactionApi } from "../api/transaction.api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import ScheduledPayments from "../components/ScheduledPayments";
import FundAccountForm from "../components/FundAccountForm";
import { useAuthStore } from "../store/authStore";

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function TransferPage() {

    const navigate = useNavigate();

    const { data: accountData, isLoading: accountLoading } = useQuery({
        queryKey: ["account"],
        queryFn: accountApi.getMe
    });

    const account = accountData?.data;

     const queryClient = useQueryClient();



     const [form, setForm] = useState({ toAccount: "", amount: "" });


    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
     const user = useAuthStore((state) => state.user);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
        setSuccess(null);
    }

    function validate() {

        const newErrors = {};

        if (!form.toAccount || form.toAccount.trim().length !== 24) {
            newErrors.toAccount = "Enter a valid 24-character account ID";
        }

        if (form.toAccount.trim() === account?._id) {
            newErrors.toAccount = "You cannot transfer to your own account";
        }

        const amountNum = Number(form.amount);

        if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
            newErrors.amount = "Enter a valid amount greater than 0";
        } else if (account && amountNum > account.balance) {
            newErrors.amount = `Insufficient balance (available: ${formatCurrency(account.balance)})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;

    }

    async function handleSubmit(e) {

        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        setSuccess(null);

        try {

            const res = await transactionApi.transfer({
                fromAccount: account._id,
                toAccount: form.toAccount.trim(),
                amount: Number(form.amount),
                idempotencyKey: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
            });

            setSuccess(res.data);
            setForm({ toAccount: "", amount: "" });
            toast.success("Transfer completed successfully!");

            queryClient.invalidateQueries({ queryKey: ["account"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });

        } catch (err) {

            const message = err.response?.data?.message || "Transfer failed. Please try again.";

            if (err.response?.status === 403 && message.includes("flagged as high risk")) {
                toast.error("Transaction blocked by fraud detection system", { icon: "🛑" });
            } else {
                toast.error(message);
            }

        } finally {
            setIsSubmitting(false);
        }

    }

    if (accountLoading) {
        return <Spinner className="py-24" />;
    }

    return (
        <div className="max-w-lg">

            {user?.systemUser && (
                <div className="mb-6">
                    <FundAccountForm />
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
                <p className="text-sm text-gray-500 mt-1">Transfer funds to another account instantly.</p>
            </div>

            <Card className="p-6 mb-5 flex items-center justify-between bg-gray-50/60">
                <span className="text-sm text-gray-500">Available Balance</span>
                <span className="text-lg font-bold text-gray-900">
                    {account ? formatCurrency(account.balance) : "—"}
                </span>
            </Card>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <Input
                        label="Recipient Account ID"
                        name="toAccount"
                        placeholder="e.g. 6a4613477b24f544527b5a59"
                        value={form.toAccount}
                        onChange={handleChange}
                        error={errors.toAccount}
                    />

                    <Input
                        label="Amount (INR)"
                        name="amount"
                        type="number"
                        min="1"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={handleChange}
                        error={errors.amount}
                    />

                    <div className="flex items-start gap-2 text-xs text-gray-500 bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
                        <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        Every transfer is screened in real time by our fraud detection system before it's processed.
                    </div>

                    <Button type="submit" isLoading={isSubmitting} className="w-full">
                        <ArrowLeftRight className="h-4 w-4" />
                        Send {form.amount ? formatCurrency(Number(form.amount) || 0) : "Money"}
                    </Button>

                </form>
            </Card>

            {success && (
                <Card className="p-5 mt-5 border-emerald-200 bg-emerald-50/50">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-800">Transfer completed</p>
                            <p className="text-xs text-emerald-700 mt-1">
                                {formatCurrency(success.amount)} sent successfully. Transaction ID: <span className="font-mono">{success._id}</span>
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="mt-8">
                <ScheduledPayments />
            </div>

        </div>
    );

}

export default TransferPage;