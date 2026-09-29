import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import { usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Welcome, {user.first_name}!
                    </h2>

                    <p className="mt-2 text-gray-600">
                        You are logged in as {user.role?.name}.
                    </p>

                    {user.branch && (
                        <p className="mt-1 text-sm text-gray-500">
                            Branch: {user.branch.name}
                        </p>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}