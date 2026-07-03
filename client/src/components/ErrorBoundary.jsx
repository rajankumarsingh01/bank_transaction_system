import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {

    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false });
        window.location.href = "/dashboard";
    };

    render() {

        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="text-center max-w-sm">
                        <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-7 w-7 text-red-500" />
                        </div>
                        <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-sm text-gray-500 mb-6">
                            An unexpected error occurred. Please try reloading the page.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;

    }

}

export default ErrorBoundary;