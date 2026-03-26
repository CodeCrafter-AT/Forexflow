import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, KeyRound, ShieldCheck } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

const Login = () => {
    const { authenticate } = usePortfolio();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authenticate(isRegister ? 'register' : 'login', username, password);
        } catch (err) {
            setError(err.message || 'Authentication failed');
        }
        setIsLoading(false);
    };

    return (
        <div className="h-screen w-full bg-[#121212] flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FF88]/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md p-8 bg-black/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl z-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF88] to-transparent"></div>
                
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,136,0.15)]">
                        <ShieldCheck className="w-8 h-8 text-[#00FF88]" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase">The Vault</h1>
                    <p className="text-[#00FF88]/60 text-xs font-bold tracking-[0.2em] uppercase mt-2">Institutional Routing Protocol</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-medium text-center shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="size-5 text-slate-500 group-focus-within:text-[#00FF88] transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF88]/50 focus:bg-white/10 transition-all font-medium"
                                placeholder="Terminal ID"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <KeyRound className="size-5 text-slate-500 group-focus-within:text-[#00FF88] transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF88]/50 focus:bg-white/10 transition-all font-medium font-mono"
                                placeholder="Access Key"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Decrypting...' : (isRegister ? 'Initialize Whale Protocol' : 'Unlock Terminal')}
                    </button>
                    
                    <div className="text-center pt-4">
                        <button 
                            type="button" 
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs text-slate-400 hover:text-white font-medium uppercase tracking-widest transition-colors"
                        >
                            {isRegister ? 'Switch to Unlock Protocol' : 'Register New Whale Instance'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
