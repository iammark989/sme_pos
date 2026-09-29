<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return back()->withErrors([
                'username' => 'The provided credentials are incorrect.',
            ])->onlyInput('username');
        }

        $request->session()->regenerate();

        $user = $request->user()->load(['role', 'branch']);

        if (!$user->is_active) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'username' => 'This account is inactive.',
            ])->onlyInput('username');
        }

        return redirect()->intended('/dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}