import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../api/auth.api";
import { accountApi } from "../api/account.api";
import { useAuthStore } from "../store/authStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function RegisterPage() {

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    }

    function validate() {

        const newErrors = {};

        if (!form.name || form.name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        if (!form.email) {
            newErrors.email = "Email is required";
        }

        if (!form.password || form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;

    }

    async function handleSubmit(e) {

        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {

            const res = await authApi.register(form);

            setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

            // Auto-create account right after registration for a smoother onboarding flow
            try {
                await accountApi.create();
            } catch (accErr) {
                // Non-fatal — user can still be redirected, dashboard will prompt if no account exists
                console.error("Account auto-creation failed:", accErr);
            }

            toast.success("Account created successfully!");
            navigate("/dashboard");

        } catch (err) {

            const message = err.response?.data?.message || "Registration failed. Please try again.";
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
                    <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                    <p className="text-sm text-gray-500 mt-1">Start managing your finances with Ledger</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <Input
                            label="Full name"
                            type="text"
                            name="name"
                            placeholder="Rajan Kumar Singh"
                            value={form.name}
                            onChange={handleChange}
                            error={errors.name}
                        />

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
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            error={errors.password}
                        />

                        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                            Create account
                        </Button>

                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    );

}

export default RegisterPage;