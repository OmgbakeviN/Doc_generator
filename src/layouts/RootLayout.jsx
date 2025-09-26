import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";

export default function RootLayout() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/app" className="text-lg font-semibold text-slate-800 hover:text-slate-900 transition-colors">DocGen</Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <NavLink
                            to="/app"
                            end
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-lg border transition-colors duration-200 font-medium ${isActive
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800"
                                }`
                            }
                        >
                            Templates
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 bg-white rounded-lg shadow-sm border border-slate-200 mt-4">
                <Outlet />
            </main>
        </div>
    );
}
