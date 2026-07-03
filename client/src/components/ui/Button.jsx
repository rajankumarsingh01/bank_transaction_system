import clsx from "clsx";

function Button({ children, variant = "primary", isLoading, className, ...props }) {

    const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
        ghost: "text-gray-600 hover:bg-gray-100"
    };

    return (
        <button
            className={clsx(base, variants[variant], className)}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : null}
            {children}
        </button>
    );

}

export default Button;