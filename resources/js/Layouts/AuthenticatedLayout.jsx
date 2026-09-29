import { Link, router, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const logout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <Link
                            href="/dashboard"
                            className="text-xl font-bold text-gray-900"
                        >
                            SME POS
                        </Link>
                    </div>

                    <nav className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-700 hover:text-blue-600"
                        >
                            Dashboard
                        </Link>

                        {['Owner', 'Admin', 'Accounting'].includes(
                            user.role?.name
                        ) && (
                            <Link
                                href="/reports"
                                className="text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                Reports
                            </Link>
                        )}

                        {user.role?.name === 'Staff' && (
                            <Link
                                href="/pos"
                                className="text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                POS
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                                {user.first_name} {user.last_name}
                            </p>

                            <p className="text-xs text-gray-500">
                                {user.role?.name}
                                {user.branch && ` • ${user.branch.name}`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-6">
                {children}
            </main>
        </div>
    );
}