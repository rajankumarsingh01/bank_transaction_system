import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function LoginPage() {

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    }

    async function handleSubmit(e) {

        e.preventDefault();

        if (!form.email || !form.password) {
            setErrors({
                email: !form.email ? "Email is required" : null,
                password: !form.password ? "Password is required" : null
            });
            return;
        }

        setIsLoading(true);

        try {

            const res = await authApi.login(form);

            setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

            toast.success(`Welcome back, ${res.data.user.name}!`);
            navigate("/dashboard");

        } catch (err) {

            const message = err.response?.data?.message || "Login failed. Please try again.";
            toast.error(message);

        } finally {
            setIsLoading(false);
        }

    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">

                <div className="flex flex-col items-center mb-8">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
                        <Landmark className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to your Ledger account</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            error={errors.password}
                        />

                        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                            Sign in
                        </Button>

                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        Create one
                    </Link>
                </p>

            </div>
        </div>
    );

}

export default LoginPage;