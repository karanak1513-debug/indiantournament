import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User, Mail, Wallet, Gamepad2, Key, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { userData, logout } = useAuth();
  const [joins, setJoins] = useState([]);
  const [tournaments, setTournaments] = useState({});

  useEffect(() => {
    if (!userData?.uid) return;
    
    const q = query(collection(db, 'joins'), where('userId', '==', userData.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const joinsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJoins(joinsData);

      // Fetch related tournament data for room details
      const unsubTournaments = onSnapshot(collection(db, 'tournaments'), (tSnap) => {
        const tMap = {};
        tSnap.forEach(doc => { tMap[doc.id] = doc.data(); });
        setTournaments(tMap);
      });
      return () => unsubTournaments();
    });

    return () => unsub();
  }, [userData]);

  return (
    <div className="space-y-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden border-2 border-neon-blue flex items-center justify-center">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white/50" />
              )}
            </div>
            <h2 className="text-2xl font-bold">{userData?.name}</h2>
            <p className="text-brand-light flex items-center justify-center gap-2 mt-1">
              <Mail className="w-4 h-4" /> {userData?.email}
            </p>
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white/5 p-3 rounded-lg">
                <p className="text-xs text-brand-light uppercase mb-1">Balance</p>
                <p className="text-xl font-bold text-neon-blue">₹{userData?.walletBalance || 0}</p>
              </div>
              <div className="flex-1 bg-white/5 p-3 rounded-lg">
                <p className="text-xs text-brand-light uppercase mb-1">Tournaments</p>
                <p className="text-xl font-bold">{joins.length}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full mt-6 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white py-2 rounded-lg transition-colors font-bold">
              Logout
            </button>
          </div>
        </div>

        {/* My Battles & Room Details */}
        <div className="md:col-span-2">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-neon-purple" /> My Battles
            </h3>
            
            <div className="space-y-4">
              {joins.length > 0 ? joins.map(join => {
                const tournament = tournaments[join.tournamentId];
                const isApproved = join.status === 'approved';
                const matchTime = tournament ? new Date(tournament.matchStartTime) : null;
                const timeDiff = matchTime ? matchTime.getTime() - new Date().getTime() : 0;
                const showRoomDetails = isApproved && timeDiff <= 10 * 60 * 1000 && timeDiff > -10000000;

                return (
                  <div key={join.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg">{join.tournamentTitle}</h4>
                      <p className="text-sm text-brand-light">Game UID: {join.gameUid} | Ign: {join.playerName}</p>
                      {matchTime && (
                        <p className="text-xs text-brand-light mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Match Time: {format(matchTime, 'MMM dd, hh:mm a')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${join.status === 'approved' ? 'bg-green-500/20 text-green-400' : join.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {join.status}
                      </span>

                      {/* Room Details Logic */}
                      {isApproved && tournament && (
                        <div className="mt-3 text-right">
                          {showRoomDetails ? (
                            <div className="bg-neon-blue/10 border border-neon-blue/30 p-2 rounded text-sm inline-block">
                              <p className="text-white"><span className="text-brand-light">Room ID:</span> {tournament.roomId || 'Waiting...'}</p>
                              <p className="text-white"><span className="text-brand-light">Pass:</span> {tournament.roomPassword || 'Waiting...'}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-brand-light flex items-center gap-1">
                              <Key className="w-3 h-3" /> Unlocks 10m before match
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-brand-light py-8">You haven't joined any tournaments yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}