import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import toast from "react-hot-toast";

import { transactionApi } from "../api/transaction.api";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Button from "./ui/Button";

function FundAccountForm() {

    const queryClient = useQueryClient();
    const [form, setForm] = useState({ toAccount: "", amount: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {

        e.preventDefault();

        if (!form.toAccount || form.toAccount.trim().length !== 24) {
            toast.error("Enter a valid 24-character account ID");
            return;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        setIsSubmitting(true);

        try {

            await transactionApi.fundAccount({
                toAccount: form.toAccount.trim(),
                amount: Number(form.amount),
                idempotencyKey: `fund-${Date.now()}-${Math.random().toString(36).slice(2)}`
            });

            toast.success("Account funded successfully");
            setForm({ toAccount: "", amount: "" });

            queryClient.invalidateQueries({ queryKey: ["account"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fund account");
        } finally {
            setIsSubmitting(false);
        }

    }

    return (
        <Card className="p-6 border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4.5 w-4.5 text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-sm">System Fund Injection</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
                As a system user, you can inject funds into any account without balance restrictions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                <Button type="submit" isLoading={isSubmitting} className="w-full" variant="secondary">
                    Fund Account
                </Button>
            </form>
        </Card>
    );

}

export default FundAccountForm;