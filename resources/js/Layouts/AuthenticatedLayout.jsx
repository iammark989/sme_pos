import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [storeMenuOpen, setStoreMenuOpen] = useState(false);

    const role = user.role?.name;

    const isManagementRole = ['Owner', 'Admin'].includes(role);
    const canViewReports = ['Owner', 'Admin', 'Accounting'].includes(role);
    const canViewInventory = ['Owner', 'Admin', 'Accounting'].includes(role);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setStoreMenuOpen(false);
    };

    const logout = () => {
        router.post('/logout');
    };

    const linkClass = ({ isActive = false } = {}) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
        }`;

    const navLinkClass =
        'block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-600';

    const currentPath = typeof window !== 'undefined'
        ? window.location.pathname
        : '';

    const pageLinkClass = (path) =>
        `${navLinkClass} ${
            currentPath === path || currentPath.startsWith(`${path}/`)
                ? 'bg-blue-50 text-blue-700'
                : ''
        }`;

    const renderNavigationLinks = (mobile = false) => {
        const closeIfMobile = mobile ? closeMobileMenu : undefined;

        return (
            <>
                <Link
                    href="/dashboard"
                    onClick={closeIfMobile}
                    className={pageLinkClass('/dashboard')}
                >
                    Dashboard
                </Link>

                {canViewReports && (
                    <Link
                        href="/reports"
                        onClick={closeIfMobile}
                        className={pageLinkClass('/reports')}
                    >
                        Reports
                    </Link>
                )}

                {canViewInventory && (
                    <>
                        <Link
                            href="/inventory"
                            onClick={closeIfMobile}
                            className={pageLinkClass('/inventory')}
                        >
                            Inventory
                        </Link>

                        <Link
                            href="/inventory-items"
                            onClick={closeIfMobile}
                            className={pageLinkClass('/inventory-items')}
                        >
                            Items
                        </Link>
                    </>
                )}

                {isManagementRole && (
                    <>
                        <Link
                            href="/products"
                            onClick={closeIfMobile}
                            className={pageLinkClass('/products')}
                        >
                            Products
                        </Link>

                        <Link
                            href="/users"
                            onClick={closeIfMobile}
                            className={pageLinkClass('/users')}
                        >
                            User Management
                        </Link>

                        {/* Desktop Store Management dropdown */}
                            <div className="relative hidden md:block">
                                <button
                                    type="button"
                                    onClick={() => setStoreMenuOpen((prev) => !prev)}
                                    aria-haspopup="true"
                                    aria-expanded={storeMenuOpen}
                                    className={`cursor-pointer flex items-center gap-2 ${navLinkClass}`}
                                >
                                    Store Management
                                    <span aria-hidden="true">
                                        {storeMenuOpen ? '▴' : '▾'}
                                    </span>
                                </button>

                                {storeMenuOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                        <Link
                                            href="/branches"
                                            onClick={() => setStoreMenuOpen(false)}
                                            className={pageLinkClass('/branches')}
                                        >
                                            Branch Management
                                        </Link>

                                        <Link
                                            href="/warehouses"
                                            onClick={() => setStoreMenuOpen(false)}
                                            className={pageLinkClass('/warehouses')}
                                        >
                                            Warehouse Management
                                        </Link>
                                    </div>
                                )}
                            </div>

                        {/* Mobile Store Management submenu */}
                        {mobile && (
                            <div className="md:hidden">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setStoreMenuOpen(!storeMenuOpen)
                                    }
                                    aria-expanded={storeMenuOpen}
                                    className={`${navLinkClass} flex w-full items-center justify-between`}
                                >
                                    Store Management
                                    <span aria-hidden="true">
                                        {storeMenuOpen ? '▴' : '▾'}
                                    </span>
                                </button>

                                {storeMenuOpen && (
                                    <div className="ml-3 mt-1 space-y-1 border-l-2 border-blue-100 pl-3">
                                        <Link
                                            href="/branches"
                                            onClick={closeIfMobile}
                                            className={pageLinkClass('/branches')}
                                        >
                                            Branch Management
                                        </Link>

                                        <Link
                                            href="/warehouses"
                                            onClick={closeIfMobile}
                                            className={pageLinkClass('/warehouses')}
                                        >
                                            Warehouse Management
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {role === 'Staff' && (
                    <Link
                        href="/pos"
                        onClick={closeIfMobile}
                        className={pageLinkClass('/pos')}
                    >
                        POS
                    </Link>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {/* Header row */}
                    <div className="flex min-h-16 items-center justify-between gap-4">
                        <Link
                            href="/dashboard"
                            className="shrink-0 text-xl font-bold text-gray-900"
                        >
                            SME POS
                        </Link>

                        {/* Desktop navigation */}
                        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
                            {renderNavigationLinks()}
                        </nav>

                        {/* Desktop user information */}
                        <div className="hidden shrink-0 items-center gap-4 md:flex">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                    {user.first_name} {user.last_name}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {role}
                                    {user.branch && ` • ${user.branch.name}`}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={logout}
                                className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            onClick={() =>
                                setMobileMenuOpen(!mobileMenuOpen)
                            }
                            aria-label={
                                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
                            }
                            aria-expanded={mobileMenuOpen}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
                        >
                            {mobileMenuOpen ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M6 6l12 12M18 6L6 18"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M4 6h16M4 12h16M4 18h16"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Mobile navigation panel */}
                    {mobileMenuOpen && (
                        <div className="border-t border-gray-200 py-4 md:hidden">
                            <nav className="space-y-1">
                                {renderNavigationLinks(true)}
                            </nav>

                            <div className="mt-4 border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-900">
                                    {user.first_name} {user.last_name}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    {role}
                                    {user.branch && ` • ${user.branch.name}`}
                                </p>

                                <button
                                    type="button"
                                    onClick={logout}
                                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
                {children}
            </main>
        </div>
    );
}