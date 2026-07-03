function Spinner({ className }) {
    return (
        <div className={`flex items-center justify-center ${className || "py-12"}`}>
            <div className="h-6 w-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );
}

export default Spinner;