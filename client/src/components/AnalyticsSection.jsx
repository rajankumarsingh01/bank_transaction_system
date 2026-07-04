import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

import { transactionApi } from "../api/transaction.api";
import Card from "./ui/Card";

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const COLORS = ["#ef4444", "#10b981"];

function AnalyticsSection() {

    const { data, isLoading } = useQuery({
        queryKey: ["analytics", 30],
        queryFn: () => transactionApi.getAnalytics(30)
    });

    const analytics = data?.data;

    if (isLoading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
                <div className="h-48 bg-gray-100 rounded" />
            </Card>
        );
    }

    if (!analytics || (analytics.summary.sentCount === 0 && analytics.summary.receivedCount === 0)) {
        return (
            <Card className="p-8 text-center">
                <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No activity in the last 30 days to analyze yet.</p>
            </Card>
        );
    }

    const { summary, dailyBreakdown } = analytics;

    const pieData = [
        { name: "Sent", value: summary.totalSent },
        { name: "Received", value: summary.totalReceived }
    ].filter((d) => d.value > 0);

    return (
        <div className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <Card className="p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                        <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                        Total Sent (30d)
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalSent)}</p>
                    <p className="text-xs text-gray-400 mt-1">{summary.sentCount} transactions</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                        Total Received (30d)
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalReceived)}</p>
                    <p className="text-xs text-gray-400 mt-1">{summary.receivedCount} transactions</p>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                        <Wallet className="h-3.5 w-3.5 text-indigo-500" />
                        Net Flow (30d)
                    </div>
                    <p className={`text-xl font-bold ${summary.netFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {summary.netFlow >= 0 ? "+" : ""}{formatCurrency(summary.netFlow)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">received − sent</p>
                </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                <Card className="p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Over Time</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={dailyBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDateShort}
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                axisLine={{ stroke: "#e2e8f0" }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `₹${v}`}
                            />
                            <Tooltip
                                formatter={(value) => formatCurrency(value)}
                                labelFormatter={formatDateShort}
                                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                            />
                            <Line type="monotone" dataKey="sent" stroke="#ef4444" strokeWidth={2} dot={false} name="Sent" />
                            <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} dot={false} name="Received" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Sent vs Received</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={4}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={entry.name} fill={entry.name === "Sent" ? COLORS[0] : COLORS[1]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {pieData.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: entry.name === "Sent" ? COLORS[0] : COLORS[1] }}
                                />
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </Card>

            </div>

        </div>
    );

}

export default AnalyticsSection;