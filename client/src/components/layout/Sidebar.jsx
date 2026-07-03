import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, History, User, Landmark, LogOut, Menu, X } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/authStore";

const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/transfer", label: "Transfer", icon: ArrowLeftRight },
    { to: "/history", label: "History", icon: History },
    { to: "/account", label: "Account", icon: User }
];

function Sidebar() {

    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);

    async function handleLogout() {

        try {
            await authApi.logout();
        } catch (err) {
            // Non-fatal — proceed with local logout regardless
        }

        logout();
        toast.success("Logged out successfully");
        navigate("/login");

    }

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between px-6 h-16 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Landmark className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="font-semibold text-white text-[15px]">Ledger</span>
                </div>
                <button className="md:hidden text-gray-400" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`
                        }
                    >
                        <Icon className="h-4.5 w-4.5" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-gray-800">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm font-semibold shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="h-4.5 w-4.5" />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 flex items-center justify-between px-4 z-30">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Landmark className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">Ledger</span>
                </div>
                <button className="text-gray-300" onClick={() => setIsOpen(true)}>
                    <Menu className="h-5.5 w-5.5" />
                </button>
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar — desktop static, mobile slide-in */}
            <aside
                className={`w-64 bg-gray-900 text-gray-300 flex flex-col h-screen fixed md:sticky top-0 z-50 transition-transform duration-200 ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                {sidebarContent}
            </aside>
        </>
    );

}

export default Sidebar;