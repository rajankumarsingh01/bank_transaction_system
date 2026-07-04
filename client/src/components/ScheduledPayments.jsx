import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { scheduledPaymentApi } from "../api/scheduledPayment.api";
import { accountApi } from "../api/account.api";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const frequencyLabels = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly" };

function ScheduledPayments() {

    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ toAccount: "", amount: "", frequency: "MONTHLY" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: accountData } = useQuery({ queryKey: ["account"], queryFn: accountApi.getMe });
    const account = accountData?.data;

    const { data, isLoading } = useQuery({
        queryKey: ["scheduled-payments"],
        queryFn: scheduledPaymentApi.list
    });

    const payments = data?.data || [];

    async function handleCreate(e) {

        e.preventDefault();

        if (!form.toAccount || form.toAccount.length !== 24) {
            toast.error("Enter a valid 24-character account ID");
            return;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        setIsSubmitting(true);

        try {

            await scheduledPaymentApi.create({
                fromAccount: account._id,
                toAccount: form.toAccount.trim(),
                amount: Number(form.amount),
                frequency: form.frequency
            });

            toast.success("Recurring payment scheduled");
            setForm({ toAccount: "", amount: "", frequency: "MONTHLY" });
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["scheduled-payments"] });

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to schedule payment");
        } finally {
            setIsSubmitting(false);
        }

    }

    async function handleCancel(id) {

        if (!window.confirm("Cancel this recurring payment?")) return;

        try {
            await scheduledPaymentApi.cancel(id);
            toast.success("Payment schedule cancelled");
            queryClient.invalidateQueries({ queryKey: ["scheduled-payments"] });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel");
        }

    }

    return (
        <Card className="p-6">

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 text-sm">Recurring Payments</h3>
                </div>
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {showForm ? "Cancel" : "New Schedule"}
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="space-y-3 mb-5 p-4 bg-gray-50/60 rounded-xl">
                    <Input
                        label="Recipient Account ID"
                        value={form.toAccount}
                        onChange={(e) => setForm({ ...form, toAccount: e.target.value })}
                        placeholder="24-character account ID"
                    />
                    <Input
                        label="Amount (INR)"
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
                        <select
                            value={form.frequency}
                            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                    </div>
                    <Button type="submit" isLoading={isSubmitting} className="w-full">
                        Schedule Payment
                    </Button>
                </form>
            )}

            {isLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
            ) : payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No recurring payments set up yet.</p>
            ) : (
                <div className="space-y-2.5">
                    {payments.map((payment) => (
                        <div key={payment._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                    <RefreshCw className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatCurrency(payment.amount)} • {frequencyLabels[payment.frequency]}
                                    </p>
                                    <p className="text-xs text-gray-400 font-mono">To: {payment.toAccount.slice(-8)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={payment.status === "ACTIVE" ? "success" : "default"}>
                                    {payment.status}
                                </Badge>
                                {payment.status === "ACTIVE" && (
                                    <button
                                        onClick={() => handleCancel(payment._id)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </Card>
    );

}

export default ScheduledPayments;