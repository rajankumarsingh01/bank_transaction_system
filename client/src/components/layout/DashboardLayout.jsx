import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSocket } from "../../hooks/useSocket";

function DashboardLayout() {

    useSocket();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 max-w-6xl w-full overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );

}

export default DashboardLayout;