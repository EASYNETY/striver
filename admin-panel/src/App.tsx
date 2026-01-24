import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, functions, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  onSnapshot,
  limit,
  orderBy,
  where
} from 'firebase/firestore';
import {
  BarChart3,
  Users,
  Video,
  ShieldCheck,
  Settings,
  TrendingUp,
  Search,
  LayoutDashboard,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  Bell,
  HardDrive,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  Menu,
  X,
  UserCheck,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Login from './Login';

/**
 * Robust Function Caller with resilience against CORS/404 
 */
const safeCall = async (fnName: string, data: any = {}) => {
  try {
    const fn = httpsCallable(functions, fnName);
    const res: any = await fn(data);
    return res.data;
  } catch (err: any) {
    console.warn(`[SafeCall] Function ${fnName} failed:`, err.message);

    // Provide intelligent mock fallback to keep the UI alive during deployment/cors issues
    if (fnName === 'getPlatformStats') {
      return {
        totalUsers: '0 (Syncing)',
        totalVideos: '0',
        pendingVideos: '0',
        totalSquads: '0',
        activityGoo: [
          { name: '...', active: 0 }
        ]
      };
    }
    throw err;
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hierarchyFilter, setHierarchyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Auth Protection
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (authUser) => {
      if (!authUser && user?.uid === 'admin-mock-id') {
      } else {
        setUser(authUser);
      }
      setAuthChecking(false);
    });
    return () => unsubAuth();
  }, [user]);

  // Real-time Data Hub
  useEffect(() => {
    if (!user) return;

    // 1. Live Users - Registry
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(500)),
      (snap) => setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => { console.error("Users sync failed:", err); setIsOffline(true); }
    );

    // 2. Global Stream - Posts (Moderation)
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => setAllPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Posts sync failed:", err)
    );

    // 3. Identification Checks - Verification
    const unsubVerify = onSnapshot(
      query(collection(db, 'users'), where('parentPictureVerified', '==', false), limit(50)),
      (snap) => {
        setVerificationQueue(snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((u: any) => u.verification_photo)
        );
      }
    );

    // 4. Kernel Event Log
    const unsubLogs = onSnapshot(
      query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(30)),
      (snap) => setSystemLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    // 5. Global Metrics Sync
    const fetchStats = async () => {
      const data = await safeCall('getPlatformStats');
      if (data) setStats(data);
    };
    fetchStats();
    const statsTimer = setInterval(fetchStats, 60000);

    return () => {
      unsubUsers(); unsubPosts(); unsubVerify(); unsubLogs();
      clearInterval(statsTimer);
    };
  }, [user]);

  // Real-time Search Engine
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return users.filter(u => {
      const matchSearch = !search || u.username?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search) || u.id.toLowerCase().includes(search);
      const matchRole = hierarchyFilter === 'all' || (hierarchyFilter === 'admin' && u.role === 'admin') || (hierarchyFilter === 'supervisor' && u.role === 'supervisor');
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, hierarchyFilter]);

  const filteredPosts = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return allPosts.filter(p => !search || p.title?.toLowerCase().includes(search) || p.username?.toLowerCase().includes(search));
  }, [allPosts, searchTerm]);

  // Admin Actions
  const handleRoleChange = async (uid: string, role: string) => {
    setLoading(true);
    try {
      await safeCall('updateUserRole', { targetUid: uid, role });
    } catch (err: any) {
      alert("Elevation error. Ensure Cloud Functions are deployed to us-central1 and CORS is enabled.");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (videoId: string, status: string) => {
    try {
      await safeCall('moderateVideo', { videoId, status });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleVerification = async (userId: string, isVerified: boolean) => {
    try {
      await safeCall('verifyParentPicture', { userId, isVerified });
    } catch (err: any) {
      console.error(err);
    }
  };

  if (authChecking) return <LoadingScreen />;
  if (!user) return <Login onLoginSuccess={(u) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-[#050811] overflow-hidden text-white font-outfit relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Structural Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-[320px] bg-[#050811] border-r border-white/5 flex flex-col z-[70] transition-transform duration-500 ease-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-10 lg:p-12 pb-16 flex items-center justify-between">
          <div className="flex items-center gap-5 group">
            <div className="w-12 h-12 bg-[#8FFBB9] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#8FFBB9]/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} className="text-[#050811]" />
            </div>
            <div>
              <h1 className="text-2xl font-black glow-text tracking-tighter italic leading-none">STRIVER</h1>
              <span className="text-[9px] font-black text-white/20 tracking-[0.3em] uppercase mt-1 block">ADMIN CORE</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Users size={20} />} label="Baller Registry" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Video size={20} />} label="Moderation" active={activeTab === 'videos'} onClick={() => { setActiveTab('videos'); setIsSidebarOpen(false); }} count={filteredPosts.filter(p => p.status === 'pending').length} />
          <NavItem icon={<UserCheck size={20} />} label="Verifications" active={activeTab === 'verify'} onClick={() => { setActiveTab('verify'); setIsSidebarOpen(false); }} count={verificationQueue.length} />
          <NavItem icon={<Activity size={20} />} label="Analytics" active={activeTab === 'insights'} onClick={() => { setActiveTab('insights'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="p-8 border-t border-white/5 bg-white/[0.01]">
          <div className="glass-card p-4 bg-white/[0.02] border-white/5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user.email}&background=8FFBB9&color=050811`} className="w-full h-full object-cover" alt="User" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black truncate uppercase italic leading-none">{user.displayName || 'Root'}</p>
              <p className="text-[8px] font-bold text-[#8FFBB9] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8FFBB9] animate-pulse" /> LIVE
              </p>
            </div>
          </div>
          <button onClick={async () => { await signOut(auth); setUser(null); }} className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-all font-black text-[9px] uppercase tracking-widest border border-transparent hover:border-red-400/10">
            <LogOut size={14} /> TERMINATE
          </button>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-striver-dark">
        {isOffline && (
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-8 py-3 flex items-center justify-center gap-3">
            <WifiOff size={16} className="text-orange-400" />
            <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Network Synchronization Offline. Check Firebase Console & Cloud Functions Deployment.</p>
          </div>
        )}

        <header className="h-20 lg:h-28 px-6 lg:px-16 flex items-center justify-between border-b border-white/5 bg-[#050811]/40 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4 lg:gap-8">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <Menu size={22} />
            </button>
            <div className="hidden sm:block h-10 w-1 bg-[#8FFBB9] rounded-full shadow-[0_0_15px_#8FFBB9]" />
            <h2 className="text-xl lg:text-3xl font-black tracking-tighter uppercase italic leading-none whitespace-nowrap">
              {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex-1 max-w-[600px] mx-10 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#8FFBB9] transition-colors" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Global Live Registry Query..."
                className="w-full bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-10 py-4 text-sm focus:outline-none focus:border-[#8FFBB9]/40 focus:bg-white/[0.06] transition-all font-bold tracking-tight"
              />
            </div>
          </div>

          <div className="flex gap-3 lg:gap-5 shrink-0">
            <IconBtn icon={<Bell size={20} />} badge />
            <IconBtn icon={<Settings size={20} />} className="hidden sm:flex" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-16 py-8 lg:py-16 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView stats={stats} logs={systemLogs} key="dashboard" />}
            {activeTab === 'users' && <UsersView users={filteredUsers} onPromote={handleRoleChange} loading={loading} filter={hierarchyFilter} setFilter={setHierarchyFilter} key="users" />}
            {activeTab === 'videos' && <VideosView videos={filteredPosts} onAction={handleModerate} key="videos" />}
            {activeTab === 'verify' && <VerificationsView queue={verificationQueue} onAction={handleVerification} key="verifications" />}
            {activeTab === 'insights' && <EmptyState key="insights" title="Goo Brain Metrics" desc="Proprietary behavioral analytics." icon={<Activity size={64} />} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const DashboardView = ({ stats, logs }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 lg:space-y-16 max-w-[1600px] mx-auto pb-40">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
      <StatTile label="Total Ballers" value={stats?.totalUsers || '...'} trend="+14%" icon={<Users className="text-[#8FFBB9]" />} />
      <StatTile label="Processing Queue" value={stats?.pendingVideos || '0'} trend="Live" isWarning={stats?.pendingVideos > 15} icon={<Video className="text-orange-400" />} />
      <StatTile label="Active Squads" value={stats?.totalSquads || '...'} trend="Synced" icon={<TrendingUp className="text-purple-400" />} />
      <StatTile label="System Assets" value={stats?.totalVideos || '...'} trend="99%" icon={<BarChart3 className="text-blue-400" />} />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
      <div className="xl:col-span-2 glass-card p-8 lg:p-12 min-h-[450px] lg:h-[640px] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Engagement Goo</h3>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Platform Activity Metrics</p>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black text-[#8FFBB9] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8FFBB9] animate-ping" /> REALTIME STREAM
          </div>
        </div>
        <div className="flex-1 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.activityGoo || []}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8FFBB9" stopOpacity={0.4} /><stop offset="100%" stopColor="#8FFBB9" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff08" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#ffffff08" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#050811', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }} />
              <Area type="monotone" dataKey="active" stroke="#8FFBB9" fill="url(#g)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8 lg:p-10 bg-white/[0.01] flex flex-col border-white/10 h-full max-h-[640px]">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center justify-between text-[#8FFBB9]">System Logs <RefreshCw size={18} className="animate-spin-slow" /></h3>
        <div className="space-y-8 flex-1 overflow-y-auto px-1 custom-scrollbar">
          {logs?.map((l: any) => (
            <LogItem key={l.id} title={l.type.toUpperCase()} desc={l.details} time={l.timestamp?.toDate() ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(l.timestamp.toDate()) : '...'} />
          ))}
          {!logs?.length && <div className="p-10 text-center text-white/5 font-black uppercase text-[10px]">Awaiting signals...</div>}
        </div>
      </div>
    </div>
  </motion.div>
);

const UsersView = ({ users, onPromote, loading, filter, setFilter }: any) => (
  <div className="space-y-10 lg:space-y-12 max-w-[1600px] mx-auto pb-40">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
      <div className="space-y-2">
        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Registry</h3>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Peer Access Control</p>
      </div>
      <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
        <TabBtn label="Index" active={filter === 'all'} onClick={() => setFilter('all')} />
        <TabBtn label="Admins" active={filter === 'admin'} onClick={() => setFilter('admin')} />
        <TabBtn label="Supervisors" active={filter === 'supervisor'} onClick={() => setFilter('supervisor')} />
      </div>
    </div>

    <div className="glass-card overflow-hidden shadow-2-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-white/[0.005]">
            <tr className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
              <th className="py-10 px-14">Subject Profile</th>
              <th className="py-10 px-6 text-center whitespace-nowrap">Status</th>
              <th className="py-10 px-6">Hierarchy</th>
              <th className="py-10 px-14 text-right">Command</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-all group">
                <td className="py-8 px-14">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden bg-white/5 group-hover:border-[#8FFBB9]/40 transition-all shrink-0 p-0.5">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=0a1128&color=ffffff`} className="w-full h-full rounded-[14px] object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xl italic uppercase font-outfit tracking-tighter leading-none mb-2 group-hover:text-[#8FFBB9] transition-colors truncate">{u.username || 'BALLER'}</p>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-8 px-6 text-center">
                  <div className={`inline-block px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${u.role === 'admin' ? 'border-purple-500/40 text-purple-400 bg-purple-500/5' : u.role === 'supervisor' ? 'border-blue-500/40 text-blue-400 bg-blue-500/5' : 'border-white/10 text-white/20 bg-white/5'}`}>{u.role || 'Player'}</div>
                </td>
                <td className="py-8 px-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} className={u.career_tier_id === 'legend' ? 'text-[#8FFBB9]' : 'text-white/10'} />
                    <span className={`text-[12px] font-black uppercase italic tracking-tighter shrink-0 ${u.career_tier_id === 'legend' ? 'text-white' : 'text-white/30'}`}>{u.career_tier_id || 'Prospect'}</span>
                  </div>
                </td>
                <td className="py-8 px-14 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button disabled={loading} onClick={() => onPromote(u.id, 'supervisor')} className="px-5 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20">PROMPT: SUP</button>
                    <button disabled={loading} onClick={() => onPromote(u.id, 'admin')} className="px-5 py-3 rounded-xl bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase hover:bg-purple-500 hover:text-white transition-all border border-purple-500/20">PROMPT: ADM</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const VideosView = ({ videos, onAction }: any) => (
  <div className="space-y-12 max-w-[1600px] mx-auto pb-40">
    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Moderation Buffer <span className="text-white/20 ml-6">[{videos.length}]</span></h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12">
      {videos.map((v: any) => (
        <motion.div layout key={v.id} className="glass-card group hover:border-[#8FFBB9]/20 transition-all flex flex-col min-h-[440px]">
          <div className="aspect-video relative overflow-hidden bg-black shrink-0">
            <video src={v.videoUrl} className="w-full h-full object-cover" controls playsInline />
            {v.status === 'pending' && <div className="absolute top-6 right-6 px-3 py-1.5 bg-orange-400 text-black font-black text-[9px] uppercase rounded-lg shadow-xl animate-pulse">INGRESS</div>}
          </div>
          <div className="p-8 space-y-10 flex-1 flex flex-col">
            <div className="flex-1">
              <p className="text-[9px] font-black text-[#8FFBB9] uppercase tracking-widest mb-2 opacity-60">ID: {v.id.slice(0, 10)}</p>
              <p className="text-xl font-black italic uppercase tracking-tighter leading-tight line-clamp-1">{v.title || 'UNLABELED'}</p>
              <p className="text-[10px] font-bold text-white/20 uppercase mt-3">Identity: <span className="text-white/60">@{v.username || v.userId?.slice(0, 8)}</span> • {v.status}</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => onAction(v.id, 'active')} className="striver-btn-primary w-full py-4 text-[10px]">AUTHORIZE ASSET</button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => onAction(v.id, 'warning')} className="py-4 border border-orange-500/20 text-orange-400 font-black text-[9px] rounded-xl hover:bg-orange-500 hover:text-black transition-all">WARNING</button>
                <button onClick={() => onAction(v.id, 'rejected')} className="py-4 border border-red-500/20 text-red-500 font-black text-[9px] rounded-xl hover:bg-red-500 hover:text-white transition-all">TAKEDOWN</button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    {!videos.length && <EmptyState title="Visuals Secure" desc="Global ingress stream is fully validated." icon={<Video size={64} />} />}
  </div>
);

const VerificationsView = ({ queue, onAction }: any) => (
  <div className="space-y-12 max-w-[1600px] mx-auto pb-40">
    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Identity Confirmations <span className="text-white/20 ml-6">[{queue.length}]</span></h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
      {queue.map((u: any) => (
        <motion.div layout key={u.id} className="glass-card group hover:border-[#8FFBB9]/20 transition-all flex flex-col min-h-[500px]">
          <div className="aspect-[4/5] relative overflow-hidden bg-black shrink-0">
            <img src={u.verification_photo} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" alt="Identity" />
            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-transparent">
              <p className="text-[10px] font-black text-[#8FFBB9] uppercase tracking-widest mb-1">Subject Registry</p>
              <p className="text-3xl font-black text-white italic uppercase tracking-tighter truncate">@{u.username || 'BALLER'}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase mt-1">{u.email}</p>
            </div>
          </div>
          <div className="p-8 lg:p-10 space-y-4">
            <button onClick={() => onAction(u.id, true)} className="striver-btn-primary w-full py-5 text-[10px]">CONFIRM IDENTITY</button>
            <button onClick={() => onAction(u.id, false)} className="py-4 w-full border border-red-500/20 text-red-500 rounded-xl font-black text-[9px] uppercase hover:bg-red-500 hover:text-white transition-all">DENY ACCESS</button>
          </div>
        </motion.div>
      ))}
    </div>
    {!queue.length && <EmptyState title="Security Solid" desc="No unauthorized identities detected in queue." icon={<ShieldCheck size={64} />} />}
  </div>
);

// Helpers
const NavItem = ({ icon, label, active, onClick, count }: any) => (
  <button onClick={onClick} className={`flex items-center gap-5 w-full px-6 lg:px-8 py-5 rounded-[24px] transition-all relative group overflow-hidden ${active ? 'bg-[#8FFBB9] text-[#050811] font-black shadow-2xl shadow-[#8FFBB9]/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
    <div className={active ? 'scale-110' : 'group-hover:scale-110 transition-transform shrink-0'}>{icon}</div>
    <span className="text-[12px] font-black uppercase italic tracking-[0.2em] truncate">{label}</span>
    {count !== undefined && count > 0 && <span className={`ml-auto px-2.5 py-1 rounded-lg text-[9px] font-black shrink-0 ${active ? 'bg-[#050811] text-[#8FFBB9]' : 'bg-[#8FFBB9] text-[#050811]'}`}>{count}</span>}
  </button>
);

const StatTile = ({ label, value, trend, icon, isWarning }: any) => (
  <div className={`glass-card p-8 lg:p-10 group transition-all duration-500 ${isWarning ? 'border-orange-500/30 bg-orange-500/[0.02]' : 'hover:border-[#8FFBB9]/30'}`}>
    <div className="flex justify-between items-start mb-10 relative z-10">
      <div className={`p-5 rounded-3xl border border-white/5 ${isWarning ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-[#8FFBB9]'}`}>{icon}</div>
      <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-white/30 tracking-tight">{trend}</span>
    </div>
    <div className="relative z-10">
      <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 truncate">{label}</p>
      <h4 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter truncate leading-none">{value}</h4>
    </div>
  </div>
);

const LogItem = ({ title, desc, time }: any) => (
  <div className="flex gap-5 items-start group border-l-2 border-white/5 hover:border-[#8FFBB9]/40 pl-5 py-0.5 transition-all">
    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#8FFBB9] shadow-[0_0_10px_#8FFBB9] shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-black text-white uppercase italic group-hover:text-[#8FFBB9] transition-colors leading-none truncate mb-1.5">{title}</p>
      <p className="text-xs text-white/20 font-medium truncate leading-relaxed">{desc}</p>
      <p className="text-[8px] font-black text-white/5 mt-2 uppercase tracking-widest">{time}</p>
    </div>
  </div>
);

const EmptyState = ({ title, desc, icon }: any) => (
  <div className="h-[400px] lg:h-[600px] flex flex-col items-center justify-center glass-card border-dashed border-white/10 bg-white/[0.005]">
    <div className="mb-10 text-white/5 animate-pulse shrink-0">{icon}</div>
    <h3 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter mb-4 text-center px-4">{title}</h3>
    <p className="text-white/20 max-w-sm text-center font-bold text-[11px] tracking-widest leading-relaxed uppercase px-8">{desc}</p>
  </div>
);

const TabBtn = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`px-6 lg:px-10 py-3 rounded-xl lg:rounded-[14px] text-[10px] font-black uppercase tracking-widest italic transition-all duration-500 whitespace-nowrap ${active ? 'bg-[#8FFBB9] text-[#050811] shadow-2xl shadow-[#8FFBB9]/10' : 'text-white/30 hover:text-white hover:bg-white/5 shadow-none'}`}>{label}</button>
);

const IconBtn = ({ icon, badge, className }: any) => (
  <button className={`w-14 h-14 lg:w-[68px] lg:h-[68px] flex items-center justify-center rounded-[18px] lg:rounded-[24px] bg-white/[0.03] border border-white/10 text-white/30 hover:text-white transition-all relative group shadow-xl ${className}`}>
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
    {badge && <span className="absolute top-4 right-4 lg:top-5 lg:right-5 w-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#050811] shadow-[0_0_10px_red]" />}
  </button>
);

const LoadingScreen = () => (<div className="min-h-screen bg-[#050811] flex items-center justify-center p-20"><div className="relative"><ShieldCheck className="text-[#8FFBB9] animate-pulse" size={80} /><div className="absolute inset-0 bg-[#8FFBB9]/20 blur-3xl animate-pulse" /></div></div>);

export default App;
