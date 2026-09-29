import { useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        SME POS
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={data.username}
                            onChange={(event) =>
                                setData('username', event.target.value)
                            }
                            autoComplete="username"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />

                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.username}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(event) =>
                                setData('password', event.target.value)
                            }
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />

                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}