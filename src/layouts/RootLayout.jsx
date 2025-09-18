import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";

export default function RootLayout() {
    return (
        <div className="min-h-screen text-white bg-[#0b0f19]">
            <header className="sticky top-0 z-10 bg-black/40 backdrop-blur border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/app" className="text-lg font-semibold">DocGen</Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <NavLink
                            to="/app"
                            end
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-lg border transition ${isActive ? "border-white/40" : "border-white/10 hover:border-white/20"
                                }`
                            }
                        >
                            Templates
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
