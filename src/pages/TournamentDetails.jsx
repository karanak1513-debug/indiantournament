import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, runTransaction, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Trophy, Users, Map, Coins, Calendar, ShieldCheck, CheckCircle, Gamepad2, Key } from 'lucide-react';
import clsx from 'clsx';

export default function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [toast, setToast] = useState('');

  // Form
  const [playerName, setPlayerName] = useState('');
  const [gameUid, setGameUid] = useState('');
  const [teamName, setTeamName] = useState('');
  const [playerUpi, setPlayerUpi] = useState('');

  useEffect(() => {
    async function fetchT() {
      try {
        const docRef = doc(db, 'tournaments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTournament({ id: docSnap.id, ...docSnap.data() });
        }
        
        if (currentUser) {
          const q = query(collection(db, 'joins'), where('tournamentId', '==', id), where('userId', '==', currentUser.uid));
          const jSnap = await getDocs(q);
          if (!jSnap.empty) {
            setHasJoined(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchT();
  }, [id, currentUser]);

  const handleJoinClick = () => {
    if (!currentUser) return navigate('/login');
    if (tournament.status === 'closed' || tournament.status === 'completed') return showToast('Battle is Closed.');
    if (tournament.joinedSlots >= tournament.maxSlots) return showToast('Slots are full.');
    if (userData.walletBalance < tournament.entryFee) return showToast('Insufficient balance. Please Add Cash.');
    setShowJoinModal(true);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const submitJoin = async (e) => {
    e.preventDefault();
    if (!playerName || !gameUid || !playerUpi) return;
    setJoinLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const tourneyRef = doc(db, 'tournaments', id);
        
        const userSnap = await transaction.get(userRef);
        const tSnap = await transaction.get(tourneyRef);
        
        if (!userSnap.exists() || !tSnap.exists()) throw "Data not found";
        
        const currentBalance = userSnap.data().walletBalance;
        const entryFee = tSnap.data().entryFee;
        const currentSlots = tSnap.data().joinedSlots;
        const maxSlots = tSnap.data().maxSlots;
        
        if (currentBalance < entryFee) throw "Insufficient balance";
        if (currentSlots >= maxSlots) throw "Tournament full";

        // Deduct wallet
        transaction.update(userRef, { walletBalance: currentBalance - entryFee });
        // Increase slots
        transaction.update(tourneyRef, { joinedSlots: currentSlots + 1 });
        
        // Add join request
        const newJoinRef = doc(collection(db, 'joins'));
        transaction.set(newJoinRef, {
          userId: currentUser.uid,
          userName: userData.name,
          userEmail: userData.email,
          tournamentId: id,
          tournamentTitle: tSnap.data().title,
          matchStartTime: tSnap.data().matchStartTime,
          playerName,
          gameUid,
          teamName,
          playerUpi,
          status: 'approved',
          entryFee,
          createdAt: new Date().toISOString()
        });

        // Add wallet transaction
        const transRef = doc(collection(db, 'walletTransactions'));
        transaction.set(transRef, {
          userId: currentUser.uid,
          type: 'debit',
          amount: entryFee,
          reason: `Entry fee for ${tSnap.data().title}`,
          tournamentId: id,
          createdAt: new Date().toISOString()
        });
      });
      
      setHasJoined(true);
      setShowJoinModal(false);
      showToast('Join request submitted! Wait for admin approval.');
    } catch (err) {
      showToast(err.toString());
    }
    setJoinLoading(false);
  };

  if (loading) return <div className="text-center pt-20 text-brand-light">Loading Tournament...</div>;
  if (!tournament) return <div className="text-center pt-20 text-red-500">Tournament not found</div>;

  return (
    <div className="pb-20">
      {toast && (
        <div className="fixed top-24 right-4 bg-neon-blue text-brand-darker font-bold px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      
      <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden mb-8 border border-white/10">
        <div className="absolute inset-0 bg-brand-darker">
          {tournament.externalImageUrl && <img src={tournament.externalImageUrl} className="w-full h-full object-cover opacity-50" alt="Banner" />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-darker/60 to-transparent"></div>
        
        <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <span className="px-3 py-1 bg-neon-red/20 text-neon-red border border-neon-red/50 rounded-full text-xs font-bold uppercase mb-4 inline-block">
              {tournament.status.replace('_', ' ')}
            </span>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic text-glow dark:text-white text-slate-900">{tournament.title}</h1>
            <p className="dark:text-brand-light text-slate-600 mt-2 max-w-2xl">{tournament.description}</p>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto">
            {hasJoined ? (
              <div className="space-y-2">
                <div className="bg-green-500/20 text-green-400 border border-green-500 py-3 px-8 rounded-lg font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Already Joined
                </div>
                {(() => {
                   const matchTime = new Date(tournament.matchStartTime);
                   const timeDiff = matchTime.getTime() - new Date().getTime();
                   const showRoomDetails = timeDiff <= 10 * 60 * 1000 && timeDiff > -10000000;
                   return (
                     <div className="bg-black/80 border border-neon-blue/30 p-3 rounded-lg text-sm text-center">
                       {showRoomDetails ? (
                         <>
                           <p className="text-white mb-1"><span className="text-brand-light">Room ID:</span> <span className="font-mono text-neon-blue">{tournament.roomId || 'Waiting...'}</span></p>
                           <p className="text-white"><span className="text-brand-light">Pass:</span> <span className="font-mono text-neon-blue">{tournament.roomPassword || 'Waiting...'}</span></p>
                         </>
                       ) : (
                         <p className="text-xs text-brand-light flex items-center justify-center gap-1">
                           <Key className="w-4 h-4" /> Room details unlock 10m before match
                         </p>
                       )}
                     </div>
                   );
                })()}
              </div>
            ) : (
              <button onClick={handleJoinClick} className="w-full md:w-auto neon-button neon-button-blue py-3 px-12 text-lg">
                Join Battle - ₹{tournament.entryFee}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white text-slate-900"><ShieldCheck className="w-5 h-5 text-neon-blue" /> Rules & Guidelines</h2>
            <div className="prose prose-invert max-w-none dark:text-brand-light text-slate-600">
               {tournament.rules ? <div dangerouslySetInnerHTML={{ __html: tournament.rules.replace(/\\n/g, '<br/>') }} /> : 'No rules specified.'}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white text-slate-900"><Trophy className="w-5 h-5 text-yellow-400" /> Rewards</h2>
            <div className="prose prose-invert max-w-none dark:text-brand-light text-slate-600">
               {tournament.rewards ? <div dangerouslySetInnerHTML={{ __html: tournament.rewards.replace(/\\n/g, '<br/>') }} /> : 'No rewards specified.'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg border-b dark:border-white/10 border-slate-200 pb-2 dark:text-white text-slate-900">Match Details</h3>
            
            <div className="flex justify-between items-center">
              <div className="dark:text-brand-light text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Time</div>
              <div className="font-bold dark:text-white text-slate-900">{format(new Date(tournament.matchStartTime), 'MMM dd, hh:mm a')}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="dark:text-brand-light text-slate-500 flex items-center gap-2"><Gamepad2 className="w-4 h-4"/> Game</div>
              <div className="font-bold dark:text-white text-slate-900">{tournament.game} ({tournament.mode})</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="dark:text-brand-light text-slate-500 flex items-center gap-2"><Map className="w-4 h-4"/> Map</div>
              <div className="font-bold dark:text-white text-slate-900">{tournament.map}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-brand-light flex items-center gap-2"><Trophy className="w-4 h-4"/> Prize Pool</div>
              <div className="font-bold text-yellow-400">₹{tournament.prizePool}</div>
            </div>

            <div className="flex justify-between items-center">
              <div className="dark:text-brand-light text-slate-500 flex items-center gap-2"><Coins className="w-4 h-4"/> Entry Fee</div>
              <div className="font-bold dark:text-white text-slate-900">₹{tournament.entryFee}</div>
            </div>

            <div className="pt-4 border-t dark:border-white/10 border-slate-200">
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="dark:text-brand-light text-slate-500">Slots Full</span>
                <span className="dark:text-white text-slate-900">{tournament.joinedSlots} / {tournament.maxSlots}</span>
              </div>
              <div className="w-full dark:bg-white/10 bg-slate-200 rounded-full h-2">
                <div className="bg-neon-blue h-2 rounded-full" style={{width: `${Math.min((tournament.joinedSlots/tournament.maxSlots)*100, 100)}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 relative">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-brand-light hover:text-white">✕</button>
            <h2 className="text-2xl font-bold mb-2">Join {tournament.title}</h2>
            <p className="text-brand-light text-sm mb-6">Entry Fee: ₹{tournament.entryFee} will be deducted.</p>
            
            <form onSubmit={submitJoin} className="space-y-4">
              <div>
                <label className="block text-xs text-brand-light mb-1 uppercase">In-Game Name</label>
                <input type="text" required value={playerName} onChange={e=>setPlayerName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 outline-none focus:border-neon-blue" />
              </div>
              <div>
                <label className="block text-xs text-brand-light mb-1 uppercase">Game UID</label>
                <input type="text" required value={gameUid} onChange={e=>setGameUid(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 outline-none focus:border-neon-blue" />
              </div>
              <div>
                <label className="block text-xs text-brand-light mb-1 uppercase">Team Name (Optional)</label>
                <input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 outline-none focus:border-neon-blue" />
              </div>
              <div>
                <label className="block text-xs text-brand-light mb-1 uppercase">Winner UPI ID (For Prize)</label>
                <input type="text" required placeholder="example@upi" value={playerUpi} onChange={e=>setPlayerUpi(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 outline-none focus:border-neon-blue" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded font-bold transition-colors">Cancel</button>
                <button type="submit" disabled={joinLoading} className="flex-1 neon-button neon-button-blue">{joinLoading ? 'Processing...' : 'Confirm Join'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}