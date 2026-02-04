'use client';

import { Bell, Search, Calendar as CalendarIcon, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Navbar() {
    const today = new Date();

    return (
        <header className="py-6 px-8 flex items-center justify-between relative z-10">
            {/* Search Bar Refined */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-secondary group-focus-within:text-indigo-400 transition-colors" size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar alumnos, pagos o estados..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-secondary/50"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                        <div className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-secondary">
                            ⌘ K
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                {/* Date Display */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <CalendarIcon size={16} className="text-indigo-400" />
                    <div className="text-xs">
                        <p className="font-bold text-white capitalize">{format(today, 'EEEE, d MMM', { locale: es })}</p>
                        <p className="text-[10px] text-secondary">Jornada de Cobros</p>
                    </div>
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                    <Bell size={20} className="text-white group-hover:rotate-12 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#050508] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                </button>

                {/* Quick Action */}
                <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl font-bold text-sm transition-all">
                    <Zap size={16} />
                    <span>Quick Tip</span>
                </button>
            </div>
        </header>
    );
}
