import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc, runTransaction, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ShieldCheck, Check, X, Users, Trophy, Settings, Megaphone, Trash2, Edit, Eye, Image as ImageIcon, ExternalLink } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [tournaments, setTournaments] = useState([]);
  const [joins, setJoins] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({ upiId: '', qrImageUrl: '', minAddCash: 10, instructions: '' });

  // Forms
  const [tForm, setTForm] = useState({
    title: '', description: '', game: 'Free Fire', mode: 'Squad', map: 'Bermuda',
    prizePool: '', entryFee: '', maxSlots: '', matchStartTime: '', externalImageUrl: '', rules: '', rewards: ''
  });
  const [lForm, setLForm] = useState({ userId: '', playerName: '', points: 0, kills: 0, wins: 0, totalPrize: 0 });
  const [aForm, setAForm] = useState({ text: '' });
  const [walletForm, setWalletForm] = useState({ amount: 0, reason: '' });
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    const unsubT = onSnapshot(collection(db, 'tournaments'), s => setTournaments(s.docs.map(d=>({id: d.id, ...d.data()}))));
    const unsubJ = onSnapshot(collection(db, 'joins'), s => setJoins(s.docs.map(d=>({id: d.id, ...d.data()})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))));
    const unsubP = onSnapshot(collection(db, 'payments'), s => setPayments(s.docs.map(d=>({id: d.id, ...d.data()})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))));
    const unsubU = onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d=>({id: d.id, ...d.data()}))));
    const unsubL = onSnapshot(collection(db, 'leaderboard'), s => setLeaderboard(s.docs.map(d=>({id: d.id, ...d.data()}))));
    const unsubA = onSnapshot(collection(db, 'announcements'), s => setAnnouncements(s.docs.map(d=>({id: d.id, ...d.data()}))));
    
    const unsubPS = onSnapshot(doc(db, 'paymentSettings', 'main'), s => {
      if(s.exists()) setPaymentSettings(s.data());
    });

    return () => { unsubT(); unsubJ(); unsubP(); unsubU(); unsubL(); unsubA(); unsubPS(); };
  }, []);

  // --- TOURNAMENTS ---
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...tForm,
        prizePool: Number(tForm.prizePool),
        entryFee: Number(tForm.entryFee),
        maxSlots: Number(tForm.maxSlots),
        joinedSlots: 0,
        status: 'open',
        roomId: '',
        roomPassword: '',
        createdAt: new Date().toISOString()
      });
      alert('Tournament created!');
    } catch(err) { alert(err.message); }
  };
  const handleDeleteTournament = async (id) => {
    await deleteDoc(doc(db, 'tournaments', id));
  };

  // --- PAYMENTS ---
  const handlePayment = async (payment, action) => {
    if(!window.confirm(`Are you sure you want to ${action} this payment?`)) return;
    try {
      if (action === 'approve') {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', payment.userId);
          const userSnap = await t.get(userRef);
          if(!userSnap.exists()) throw "User not found";
          t.update(userRef, { walletBalance: userSnap.data().walletBalance + payment.amount });
          t.update(doc(db, 'payments', payment.id), { status: 'approved' });
          t.set(doc(collection(db, 'walletTransactions')), {
            userId: payment.userId, type: 'credit', amount: payment.amount, reason: 'Add Cash Approved', createdAt: new Date().toISOString()
          });
        });
      } else {
        await updateDoc(doc(db, 'payments', payment.id), { status: 'rejected' });
      }
      alert(`Payment ${action}d`);
    } catch(err) { alert(err); }
  };

  // --- JOINS ---
  const handleJoin = async (join, action) => {
    if(!window.confirm(`Are you sure you want to ${action} this join?`)) return;
    try {
      if (action === 'approve') {
        await updateDoc(doc(db, 'joins', join.id), { status: 'approved' });
      } else if (action === 'reject') {
        await runTransaction(db, async (t) => {
          const userRef = doc(db, 'users', join.userId);
          const tourneyRef = doc(db, 'tournaments', join.tournamentId);
          const userSnap = await t.get(userRef);
          const tSnap = await t.get(tourneyRef);
          
          t.update(doc(db, 'joins', join.id), { status: 'rejected' });
          if (userSnap.exists()) {
             t.update(userRef, { walletBalance: userSnap.data().walletBalance + join.entryFee });
             t.set(doc(collection(db, 'walletTransactions')), {
               userId: join.userId, type: 'credit', amount: join.entryFee, reason: `Refund for rejected join ${join.tournamentTitle}`, createdAt: new Date().toISOString()
             });
          }
          if (tSnap.exists()) {
             t.update(tourneyRef, { joinedSlots: Math.max(0, tSnap.data().joinedSlots - 1) });
          }
        });
      }
      alert(`Join ${action}d`);
    } catch(err) { alert(err); }
  };

  // --- USERS & WALLET ---
  const handleManualWallet = async (userId, userBalance) => {
    if(!walletForm.amount || !walletForm.reason) return alert('Enter amount and reason');
    const amount = Number(walletForm.amount);
    try {
      await runTransaction(db, async (t) => {
        const userRef = doc(db, 'users', userId);
        t.update(userRef, { walletBalance: userBalance + amount });
        t.set(doc(collection(db, 'walletTransactions')), {
          userId, type: amount > 0 ? 'credit' : 'debit', amount: Math.abs(amount), reason: `Admin: ${walletForm.reason}`, createdAt: new Date().toISOString()
        });
      });
      alert('Wallet updated');
      setWalletForm({amount:0, reason:''});
    } catch(err) { alert(err); }
  };

  // --- LEADERBOARD ---
  const handleAddLeaderboard = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leaderboard'), { ...lForm, updatedAt: new Date().toISOString() });
      alert('Leaderboard entry added');
    } catch(err) { alert(err); }
  };

  // --- SETTINGS ---
  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'paymentSettings', 'main'), paymentSettings);
      alert('Settings saved');
    } catch(err) { alert(err); }
  };

  // --- ANNOUNCEMENTS ---
  const handleAddAnnouncement = async () => {
    if(!aForm.text) return;
    try {
      await addDoc(collection(db, 'announcements'), { text: aForm.text, createdAt: new Date().toISOString() });
      setAForm({text: ''});
    } catch(err) { alert(err); }
  };
  const handleDeleteAnnouncement = async (id) => {
    await deleteDoc(doc(db, 'announcements', id));
  };


  const pendingPayments = payments.filter(p=>p.status==='pending');
  // Only show non-rejected joins
  const allJoins = joins.filter(j => j.status !== 'rejected');

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-20">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 glass-card p-4 space-y-2 h-max md:sticky md:top-24">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 px-2 text-neon-red"><ShieldCheck/> Admin Panel</h2>
        {['dashboard', 'tournaments', 'joins', 'payments', 'users', 'leaderboard', 'settings', 'announcements'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 rounded-lg font-bold capitalize transition-all ${activeTab === tab ? 'bg-neon-red/20 text-neon-red border border-neon-red/50 shadow-lg shadow-neon-red/10' : 'hover:dark:bg-white/5 hover:bg-slate-100 dark:text-brand-light text-slate-600'}`}>
            {tab}
            {tab === 'payments' && pendingPayments.length > 0 && <span className="float-right bg-neon-red text-white text-xs px-2 py-0.5 rounded-full">{pendingPayments.length}</span>}
            {tab === 'joins' && allJoins.length > 0 && <span className="float-right bg-neon-red text-white text-xs px-2 py-0.5 rounded-full">{allJoins.length}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-grow space-y-6">
        
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="glass-card p-6 border-l-4 border-l-neon-blue">
               <p className="dark:text-brand-light text-slate-500 uppercase text-sm font-bold">Total Users</p>
               <p className="text-4xl font-black dark:text-white text-slate-900">{users.length}</p>
             </div>
             <div className="glass-card p-6 border-l-4 border-l-yellow-400">
               <p className="dark:text-brand-light text-slate-500 uppercase text-sm font-bold">Total Joins</p>
               <p className="text-4xl font-black dark:text-white text-slate-900">{allJoins.length}</p>
             </div>
             <div className="glass-card p-6 border-l-4 border-l-green-400">
               <p className="dark:text-brand-light text-slate-500 uppercase text-sm font-bold">Pending Payments</p>
               <p className="text-4xl font-black dark:text-white text-slate-900">{pendingPayments.length}</p>
             </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <>
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 dark:text-white text-slate-900">Create Tournament</h3>
              <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <input required placeholder="Title" value={tForm.title} onChange={e=>setTForm({...tForm, title: e.target.value})} className="dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded p-2 dark:text-white text-slate-900 outline-none focus:border-neon-red" />
                <div className="flex flex-col gap-1">
                  <label className="text-xs dark:text-brand-light text-slate-500">Banner Image</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setTForm({...tForm, externalImageUrl: reader.result});
                      reader.readAsDataURL(file);
                    }
                  }} className="dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded p-1 dark:text-white text-slate-900 text-xs" />
                </div>
                <textarea required placeholder="Tournament Description" value={tForm.description} onChange={e=>setTForm({...tForm, description: e.target.value})} className="dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded p-2 dark:text-white text-slate-900 md:col-span-2 h-20 text-sm outline-none focus:border-neon-red" />
                <select value={tForm.game} onChange={e=>setTForm({...tForm, game: e.target.value})} className="dark:bg-brand-gray bg-slate-100 border dark:border-white/10 border-slate-300 rounded p-2 dark:text-white text-slate-900 md:col-span-2">
                  <option value="Free Fire">Free Fire</option><option value="BGMI">BGMI</option>
                </select>
                <select value={tForm.mode} onChange={e=>setTForm({...tForm, mode: e.target.value})} className="bg-brand-gray border border-white/10 rounded p-2 text-white">
                  <option value="Solo">Solo</option><option value="Duo">Duo</option><option value="Squad">Squad</option>
                </select>
                <input required placeholder="Map" value={tForm.map} onChange={e=>setTForm({...tForm, map: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
                <input required type="datetime-local" value={tForm.matchStartTime} onChange={e=>setTForm({...tForm, matchStartTime: e.target.value})} className="bg-brand-gray border border-white/10 rounded p-2 text-white" />
                <input required type="number" placeholder="Prize Pool" value={tForm.prizePool} onChange={e=>setTForm({...tForm, prizePool: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
                <input required type="number" placeholder="Entry Fee" value={tForm.entryFee} onChange={e=>setTForm({...tForm, entryFee: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white" />
                <input required type="number" placeholder="Max Slots" value={tForm.maxSlots} onChange={e=>setTForm({...tForm, maxSlots: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white md:col-span-2" />
                <textarea placeholder="Tournament Rules & Guidelines" value={tForm.rules} onChange={e=>setTForm({...tForm, rules: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white md:col-span-2 h-24" />
                <textarea placeholder="Rewards Breakdown" value={tForm.rewards} onChange={e=>setTForm({...tForm, rewards: e.target.value})} className="bg-white/5 border border-white/10 rounded p-2 text-white md:col-span-2 h-24" />
                <button type="submit" className="md:col-span-2 neon-button neon-button-red">Create Tournament</button>
              </form>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Manage Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <h4 className="font-bold text-neon-blue">{t.title}</h4>
                         <p className="text-xs text-brand-light">{t.game} | Slots: {t.joinedSlots}/{t.maxSlots}</p>
                       </div>
                       <button onClick={()=>handleDeleteTournament(t.id)} className="text-red-500 hover:bg-red-500/20 p-1 rounded"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs text-brand-light">Status:</label>
                       <select value={t.status} onChange={(e) => updateDoc(doc(db, 'tournaments', t.id), {status: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs">
                          <option value="open">Open</option><option value="starting_soon">Starting Soon</option><option value="live">Live</option><option value="closed">Closed</option><option value="completed">Completed</option>
                       </select>
                       <label className="text-xs text-brand-light">Room Details (Visible to Approved 10m before):</label>
                       <input type="text" placeholder="Room ID" defaultValue={t.roomId} onBlur={(e) => updateDoc(doc(db, 'tournaments', t.id), {roomId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs" />
                       <input type="text" placeholder="Room Password" defaultValue={t.roomPassword} onBlur={(e) => updateDoc(doc(db, 'tournaments', t.id), {roomPassword: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs" />
                       <button onClick={async () => {
                         const batch = [];
                         tournaments.forEach(tour => {
                           if (tour.isFeatured) batch.push(updateDoc(doc(db, 'tournaments', tour.id), { isFeatured: false }));
                         });
                         batch.push(updateDoc(doc(db, 'tournaments', t.id), { isFeatured: true }));
                         await Promise.all(batch);
                         alert('Set as Featured Match on Homepage!');
                       }} className={`w-full py-2 text-xs font-bold rounded mt-2 border ${t.isFeatured ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-white/5 text-brand-light border-white/10 hover:bg-white/10'}`}>
                         {t.isFeatured ? '⭐ Currently Featured' : 'Set as Featured Countdown'}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'joins' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white text-slate-900">Participants & Joins</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b dark:border-white/10 border-slate-200 dark:text-brand-light text-slate-500"><th className="pb-2">User & IGN</th><th className="pb-2">Tournament</th><th className="pb-2">UID & UPI</th><th className="pb-2 text-right">Actions</th></tr></thead>
                <tbody>
                  {allJoins.map(j => (
                    <tr key={j.id} className="border-b dark:border-white/5 border-slate-100 dark:text-white text-slate-900">
                      <td className="py-3">{j.userName}<br/><span className="text-xs text-neon-blue">{j.playerName}</span></td>
                      <td className="py-3 font-bold">{j.tournamentTitle}</td>
                      <td className="py-3 text-xs">UID: {j.gameUid}<br/><span className="text-yellow-600 dark:text-yellow-400 font-bold">UPI: {j.playerUpi || 'N/A'}</span></td>
                      <td className="py-3 text-right space-x-2">
                        {j.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 dark:bg-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full border dark:border-green-500/30 border-green-500/20">
                            <Check className="w-3 h-3"/> Approved
                          </span>
                        )}
                        {(!j.status || j.status === 'pending') && (
                          <>
                            <button onClick={()=>handleJoin(j, 'approve')} className="dark:bg-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded hover:bg-green-500 hover:text-white"><Check className="w-4 h-4"/></button>
                            <button onClick={()=>handleJoin(j, 'reject')} className="dark:bg-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded hover:bg-red-500 hover:text-white"><X className="w-4 h-4"/></button>
                          </>
                        )}
                        <button onClick={()=>{ if(window.confirm('Delete this join permanently?')) deleteDoc(doc(db,'joins',j.id)); }} className="dark:bg-white/5 bg-slate-100 text-brand-light p-2 rounded hover:bg-red-500/20 hover:text-red-400 ml-1"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {allJoins.length === 0 && <tr><td colSpan="4" className="py-4 text-center dark:text-brand-light text-slate-500">No joins found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white text-slate-900">Pending Payments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b dark:border-white/10 border-slate-200 dark:text-brand-light text-slate-500"><th className="pb-2">User</th><th className="pb-2">Amount</th><th className="pb-2">Proof</th><th className="pb-2 text-right">Actions</th></tr></thead>
                <tbody>
                  {pendingPayments.map(p => (
                    <tr key={p.id} className="border-b dark:border-white/5 border-slate-100 dark:text-white text-slate-900">
                      <td className="py-3">{p.userName} <br/><span className="text-xs dark:text-brand-light text-slate-500">{p.userEmail}</span></td>
                      <td className="py-3 font-bold text-green-600 dark:text-green-400">₹{p.amount}</td>
                      <td className="py-3">
                        {p.screenshotLink ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded border dark:border-white/10 border-slate-300 overflow-hidden cursor-pointer hover:border-neon-blue transition-colors dark:bg-white/5 bg-slate-100"
                              onClick={() => setSelectedProof(p.screenshotLink)}
                            >
                              <img src={p.screenshotLink} alt="Proof" className="w-full h-full object-cover" />
                            </div>
                            <button 
                              onClick={() => setSelectedProof(p.screenshotLink)}
                              className="text-neon-blue hover:text-neon-purple transition-colors p-1"
                              title="View Proof"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="dark:text-brand-light text-slate-400 text-xs italic">No Proof</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button onClick={()=>handlePayment(p, 'approve')} className="dark:bg-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 p-2 rounded hover:bg-green-500 hover:text-white"><Check className="w-4 h-4"/></button>
                        <button onClick={()=>handlePayment(p, 'reject')} className="dark:bg-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 p-2 rounded hover:bg-red-500 hover:text-white"><X className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {pendingPayments.length === 0 && <tr><td colSpan="4" className="py-4 text-center dark:text-brand-light text-slate-500">No pending payments.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> Users & Wallet</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-white/10 text-brand-light"><th className="pb-2">User</th><th className="pb-2">Balance</th><th className="pb-2">Manual Edit (+ / -)</th><th className="pb-2">Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b dark:border-white/5 border-slate-100 dark:text-white text-slate-900">
                      <td className="py-3">{u.name} <br/><span className="text-xs dark:text-brand-light text-slate-500">{u.email}</span></td>
                      <td className="py-3 font-bold text-green-600 dark:text-green-400">₹{u.walletBalance}</td>
                      <td className="py-3 flex gap-2">
                        <input type="number" placeholder="Amt" onChange={e=>setWalletForm({...walletForm, amount: e.target.value})} className="w-20 dark:bg-black/50 bg-slate-100 border dark:border-white/10 border-slate-300 rounded px-2 py-1 outline-none focus:border-neon-blue" />
                        <input type="text" placeholder="Reason" onChange={e=>setWalletForm({...walletForm, reason: e.target.value})} className="w-32 dark:bg-black/50 bg-slate-100 border dark:border-white/10 border-slate-300 rounded px-2 py-1 outline-none focus:border-neon-blue" />
                      </td>
                      <td className="py-3">
                        <button onClick={()=>handleManualWallet(u.id, u.walletBalance)} className="bg-neon-blue/20 text-neon-blue px-3 py-1 rounded hover:bg-neon-blue hover:text-brand-darker">Apply</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5"/> Manage Leaderboard</h3>
            <form onSubmit={handleAddLeaderboard} className="flex flex-wrap items-end gap-3 mb-6">
               <div className="flex flex-col gap-1">
                 <label className="text-xs text-brand-light uppercase">Select Player</label>
                 <select 
                   required 
                   value={lForm.userId} 
                   onChange={(e) => {
                     const selectedJoin = allJoins.find(j => j.userId === e.target.value);
                     if (selectedJoin) {
                       setLForm({...lForm, userId: selectedJoin.userId, playerName: selectedJoin.playerName});
                     } else {
                       setLForm({...lForm, userId: '', playerName: ''});
                     }
                   }} 
                   className="bg-brand-gray border border-white/10 rounded p-2 text-sm text-white min-w-[200px]"
                 >
                   <option value="">Select a Player</option>
                   {Array.from(new Map(allJoins.map(j => [j.userId, j])).values()).map(j => (
                     <option key={j.userId} value={j.userId}>{j.playerName} ({j.userName})</option>
                   ))}
                 </select>
               </div>
               
               <div className="flex flex-col gap-1">
                 <label className="text-xs text-brand-light uppercase">Points</label>
                 <input required type="number" placeholder="Points" value={lForm.points} onChange={e=>setLForm({...lForm, points: Number(e.target.value)})} className="w-24 bg-white/5 border border-white/10 rounded p-2 text-sm" />
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-brand-light uppercase">Kills</label>
                 <input required type="number" placeholder="Kills" value={lForm.kills} onChange={e=>setLForm({...lForm, kills: Number(e.target.value)})} className="w-24 bg-white/5 border border-white/10 rounded p-2 text-sm" />
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-brand-light uppercase">Wins</label>
                 <input required type="number" placeholder="Wins" value={lForm.wins} onChange={e=>setLForm({...lForm, wins: Number(e.target.value)})} className="w-24 bg-white/5 border border-white/10 rounded p-2 text-sm" />
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-brand-light uppercase">Total Prize</label>
                 <input required type="number" placeholder="Total Prize" value={lForm.totalPrize} onChange={e=>setLForm({...lForm, totalPrize: Number(e.target.value)})} className="w-32 bg-white/5 border border-white/10 rounded p-2 text-sm" />
               </div>

               <button type="submit" className="neon-button neon-button-blue text-sm px-4 py-2">Add Entry</button>
            </form>
            <div className="space-y-2">
              {leaderboard.map(l => (
                <div key={l.id} className="bg-white/5 p-3 rounded flex justify-between items-center text-sm">
                  <span>{l.playerName} ({l.points} pts, {l.kills} kills)</span>
                  <button onClick={()=>deleteDoc(doc(db, 'leaderboard', l.id))} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Payment Settings</h3>
            <div className="space-y-4 max-w-md text-sm">
              <div>
                <label className="block text-brand-light mb-1">Admin UPI ID</label>
                <input value={paymentSettings.upiId} onChange={e=>setPaymentSettings({...paymentSettings, upiId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2" />
              </div>
              <div>
                <label className="block text-brand-light mb-1">QR Image Upload</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPaymentSettings({...paymentSettings, qrImageUrl: reader.result});
                    reader.readAsDataURL(file);
                  }
                }} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                {paymentSettings.qrImageUrl && <img src={paymentSettings.qrImageUrl} alt="QR Preview" className="h-16 mt-2 rounded" />}
              </div>
              <div>
                <label className="block text-brand-light mb-1">Min Add Cash</label>
                <input type="number" value={paymentSettings.minAddCash} onChange={e=>setPaymentSettings({...paymentSettings, minAddCash: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded p-2" />
              </div>
              <div>
                <label className="block text-brand-light mb-1">Instructions</label>
                <textarea value={paymentSettings.instructions} onChange={e=>setPaymentSettings({...paymentSettings, instructions: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-2 h-24" />
              </div>
              <button onClick={handleSaveSettings} className="neon-button neon-button-purple w-full">Save Settings</button>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5"/> Announcements</h3>
            <div className="flex gap-2 mb-6">
              <input value={aForm.text} onChange={e=>setAForm({text: e.target.value})} placeholder="New announcement..." className="flex-1 bg-white/5 border border-white/10 rounded p-2" />
              <button onClick={handleAddAnnouncement} className="neon-button neon-button-blue px-6">Post</button>
            </div>
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="bg-brand-gray/50 p-4 rounded-lg flex justify-between items-center border border-white/5">
                  <p>{a.text}</p>
                  <button onClick={()=>handleDeleteAnnouncement(a.id)} className="text-red-500 hover:bg-red-500/20 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proof Preview Modal */}
        {selectedProof && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-4xl w-full max-h-[90vh] glass-card p-2 border-neon-blue/30 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-2 border-b border-white/10">
                <h4 className="font-bold text-neon-blue flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Payment Proof</h4>
                <div className="flex items-center gap-2">
                   <a href={selectedProof} download="payment-proof.png" className="p-2 hover:bg-white/5 rounded-lg text-brand-light hover:text-white transition-colors">
                     <ExternalLink className="w-5 h-5"/>
                   </a>
                   <button 
                    onClick={() => setSelectedProof(null)}
                    className="p-2 hover:bg-white/5 rounded-lg text-brand-light hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-grow overflow-auto p-2 flex items-center justify-center bg-black/20">
                <img 
                  src={selectedProof} 
                  alt="Full Proof" 
                  className="max-w-full h-auto object-contain rounded shadow-2xl"
                />
              </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setSelectedProof(null)}></div>
          </div>
        )}

      </div>
    </div>
  );
}