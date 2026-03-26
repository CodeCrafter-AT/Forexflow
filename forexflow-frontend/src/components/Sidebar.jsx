import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Calculator, LineChart, LayoutGrid, Settings as SettingsIcon, PieChart } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    
    const links = [
        { to: "/", icon: Calculator, label: "Converter" },
        { to: "/analysis", icon: LineChart, label: "Analysis" },
        { to: "/dashboard", icon: LayoutGrid, label: "Live Desk" },
        { to: "/pnl", icon: PieChart, label: "PnL" },
        { to: "/settings", icon: SettingsIcon, label: "Settings" }
    ];

    return (
        <aside className="w-20 lg:w-64 bg-[#0a0a0c] border-r border-white/5 flex flex-col shrink-0 z-20">
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        <Activity className="size-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight hidden lg:block">Forex<span className="text-indigo-500">Flow</span></span>
                </div>
            </div>
            <nav className="flex-1 py-6 px-3 lg:px-4 space-y-2">
                {links.map((link) => {
                    const isActive = location.pathname === link.to;
                    const Icon = link.icon;
                    return (
                        <Link 
                            key={link.to} 
                            to={link.to} 
                            className={`flex items-center justify-center lg:justify-start gap-4 px-3 lg:px-4 py-3 rounded-xl font-medium transition-all group ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <Icon className={`size-5 ${isActive ? '' : 'group-hover:text-indigo-400 transition-colors'}`} />
                            <span className="text-sm hidden lg:block tracking-widest">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
