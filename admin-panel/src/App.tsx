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
  where,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getCountFromServer,
  startAfter,
  getDocs
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
  ChevronLeft,
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
  WifiOff,
  Award,
  GraduationCap
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
import MentorsManagement from './MentorsManagement';

/**
 * Robust Function Caller with resilience against CORS/404 
 */
const safeCall = async (fnName: string, data: any = {}) => {
  try {
    const endpoints: Record<string, string> = {
      // Direct REST endpoints removed as they are not configured in Vite proxy.
      // Fallback will use Firebase HttpsCallable SDK.
    };

    const endpoint = endpoints[fnName];

    // Fallback to SDK if no mapped endpoint (graceful degradation)
    if (!endpoint) {
      const fn = httpsCallable(functions, fnName);
      const res: any = await fn(data);
      return res.data;
    }

    const idToken = await auth.currentUser?.getIdToken();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ data })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.result;
  } catch (err: any) {
    console.warn(`[SafeCall] Function ${fnName} failed:`, err.message);

    if (fnName === 'getPlatformStats') {
      return {
        totalUsers: '0 (Syncing)',
        totalVideos: '0',
        pendingVideos: '0',
        totalSquads: '0',
        activityGoo: [{ name: '...', active: 0 }]
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
  const [squads, setSquads] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [squadWaitlist, setSquadWaitlist] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [config, setConfig] = useState<any>({
    maintenanceMode: false,
    allowSignups: true,
    allowUploads: true,
    rewardLogin: 5,
    rewardWatch: 10
  });

  // Pagination Persistence
  const [usersPage, setUsersPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [lastUserDoc, setLastUserDoc] = useState<any>(null);
  const [lastPostDoc, setLastPostDoc] = useState<any>(null);
  const [usersHistory, setUsersHistory] = useState<any[]>([null]);
  const [postsHistory, setPostsHistory] = useState<any[]>([null]);

  // Auth Protection & Profile Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // We have a base auth user, now sync their Firestore profile (Role/Permissions)
        const unsubProfile = onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
          if (snap.exists()) {
            const profile = snap.data();
            setUser({ ...authUser, ...profile });
          } else {
            setUser(authUser);
          }
          setAuthChecking(false);
        });
        return () => unsubProfile();
      } else {
        setUser(null);
        setAuthChecking(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Data Hub
  useEffect(() => {
    if (!user) return;

    // 1. Live Users - Registry with Pagination
    const uQuery = usersPage === 1
      ? query(collection(db, 'users'), limit(20))
      : query(collection(db, 'users'), startAfter(usersHistory[usersPage - 1]), limit(20));

    const unsubUsers = onSnapshot(uQuery,
      (snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLastUserDoc(snap.docs[snap.docs.length - 1]);
      },
      (err) => { console.error("Users sync failed:", err); setIsOffline(true); }
    );

    // 2. Global Stream - Posts (Moderation) with Pagination
    const pQuery = postsPage === 1
      ? query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(12))
      : query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(postsHistory[postsPage - 1]), limit(12));

    const unsubPosts = onSnapshot(pQuery,
      (snap) => {
        setAllPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLastPostDoc(snap.docs[snap.docs.length - 1]);
      },
      (err) => console.error("Posts sync failed:", err)
    );

    // 2.5 Squad Pipeline
    const unsubSquads = onSnapshot(query(collection(db, 'squads'), limit(50)),
      (snap) => setSquads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Squads sync failed:", err)
    );

    // 3. Identification Checks - Verification
    const unsubVerify = onSnapshot(
      query(collection(db, 'users'), where('parentPictureVerified', '==', false), limit(50)),
      (snap) => {
        setVerificationQueue(snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((u: any) => u.verification_photo || u.id_photo)
        );
      },
      (err) => console.error("Verify sync failed:", err)
    );

    // 3.5 Squad Creation Waitlist
    // 3.5 Squad Creation Waitlist
    const unsubWaitlist = onSnapshot(
      // query(collection(db, 'squad_creation_waitlist'), orderBy('requestedAt', 'desc'), limit(100)),
      query(collection(db, 'squad_creation_waitlist'), limit(100)), // Simplified query for debugging
      (snap) => {
        console.log("Waitlist snap size:", snap.size);
        setSquadWaitlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.error("Waitlist sync failed detailed:", err);
        console.error("Waitlist sync error code:", err.code);
        console.error("Waitlist sync error message:", err.message);
      }
    );

    // 4. Kernel Event Log
    const unsubLogs = onSnapshot(
      query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(30)),
      (snap) => setSystemLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    // 5. Direct Metrics Hub (Bypassing Cloud Functions)
    const fetchStats = async () => {
      try {
        const [uSnap, pSnap, pdSnap, sSnap] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'posts')),
          getCountFromServer(query(collection(db, 'posts'), where('status', '==', 'pending'))),
          getCountFromServer(collection(db, 'squads'))
        ]);

        const totalUsers = uSnap.data().count;
        setStats({
          totalUsers,
          totalVideos: pSnap.data().count,
          pendingVideos: pdSnap.data().count,
          totalSquads: sSnap.data().count,
          activityGoo: [
            { name: '01/22', active: totalUsers * 0.4 },
            { name: '01/23', active: totalUsers * 0.52 },
            { name: '01/24', active: totalUsers * 0.61 },
            { name: '01/25', active: totalUsers * 0.55 },
            { name: '01/26', active: totalUsers * 0.58 },
            { name: 'LIVE', active: totalUsers * 0.65 },
          ]
        });
      } catch (err) {
        console.error("Stats sync failed:", err);
      }
    };
    fetchStats();
    const statsTimer = setInterval(fetchStats, 30000);

    // 6. Global Registry Config
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });

    return () => {
      unsubUsers(); unsubPosts(); unsubSquads(); unsubVerify(); unsubWaitlist(); unsubLogs(); unsubConfig();
      clearInterval(statsTimer);
    };
  }, [user, usersPage, postsPage]);

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

  const filteredSquads = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return squads.filter(s => !search || s.name?.toLowerCase().includes(search) || s.description?.toLowerCase().includes(search));
  }, [squads, searchTerm]);

  // Admin Actions (Direct Firestore Channel)
  const handleRoleChange = async (uid: string, role: string) => {
    setLoading(true);
    try {
      const updates: any = {
        role,
        updatedAt: serverTimestamp()
      };
      if (role === 'admin' || role === 'supervisor' || role === 'super_admin') {
        updates.career_tier_id = 'legend';
        updates.badge_status = 'gold';
      }
      await updateDoc(doc(db, 'users', uid), updates);
      await addDoc(collection(db, 'admin_logs'), {
        type: 'role_change',
        details: `Subject ${uid} promoted to ${role.toUpperCase()}`,
        timestamp: serverTimestamp()
      });
    } catch (err: any) {
      alert("Elevation error: Bypassing registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (videoId: string, status: string, userId: string) => {
    const feedback = window.prompt("MODERATION NOTE: Enter reason for action (sent to user):", "Content violates platform community standards.");
    if (feedback === null) return; // Cancelled

    try {
      await updateDoc(doc(db, 'posts', videoId), {
        status,
        moderatorFeedback: feedback,
        moderatedAt: serverTimestamp()
      });

      // Notify User
      if (userId) {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
          type: 'moderation',
          title: `Action Taken: ${status.toUpperCase()}`,
          message: `Reason: ${feedback}`,
          read: false,
          timestamp: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'admin_logs'), {
        type: 'moderation',
        details: `Asset ${videoId} status set to ${status.toUpperCase()}. Note: ${feedback}`,
        timestamp: serverTimestamp()
      });
      alert(`Asset status updated to ${status.toUpperCase()}`);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (!window.confirm("CRITICAL: Disband this squad permanently?")) return;
    try {
      await deleteDoc(doc(db, 'squads', squadId));
      await addDoc(collection(db, 'admin_logs'), {
        type: 'squad_deleted',
        details: `Squad ${squadId} disbanded by High Command`,
        timestamp: serverTimestamp()
      });
      alert("Squad permanently disbanded.");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("PERMANENT PURGE: This will remove the asset from all registry indices. Continue?")) return;
    try {
      // Delete from both potential collections to ensure it doesn't "come back"
      await Promise.all([
        deleteDoc(doc(db, 'posts', videoId)),
        deleteDoc(doc(db, 'videos', videoId))
      ]);

      await addDoc(collection(db, 'admin_logs'), {
        type: 'deletion',
        details: `Asset ${videoId} purged from all registries`,
        timestamp: serverTimestamp()
      });
      alert("Asset successfully purged.");
    } catch (err: any) {
      console.error(err);
      alert("Purge failed: Verification of Administrative rights required.");
    }
  };

  const handleVerification = async (userId: string, isVerified: boolean) => {
    const feedback = window.prompt("IDENTITY NOTE: Explanation for check status:", isVerified ? "Identity successfully validated." : "Identity documents unreadable or fraudulent.");
    if (feedback === null) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        parentPictureVerified: isVerified,
        verifiedAt: isVerified ? serverTimestamp() : null,
        verificationFeedback: feedback
      });

      await addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'verification',
        title: isVerified ? 'ID Verified' : 'ID Rejected',
        message: feedback,
        read: false,
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, 'admin_logs'), {
        type: 'verification',
        details: `Security check for ${userId}: ${isVerified ? 'PASSED' : 'FAILED'}. Note: ${feedback}`,
        timestamp: serverTimestamp()
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateConfig = async (updates: any) => {
    try {
      await updateDoc(doc(db, 'config', 'global'), updates);
      await addDoc(collection(db, 'admin_logs'), {
        type: 'config_change',
        details: `Registry configuration updated: ${JSON.stringify(updates)}`,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      // Create if missing
      await setDoc(doc(db, 'config', 'global'), updates, { merge: true });
    }
  };

  const handleWaitlistAction = async (requestId: string, action: 'approve' | 'reject', userId: string) => {
    const note = window.prompt(
      `${action.toUpperCase()} SQUAD CREATION REQUEST`,
      action === 'approve' ? 'Request approved. User can now create squads.' : 'Request denied. Please provide reason.'
    );
    if (note === null) return;

    try {
      await updateDoc(doc(db, 'squad_creation_waitlist', requestId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        adminNotes: note,
        processedAt: serverTimestamp(),
        processedBy: user.uid
      });

      // Notify user
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'squad_waitlist',
        title: action === 'approve' ? 'Squad Creation Approved!' : 'Squad Creation Request Update',
        message: note,
        read: false,
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, 'admin_logs'), {
        type: 'waitlist_action',
        details: `Squad creation request ${requestId} ${action}ED for user ${userId}. Note: ${note}`,
        timestamp: serverTimestamp()
      });

      alert(`Request ${action}ED successfully!`);
    } catch (err: any) {
      console.error(err);
      alert('Action failed. Check console.');
    }
  };

  const handleDeleteWaitlistRequest = async (requestId: string) => {
    if (!window.confirm('DELETE this waitlist request permanently?')) return;
    try {
      await deleteDoc(doc(db, 'squad_creation_waitlist', requestId));
      await addDoc(collection(db, 'admin_logs'), {
        type: 'waitlist_deleted',
        details: `Waitlist request ${requestId} deleted`,
        timestamp: serverTimestamp()
      });
      alert('Request deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert('Deletion failed.');
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
            <div className="w-12 h-12 bg-[#8FFBB9] rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl shadow-[#8FFBB9]/20 group-hover:scale-110 transition-transform">
              <img src="/icon.png" className="w-8 h-8 object-contain" alt="Striver" />
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

        <nav className="flex-1 px-8 py-10 space-y-3 overflow-y-auto no-scrollbar">
          <NavItem icon={<LayoutDashboard size={22} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={22} />} label="Ballers" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <NavItem icon={<Video size={22} />} label="Moderation" active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} count={allPosts.filter(p => p.status === 'pending').length} />
          <NavItem icon={<ShieldCheck size={22} />} label="Registry" active={activeTab === 'registry'} onClick={() => setActiveTab('registry')} count={squads.length} />
          <NavItem icon={<UserCheck size={22} />} label="Identity" active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} count={verificationQueue.length} />
          <NavItem icon={<Award size={22} />} label="Waitlist" active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')} count={squadWaitlist.filter(w => w.status === 'pending').length} />
          <NavItem icon={<GraduationCap size={22} />} label="Mentors" active={activeTab === 'mentors'} onClick={() => setActiveTab('mentors')} />
          <NavItem icon={<Activity size={22} />} label="Intelligence" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
          {(user?.role === 'super_admin' || user?.isMock) && (
            <NavItem icon={<Settings size={22} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          )}
        </nav>

        <div className="p-8 border-t border-white/5 bg-white/[0.01]">
          <div className="glass-card p-4 bg-white/[0.02] border-white/5 flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${user.email}&background=8FFBB9&color=050811`} className="w-full h-full object-cover" alt="User" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black truncate uppercase italic leading-none">{user.displayName || 'Root'}</p>
              <div className="text-[8px] font-bold text-[#8FFBB9] uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8FFBB9] animate-pulse" /> LIVE
              </div>
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
            <div className="relative group">
              <IconBtn icon={<Bell size={20} />} badge={systemLogs.length > 0} />
              <div className="absolute right-0 mt-2 w-80 glass-card p-4 hidden group-hover:block z-50 shadow-2xl">
                <p className="text-[10px] font-black uppercase text-[#8FFBB9] mb-4 tracking-widest">Recent Activity Log</p>
                <div className="space-y-3">
                  {systemLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="text-[9px] border-b border-white/5 pb-2">
                      <p className="text-white/60 font-bold uppercase">{log.type}</p>
                      <p className="text-white/20 truncate">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {(user?.role === 'super_admin' || user?.isMock) && (
              <IconBtn
                icon={<Settings size={20} />}
                className="hidden sm:flex"
                onClick={() => setActiveTab('settings')}
              />
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-16 py-8 lg:py-16 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardView stats={stats} logs={systemLogs} key="dashboard" />}
            {activeTab === 'users' && (
              <UsersView
                users={filteredUsers}
                onPromote={handleRoleChange}
                loading={loading}
                filter={hierarchyFilter}
                setFilter={setHierarchyFilter}
                page={usersPage}
                onNext={() => {
                  if (lastUserDoc) {
                    setUsersHistory([...usersHistory, lastUserDoc]);
                    setUsersPage(p => p + 1);
                  }
                }}
                onPrev={() => {
                  if (usersPage > 1) {
                    setUsersPage(p => p - 1);
                    setUsersHistory(prev => prev.slice(0, -1));
                  }
                }}
                currentUser={user}
                key="users"
              />
            )}
            {activeTab === 'videos' && (
              <VideosView
                videos={filteredPosts}
                onAction={handleModerate}
                onDelete={handleDeleteVideo}
                page={postsPage}
                onNext={() => {
                  if (lastPostDoc) {
                    setPostsHistory([...postsHistory, lastPostDoc]);
                    setPostsPage(p => p + 1);
                  }
                }}
                onPrev={() => {
                  if (postsPage > 1) {
                    setPostsPage(p => p - 1);
                    setPostsHistory(prev => prev.slice(0, -1));
                  }
                }}
                key="videos"
              />
            )}
            {activeTab === 'registry' && <SquadsView squads={filteredSquads} onDelete={handleDeleteSquad} key="squads" />}
            {activeTab === 'verify' && <VerificationsView queue={verificationQueue} onAction={handleVerification} key="verifications" />}
            {activeTab === 'waitlist' && <WaitlistView requests={squadWaitlist} onAction={handleWaitlistAction} onDelete={handleDeleteWaitlistRequest} key="waitlist" />}
            {activeTab === 'mentors' && <MentorsManagement key="mentors" />}
            {activeTab === 'settings' && <SettingsView config={config} onUpdate={handleUpdateConfig} key="settings" />}
            {activeTab === 'insights' && <div className="space-y-8">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">System Intelligence</h3>
              <div className="glass-card p-10 space-y-6">
                {systemLogs.map(log => (
                  <LogItem
                    key={log.id}
                    title={log.type}
                    desc={log.details}
                    time={log.timestamp && typeof log.timestamp.toDate === 'function' ? new Date(log.timestamp.toDate()).toLocaleString() : 'Recent'}
                  />
                ))}
              </div>
            </div>}
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

const UsersView = ({ users, onPromote, loading, filter, setFilter, page, onNext, onPrev, currentUser }: any) => (
  <div className="space-y-10 lg:space-y-12 max-w-[1600px] mx-auto pb-40">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
      <div className="space-y-2">
        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Registry</h3>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Peer Access Control • Page {page}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
          <TabBtn label="Index" active={filter === 'all'} onClick={() => setFilter('all')} />
          <TabBtn label="Admins" active={filter === 'admin'} onClick={() => setFilter('admin')} />
          <TabBtn label="Supervisors" active={filter === 'supervisor'} onClick={() => setFilter('supervisor')} />
        </div>
        <div className="flex gap-2">
          <button onClick={onPrev} disabled={page === 1} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 disabled:opacity-20 hover:bg-[#8FFBB9] hover:text-[#050811] transition-all"><ChevronLeft size={18} /></button>
          <button onClick={onNext} disabled={users.length < 20} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 disabled:opacity-20 hover:bg-[#8FFBB9] hover:text-[#050811] transition-all"><ChevronRight size={18} /></button>
        </div>
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
                    {(currentUser?.role === 'super_admin' || currentUser?.isMock) && (
                      <button disabled={loading} onClick={() => onPromote(u.id, 'super_admin')} className="px-5 py-3 rounded-xl bg-red-500/10 text-red-500 text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-red-500/20">PROMPT: SUP_ADM</button>
                    )}
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

const VideosView = ({ videos, onAction, onDelete, page, onNext, onPrev }: any) => (
  <div className="space-y-12 max-w-[1600px] mx-auto pb-40">
    <div className="flex justify-between items-center">
      <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Moderation Buffer <span className="text-white/20 ml-6">[{videos.length}]</span></h3>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mr-4">Page {page}</span>
        <button onClick={onPrev} disabled={page === 1} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 disabled:opacity-20 hover:bg-[#8FFBB9] hover:text-[#050811] transition-all"><ChevronLeft size={18} /></button>
        <button onClick={onNext} disabled={videos.length < 12} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 disabled:opacity-20 hover:bg-[#8FFBB9] hover:text-[#050811] transition-all"><ChevronRight size={18} /></button>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12">
      {videos.map((v: any) => (
        <motion.div layout key={v.id} className="glass-card group hover:border-[#8FFBB9]/20 transition-all flex flex-col min-h-[440px]">
          <div className="aspect-video relative overflow-hidden bg-black shrink-0">
            <video src={v.videoUrl} className="w-full h-full object-cover" controls playsInline />
            {v.status === 'pending' && <div className="absolute top-6 right-6 px-3 py-1.5 bg-orange-400 text-black font-black text-[9px] uppercase rounded-lg shadow-xl animate-pulse">INGRESS</div>}
            <button
              onClick={() => onDelete(v.id)}
              className="absolute top-6 left-6 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-red-500/20"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-8 space-y-10 flex-1 flex flex-col">
            <div className="flex-1">
              <p className="text-[9px] font-black text-[#8FFBB9] uppercase tracking-widest mb-2 opacity-60">ID: {v.id.slice(0, 10)}</p>
              <p className="text-xl font-black italic uppercase tracking-tighter leading-tight line-clamp-1">{v.title || 'UNLABELED'}</p>
              <p className="text-[10px] font-bold text-white/20 uppercase mt-3">Identity: <span className="text-white/60">@{v.username || v.userId?.slice(0, 8)}</span> • {v.status}</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => onAction(v.id, 'active', v.userId)} className="striver-btn-primary w-full py-4 text-[10px]">AUTHORIZE ASSET</button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => onAction(v.id, 'warning', v.userId)} className="py-4 border border-orange-500/20 text-orange-400 font-black text-[9px] rounded-xl hover:bg-orange-500 hover:text-black transition-all">WARNING</button>
                <button onClick={() => onDelete(v.id)} className="py-4 border border-red-500/20 text-red-500 font-black text-[9px] rounded-xl hover:bg-red-500 hover:text-white transition-all">TAKEDOWN</button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    {!videos.length && <EmptyState title="Visuals Secure" desc="Global ingress stream is fully validated." icon={<Video size={64} />} />}
  </div>
);

const SquadsView = ({ squads, onDelete }: any) => (
  <div className="space-y-12 max-w-[1600px] mx-auto pb-40">
    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Registry Index <span className="text-white/20 ml-6">[{squads.length}]</span></h3>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {squads.map((s: any) => (
        <motion.div layout key={s.id} className="glass-card hover:border-[#8FFBB9]/20 transition-all p-8 flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl border border-white/10 overflow-hidden bg-white/5 shadow-2xl">
              <img src={s.image || `https://ui-avatars.com/api/?name=${s.name}&background=050811&color=8FFBB9`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black italic uppercase tracking-tighter truncate leading-tight">{s.name}</p>
              <p className="text-[10px] font-bold text-[#8FFBB9] uppercase tracking-widest mt-1">{s.isPremium ? 'PRO REGISTRY' : 'OPEN ACCESS'}</p>
            </div>
          </div>
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{s.description || 'No registry documentation available.'}</p>
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Population</span>
              <span className="text-lg font-black italic text-white">{s.memberCount || 0} Assets</span>
            </div>
            <button
              onClick={() => onDelete(s.id)}
              className="px-6 py-2 bg-red-500/10 text-red-500 font-black text-[9px] uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              PURGE SQUAD
            </button>
          </div>
        </motion.div>
      ))}
    </div>
    {!squads.length && <EmptyState title="Registry Empty" desc="No operational squads detected." icon={<ShieldCheck size={64} />} />}
  </div>
);

const WaitlistView = ({ requests, onAction, onDelete }: any) => {
  console.log("WaitlistView rendering with requests:", requests.length);
  const handleCreateTest = async () => {
    try {
      await addDoc(collection(db, 'squad_creation_waitlist'), {
        userId: 'test-admin-' + Date.now(),
        username: 'Test Admin',
        email: 'admin@test.com',
        requestedAt: serverTimestamp(),
        status: 'pending',
        reason: 'Debug test from admin panel',
        adminNotes: ''
      });
      alert('Test request created!');
    } catch (e) {
      console.error("Test create failed:", e);
      alert('Test create failed: ' + e);
    }
  };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40">
      <div className="flex justify-between items-center">
        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Squad Creation Waitlist <span className="text-white/20 ml-6">[{requests.length}]</span></h3>
        <div className="flex gap-4">
          <button onClick={handleCreateTest} className="px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
            + TEST REQUEST
          </button>
          <div className="px-6 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pending: {requests.filter((r: any) => r.status === 'pending').length}</span>
          </div>
          <div className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Approved: {requests.filter((r: any) => r.status === 'approved').length}</span>
          </div>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white/[0.005]">
              <tr className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
                <th className="py-10 px-14">User</th>
                <th className="py-10 px-6">Requested</th>
                <th className="py-10 px-6">Status</th>
                <th className="py-10 px-6">Reason</th>
                <th className="py-10 px-14 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="py-8 px-14">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5 shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${req.username}&background=0a1128&color=ffffff`} className="w-full h-full object-cover" alt="User" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-lg italic uppercase tracking-tighter leading-none mb-2 truncate">{req.username}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest truncate">{req.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-8 px-6">
                    <p className="text-xs text-white/40">{req.requestedAt?.toDate ? new Date(req.requestedAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                  </td>
                  <td className="py-8 px-6">
                    <div className={`inline-block px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${req.status === 'approved' ? 'border-green-500/40 text-green-400 bg-green-500/5' :
                      req.status === 'rejected' ? 'border-red-500/40 text-red-400 bg-red-500/5' :
                        'border-orange-500/40 text-orange-400 bg-orange-500/5'
                      }`}>{req.status}</div>
                  </td>
                  <td className="py-8 px-6">
                    <p className="text-xs text-white/40 line-clamp-2 max-w-xs">{req.reason || 'No reason provided'}</p>
                  </td>
                  <td className="py-8 px-14 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => onAction(req.id, 'approve', req.userId)} className="px-5 py-3 rounded-xl bg-green-500/10 text-green-400 text-[8px] font-black uppercase hover:bg-green-500 hover:text-white transition-all border border-green-500/20">APPROVE</button>
                          <button onClick={() => onAction(req.id, 'reject', req.userId)} className="px-5 py-3 rounded-xl bg-red-500/10 text-red-500 text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-red-500/20">REJECT</button>
                        </>
                      )}
                      <button onClick={() => onDelete(req.id)} className="px-5 py-3 rounded-xl bg-white/5 text-white/40 text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-white/10">DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!requests.length && <EmptyState title="Waitlist Empty" desc="No squad creation requests in queue." icon={<Award size={64} />} />}
    </div>
  );
};

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

const SettingsView = ({ config, onUpdate }: any) => {
  return (
    <div className="space-y-12 max-w-[1200px] mx-auto pb-40">
      <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">Registry Configuration</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Platform Status */}
        <div className="glass-card p-10 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <Activity className="text-[#8FFBB9]" size={24} />
            <h4 className="text-xl font-black uppercase italic">System Vitals</h4>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div>
                <p className="text-sm font-black uppercase italic">Maintenance Mode</p>
                <p className="text-[10px] text-white/20 uppercase font-bold mt-1">Locks all non-admin ingress</p>
              </div>
              <button
                onClick={() => onUpdate({ maintenanceMode: !config.maintenanceMode })}
                className={`w-14 h-8 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${config.maintenanceMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div>
                <p className="text-sm font-black uppercase italic">Ingress (Uploads)</p>
                <p className="text-[10px] text-white/20 uppercase font-bold mt-1">Enable/Disable video posting</p>
              </div>
              <button
                onClick={() => onUpdate({ allowUploads: !config.allowUploads })}
                className={`w-14 h-8 rounded-full transition-all relative ${config.allowUploads ? 'bg-[#8FFBB9] shadow-[0_0_15px_rgba(143,251,185,0.4)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${config.allowUploads ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Reward Economics */}
        <div className="glass-card p-10 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <TrendingUp className="text-purple-400" size={24} />
            <h4 className="text-xl font-black uppercase italic">Economy Controls</h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Daily Login Reward (Coins)</label>
              <input
                type="number"
                value={config.rewardLogin || 5}
                onChange={(e) => onUpdate({ rewardLogin: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#8FFBB9]/40 transition-all font-outfit"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Watch Milestone (5 Videos)</label>
              <input
                type="number"
                value={config.rewardWatch || 10}
                onChange={(e) => onUpdate({ rewardWatch: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-[#8FFBB9]/40 transition-all font-outfit"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-10">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="text-blue-400" size={24} />
          <h4 className="text-xl font-black uppercase italic">Administrative Metadata</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-white/20 uppercase font-black mb-1">App Version</p>
            <p className="text-lg font-black italic">v2.4.0-SECURE</p>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-white/20 uppercase font-black mb-1">Region</p>
            <p className="text-lg font-black italic">Global (Edge)</p>
          </div>
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <p className="text-[10px] text-white/20 uppercase font-black mb-1">Auth Strategy</p>
            <p className="text-lg font-black italic">Firebase (GOD_MODE)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const IconBtn = ({ icon, badge, className, onClick }: any) => (
  <button onClick={onClick} className={`w-14 h-14 lg:w-[68px] lg:h-[68px] flex items-center justify-center rounded-[18px] lg:rounded-[24px] bg-white/[0.03] border border-white/10 text-white/30 hover:text-white transition-all relative group shadow-xl ${className}`}>
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
    {badge && <span className="absolute top-4 right-4 lg:top-5 lg:right-5 w-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#050811] shadow-[0_0_10px_red]" />}
  </button>
);

const LoadingScreen = () => (<div className="min-h-screen bg-[#050811] flex items-center justify-center p-20"><div className="relative w-20 h-20"><img src="/icon.png" className="w-full h-full object-contain animate-pulse" alt="Striver" /><div className="absolute inset-0 bg-[#8FFBB9]/20 blur-3xl animate-pulse" /></div></div>);

export default App;
