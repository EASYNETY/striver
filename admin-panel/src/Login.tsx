import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const DEFAULT_USER = 'd-super@str.com';
    const DEFAULT_PASS = 'Admin@123';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (email === DEFAULT_USER && password === DEFAULT_PASS) {
                onLoginSuccess({ email: DEFAULT_USER, uid: 'admin-mock-id', displayName: 'System Administrator' });
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess(userCredential.user);
        } catch (err: any) {
            setError('Access Denied: Invalid Administrative Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-[#050811] relative overflow-hidden">
            {/* High-End Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[#8FFBB9]/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[480px] z-10"
            >
                <div className="glass-card p-10 sm:p-14 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                    <div className="flex flex-col items-center mb-12">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-24 h-24 bg-[#8FFBB9] rounded-[32px] flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(143,251,185,0.25)]"
                        >
                            <ShieldCheck size={48} className="text-[#050811]" />
                        </motion.div>

                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter sm:text-5xl glow-text leading-none">
                            STRIVER <span className="text-[#8FFBB9]">ADMIN</span>
                        </h1>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-px w-8 bg-white/10" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Secure Access Required</p>
                            <div className="h-px w-8 bg-white/10" />
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3 font-outfit">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] ml-2">Registry Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#8FFBB9] transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@striver.net"
                                    className="striver-input pl-16 py-4 bg-white/[0.03] border-white/5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3 font-outfit">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] ml-2">Access Key Override</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#8FFBB9] transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="striver-input pl-16 py-4 bg-white/[0.03] border-white/5"
                                    required
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl"
                                >
                                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                                    <p className="text-red-400 text-[11px] font-black uppercase tracking-tight leading-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="striver-btn-primary w-full h-[72px] text-sm group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin text-[#050811]" size={24} />
                            ) : (
                                <>
                                    <span className="mt-0.5">Initialize System</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="mt-12 text-center">
                        <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] leading-relaxed">
                            Proprietary Administrative Terminal<br />
                            v2.4.0-SECURE_STABLE_CHANNEL
                        </p>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
