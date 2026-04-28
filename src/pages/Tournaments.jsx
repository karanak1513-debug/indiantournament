import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import TournamentCard from '../components/TournamentCard';
import { Search, Gamepad2 } from 'lucide-react';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const filtered = tournaments.filter(t => {
    const matchGame = filter === 'All' ? true : t.game === filter;
    const matchStatus = statusFilter === 'All' ? true : t.status === statusFilter.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchGame && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic text-glow dark:text-white text-slate-900">Tournaments</h1>
          <p className="dark:text-brand-light text-slate-600">Find and join the best esports battles</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-brand-light text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 dark:text-white text-slate-900 rounded-lg py-2 pl-10 pr-4 focus:border-neon-blue outline-none"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 dark:bg-white/5 bg-slate-100 p-4 rounded-xl border dark:border-white/5 border-slate-200">
        <div className="flex gap-2">
          {['All', 'Free Fire', 'BGMI'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-1.5 text-sm rounded-full font-bold transition-all ${filter === f ? 'bg-neon-blue text-brand-darker shadow-lg' : 'dark:bg-white/5 bg-white border dark:border-white/5 border-slate-200 dark:text-brand-light text-slate-600 hover:text-neon-blue dark:hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="w-px dark:bg-white/10 bg-slate-300 hidden md:block"></div>
        <div className="flex gap-2">
          {['All', 'Open', 'Starting Soon', 'Live', 'Closed'].map(f => (
            <button 
              key={f} 
              onClick={() => setStatusFilter(f)} 
              className={`px-4 py-1.5 text-sm rounded-full font-bold transition-all ${statusFilter === f ? 'bg-neon-purple text-white shadow-lg' : 'dark:bg-white/5 bg-white border dark:border-white/5 border-slate-200 dark:text-brand-light text-slate-600 hover:text-neon-blue dark:hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <Gamepad2 className="w-16 h-16 dark:text-white/20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold dark:text-white text-slate-900">No Tournaments Found</h3>
          <p className="dark:text-brand-light text-slate-600 mt-2">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}