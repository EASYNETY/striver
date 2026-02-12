import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from './firebase';
import { collection, query, getDocs, doc, updateDoc, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { GraduationCap, UserCheck, UserX, Search, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface User {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar?: string;
    isMentor?: boolean;
    specialties?: string[];
    bio?: string;
}

interface MentorRequest {
    id: string;
    userId: string;
    username: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected' | 'revoked';
    reason: string;
    requestedAt: any;
}

const MentorsManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<MentorRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'mentors' | 'non-mentors'>('all');

    useEffect(() => {
        loadUsers();

        // Subscribe to pending requests
        const q = query(
            collection(db, 'mentor_waitlist'),
            where('status', '==', 'pending'),
            limit(50)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MentorRequest[];
            setRequests(reqs);
        });

        return () => unsubscribe();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersList);
        } catch (error) {
            console.error('[MentorsManagement] Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAction = async (request: MentorRequest, action: 'approve' | 'reject') => {
        const confirmMsg = action === 'approve'
            ? `Approve ${request.username} as a mentor?`
            : `Reject application from ${request.username}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            // 1. Update Request Status
            await updateDoc(doc(db, 'mentor_waitlist', request.id), {
                status: action === 'approve' ? 'approved' : 'rejected',
                processedAt: serverTimestamp(),
                processedBy: auth.currentUser?.uid
            });

            // 2. If Approved, Update User Profile
            if (action === 'approve') {
                await updateDoc(doc(db, 'users', request.userId), {
                    isMentor: true
                });

                // Update local users state
                setUsers(prev => prev.map(u => u.id === request.userId ? { ...u, isMentor: true } : u));
            }

            // 3. Send Notification
            await addDoc(collection(db, 'users', request.userId, 'notifications'), {
                type: 'mentor_application',
                title: action === 'approve' ? 'Mentor Application Approved' : 'Mentor Application Update',
                message: action === 'approve'
                    ? 'Congratulations! You are now a verified mentor on Striver.'
                    : 'Your mentor application has been reviewed and was not approved at this time.',
                read: false,
                timestamp: serverTimestamp()
            });

            // 4. Log Admin Action
            await addDoc(collection(db, 'admin_logs'), {
                type: 'mentor_action',
                details: `Mentor application ${request.id} ${action}d by ${auth.currentUser?.email}`,
                timestamp: serverTimestamp()
            });

        } catch (error) {
            console.error('Error processing mentor request:', error);
            alert('Failed to process request');
        }
    };

    const toggleMentorStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                isMentor: !currentStatus
            });

            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, isMentor: !currentStatus } : u
            ));
        } catch (error) {
            console.error('[MentorsManagement] Failed to update mentor status:', error);
            alert('Failed to update mentor status');
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchTerm ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'mentors' && u.isMentor) ||
            (filter === 'non-mentors' && !u.isMentor);

        return matchesSearch && matchesFilter;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10 max-w-[1600px] mx-auto pb-40"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#8FFBB9]">
                        Mentor Management
                    </h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">
                        Manage coaches and applications
                    </p>
                </div>
                <button
                    onClick={loadUsers}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
                </button>
            </div>

            {/* PENDING REQUESTS SECTION */}
            {requests.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        <Clock className="text-[#8FFBB9]" /> Pending Applications
                    </h4>
                    <div className="glass-card overflow-hidden border border-[#8FFBB9]/20">
                        <table className="w-full text-left">
                            <thead className="bg-[#8FFBB9]/5">
                                <tr className="text-[#8FFBB9] text-[10px] font-black uppercase tracking-[0.3em]">
                                    <th className="p-6">Applicant</th>
                                    <th className="p-6">Reason</th>
                                    <th className="p-6">Time</th>
                                    <th className="p-6 text-right">Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-white/[0.02]">
                                        <td className="p-6">
                                            <p className="font-bold text-white">{req.username}</p>
                                            <p className="text-[10px] text-white/40">{req.email}</p>
                                        </td>
                                        <td className="p-6 max-w-md">
                                            <p className="text-sm text-white/80">{req.reason}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-[10px] font-bold text-white/40">
                                                {req.requestedAt?.toDate().toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRequestAction(req, 'approve')}
                                                    className="p-2 rounded-lg bg-[#8FFBB9]/20 text-[#8FFBB9] hover:bg-[#8FFBB9] hover:text-[#050811] transition-all"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req, 'reject')}
                                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex gap-4 items-center mt-10">
                <div className="relative flex-1 max-w-[600px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-10 py-4 text-sm focus:outline-none focus:border-[#8FFBB9]/40 focus:bg-white/[0.06] transition-all font-bold tracking-tight"
                    />
                </div>

                <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-[#8FFBB9] text-[#050811]' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        All Users
                    </button>
                    <button
                        onClick={() => setFilter('mentors')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'mentors' ? 'bg-[#8FFBB9] text-[#050811]' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        Mentors Only
                    </button>
                    <button
                        onClick={() => setFilter('non-mentors')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'non-mentors' ? 'bg-[#8FFBB9] text-[#050811]' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        Non-Mentors
                    </button>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.005]">
                        <tr className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                            <th className="p-6">User</th>
                            <th className="p-6">Email</th>
                            <th className="p-6">Status</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-20 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <RefreshCw size={24} className="animate-spin text-[#8FFBB9]" />
                                        <span className="text-white/40 text-sm font-bold">Loading users...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-20 text-center text-white/20 text-sm font-bold">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName || user.username}&background=8FFBB9&color=050811`}
                                                className="w-12 h-12 rounded-xl border border-white/10"
                                                alt={user.displayName}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-white">{user.displayName || user.username}</p>
                                                <p className="text-[10px] text-white/40 font-bold">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm text-white/60 font-bold">{user.email}</p>
                                    </td>
                                    <td className="p-6">
                                        {user.isMentor ? (
                                            <div className="flex items-center gap-2 text-[#8FFBB9]">
                                                <GraduationCap size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Mentor</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Regular User</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => toggleMentorStatus(user.id, user.isMentor || false)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ml-auto ${user.isMentor
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                : 'bg-[#8FFBB9]/10 text-[#8FFBB9] border border-[#8FFBB9]/20 hover:bg-[#8FFBB9]/20'
                                                }`}
                                        >
                                            {user.isMentor ? (
                                                <>
                                                    <UserX size={14} />
                                                    Remove Mentor
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck size={14} />
                                                    Make Mentor
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default MentorsManagement;
