import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import Sidebar from '../components/Sidebar';

const Settings = () => {
    const navigate = useNavigate();
    const { balance, user, authFetch, logout } = usePortfolio();

    const handleReset = async () => {
        if (!user) return;
        try {
            await authFetch(`/api/users/portfolio/${user.username}/reset`, { method: 'PUT' });
            alert('Balance reset to $1,000,000 successfully!');
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505] text-slate-200 font-sans antialiased selection:bg-indigo-500/30">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto relative p-8 md:p-12 gap-10">
                <header>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Account <span className="text-indigo-500">Profile</span></h1>
                    <p className="text-slate-400 mt-2 font-medium">Manage your trading account credentials and institutional tier access.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section 1: User Profile Mock Auth */}
                    <div className="p-8 bg-[#0a0a0c] border border-white/5 w-full rounded-[30px] flex flex-col gap-8 shadow-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">Authentication</h2>
                            <span className={`px-4 py-1.5 ${user ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} border rounded-xl text-xs font-black uppercase tracking-wider`}>
                                {user ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">USERNAME</h3>
                                    <p className="text-sm text-white mt-1 font-bold">{user?.username || 'Guest'}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">USER ID</h3>
                                    <p className="text-sm text-white mt-1 font-mono tracking-wider">user_{user?.id || 0}_live</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PASSWORD</h3>
                                    <p className="text-sm text-white mt-1 font-mono tracking-[0.3em]">********</p>
                                </div>
                                <button className="text-xs text-indigo-500 hover:text-white font-black uppercase transition-colors">Change</button>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DATE JOINED</h3>
                                    <p className="text-sm text-white mt-1 font-bold">FEBRUARY 14, 2026</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                             <button onClick={() => { logout(); navigate('/login'); }} className={`w-full py-4 text-xs font-black rounded-2xl border transition-all uppercase tracking-widest ${user ? 'bg-black text-slate-400 border-white/10 hover:bg-white/5' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:brightness-110'}`}>
                                {user ? 'Log Out of Node' : 'Log In to Node'}
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Account Factory Reset */}
                    <div className="p-8 bg-[#0a0a0c] border border-white/5 w-full rounded-[30px] flex flex-col gap-6 shadow-xl h-fit">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">Capital Base</h2>
                            <span className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider">Simulated</span>
                        </div>
                        
                        <div className="p-8 bg-indigo-500/5 rounded-[24px] border border-indigo-500/10 flex flex-col gap-6 text-center mt-4">
                            <div>
                                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">ACTIVE EQUITY</h3>
                                <p className="text-5xl text-white font-black mt-3 tracking-tighter italic">${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                            <p className="text-xs text-slate-400 font-medium px-4">This will wipe your active database state and return your equity back to the starting margin. Trade history is preserved.</p>
                            <button onClick={handleReset} className="mt-2 w-full py-4 bg-indigo-500 text-[#050505] font-black uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all shadow-xl shadow-indigo-500/10">
                                Soft Reset $1,000,000
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
