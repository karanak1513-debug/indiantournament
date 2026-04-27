import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Trophy, Medal, Target } from 'lucide-react';
import clsx from 'clsx';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('All Time');

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('points', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc, idx) => ({ 
        id: doc.id, 
        rank: idx + 1,
        ...doc.data() 
      }));
      setLeaderboard(data);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="text-center">
        <h1 className="text-4xl font-black uppercase italic text-glow">Hall of Fame</h1>
        <p className="text-brand-light mt-2">Top players based on performance and wins</p>
      </div>

      {/* Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-2 md:gap-6 pt-10 pb-8 px-2 overflow-x-auto">
          {/* Rank 2 */}
          <div className="glass-card flex flex-col items-center w-28 md:w-40 pb-6 border-white/20 relative mt-10">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-800 text-xl shadow-[0_0_15px_rgba(209,213,219,0.5)] -mt-8 mb-4 border-4 border-gray-400">
              {leaderboard[1].playerName.charAt(0)}
            </div>
            <h3 className="font-bold text-center truncate w-full px-2">{leaderboard[1].playerName}</h3>
            <p className="text-neon-blue font-black">{leaderboard[1].points} PTS</p>
            <div className="absolute -bottom-4 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
          </div>

          {/* Rank 1 */}
          <div className="glass-card flex flex-col items-center w-32 md:w-48 pb-8 border-yellow-500/50 relative shadow-[0_0_30px_rgba(234,179,8,0.2)] z-10">
            <Trophy className="absolute -top-12 w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-yellow-900 text-2xl shadow-[0_0_20px_rgba(234,179,8,0.5)] -mt-10 mb-4 border-4 border-yellow-200">
              {leaderboard[0].playerName.charAt(0)}
            </div>
            <h3 className="font-bold text-center text-lg truncate w-full px-2">{leaderboard[0].playerName}</h3>
            <p className="text-yellow-400 font-black text-xl">{leaderboard[0].points} PTS</p>
            <div className="text-xs text-brand-light mt-1">{leaderboard[0].kills} Kills</div>
            <div className="absolute -bottom-5 bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 border-yellow-200">1</div>
          </div>

          {/* Rank 3 */}
          <div className="glass-card flex flex-col items-center w-28 md:w-40 pb-6 border-orange-700/50 relative mt-16">
            <div className="w-16 h-16 bg-orange-700 rounded-full flex items-center justify-center font-bold text-orange-100 text-xl shadow-[0_0_15px_rgba(194,65,12,0.5)] -mt-8 mb-4 border-4 border-orange-500">
              {leaderboard[2].playerName.charAt(0)}
            </div>
            <h3 className="font-bold text-center truncate w-full px-2">{leaderboard[2].playerName}</h3>
            <p className="text-orange-400 font-black">{leaderboard[2].points} PTS</p>
            <div className="absolute -bottom-4 bg-orange-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card p-2 md:p-6 mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm md:text-base">
            <thead>
              <tr className="border-b border-white/10 text-brand-light">
                <th className="pb-4 pl-4">Rank</th>
                <th className="pb-4">Player</th>
                <th className="pb-4">Points</th>
                <th className="pb-4 hidden md:table-cell">Kills</th>
                <th className="pb-4 hidden md:table-cell">Wins</th>
                <th className="pb-4 text-right pr-4">Total Prize</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, index) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 pl-4 font-bold text-brand-light">#{index + 1}</td>
                  <td className="py-4 font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                      {p.playerName.charAt(0)}
                    </div>
                    {p.playerName}
                  </td>
                  <td className="py-4 font-black text-neon-blue">{p.points}</td>
                  <td className="py-4 hidden md:table-cell">{p.kills}</td>
                  <td className="py-4 hidden md:table-cell">{p.wins}</td>
                  <td className="py-4 text-right pr-4 text-green-400 font-bold">₹{p.totalPrize}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 && (
            <p className="text-center text-brand-light py-8">Leaderboard is currently empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}