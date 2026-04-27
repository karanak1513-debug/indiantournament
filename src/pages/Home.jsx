import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, limit, addDoc } from 'firebase/firestore';
import TournamentCard from '../components/TournamentCard';
import { Gamepad2, ShieldCheck, Trophy, ChevronRight, Users, Target, Calendar, Coins, Megaphone, X, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [globalFeaturedMatch, setGlobalFeaturedMatch] = useState(null);
  const [globalCountdown, setGlobalCountdown] = useState('--:--:--');
  const { userData } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'tournaments'),
      where('status', 'in', ['open', 'starting_soon']),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tourneys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Auto-sample data if empty
      if (tourneys.length === 0 && snapshot.docs.length === 0) {
        // Just a safe check, avoiding spam
      }
      
      setFeaturedTournaments(tourneys);
    });


    const unsubA = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const anns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(anns);
      if(anns.length > 0 && !sessionStorage.getItem('announcementsViewed')) {
         setShowAnnouncements(true);
         sessionStorage.setItem('announcementsViewed', 'true');
      }
    });

    const unsubF = onSnapshot(query(collection(db, 'tournaments'), where('isFeatured', '==', true)), (snapshot) => {
      const featured = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalFeaturedMatch(featured[0] || null);
    });

    return () => { unsubscribe(); unsubA(); unsubF(); };
  }, []);

  // Global Featured Match Countdown
  useEffect(() => {
    if (!globalFeaturedMatch) return;
    const tick = () => {
      const diff = new Date(globalFeaturedMatch.matchStartTime) - new Date();
      if (diff <= 0) { setGlobalCountdown('LIVE NOW! 🔴'); return; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setGlobalCountdown(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [globalFeaturedMatch]);

  return (
    <div className="space-y-20 pb-20">
      {/* Announcement Modal */}
      {showAnnouncements && announcements.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-0 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-neon-red/20 border-b border-neon-red/30 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-neon-red">
                <Megaphone className="w-5 h-5" /> Official Announcements
              </h2>
              <button onClick={() => setShowAnnouncements(false)} className="text-brand-light hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {announcements.map((a, i) => (
                <div key={a.id} className="bg-white/5 border border-white/10 rounded-lg p-4 relative">
                  {i === 0 && <span className="absolute -top-3 -right-3 bg-neon-red text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg shadow-neon-red/50 animate-pulse">NEW</span>}
                  <p className="text-brand-light">{a.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 text-center">
               <button onClick={() => setShowAnnouncements(false)} className="neon-button neon-button-blue px-8 py-2 text-sm w-full">Acknowledge & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-12">
        <div className="absolute inset-0 bg-brand-accent/5 rounded-full blur-[150px] -z-10"></div>
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Global Active Badge */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-bold tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              🌍 Global Active
            </div>
          </div>
          <div className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-brand-light text-sm font-bold uppercase tracking-widest mb-4">
            The Ultimate Esports Arena
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-glow drop-shadow-2xl">
            Open <span className="text-neon-blue text-glow-blue">Battleground</span>
          </h1>
          <p className="text-xl md:text-2xl text-brand-light font-medium max-w-3xl mx-auto leading-relaxed">
            Join Free Fire & BGMI tournaments, compete live, and win rewards.
          </p>

          {/* Global Featured Countdown */}
          {globalFeaturedMatch && (
            <div className="mt-8 mb-4 inline-block glass-card p-6 border-neon-blue/40 shadow-[0_0_30px_rgba(0,210,255,0.15)] animate-in zoom-in duration-500">
              <h2 className="text-sm font-bold text-neon-blue uppercase tracking-widest mb-2">⭐ Featured Match Starts In</h2>
              <p className="text-xl font-black text-white mb-4 truncate max-w-md mx-auto">{globalFeaturedMatch.title}</p>
              <div className="flex justify-center gap-4">
                {['HOURS','MINUTES','SECONDS'].map((label, i) => (
                  <div key={label} className="text-center">
                    <div className="bg-brand-darker border border-neon-blue/30 px-5 py-3 rounded-xl font-mono text-4xl text-neon-blue font-black shadow-[0_0_15px_rgba(0,210,255,0.4)] min-w-[80px]">
                      {globalCountdown === 'LIVE NOW! 🔴' ? (i === 0 ? '🔴' : i === 1 ? 'LIVE' : '!!') : globalCountdown.split(':')[i]}
                    </div>
                    <p className="text-[10px] text-brand-light uppercase tracking-widest mt-2 font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link to="/tournaments" className="w-full sm:w-auto neon-button neon-button-blue text-xl py-4 px-12 uppercase italic tracking-wider">
              Join Battle
            </Link>
            <Link to="/tournaments" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold py-4 px-12 rounded-lg transition-all uppercase tracking-wider">
              View Tournaments
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card p-6 text-center shadow-neon-blue/5 border-b-2 border-b-neon-blue group">
          <Trophy className="w-8 h-8 mx-auto text-neon-blue mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-3xl font-black">2.5K+</p>
          <p className="text-brand-light text-sm uppercase tracking-wider font-bold">Tournaments</p>
        </div>
        <div className="glass-card p-6 text-center shadow-neon-purple/5 border-b-2 border-b-neon-purple group">
          <Users className="w-8 h-8 mx-auto text-neon-purple mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-3xl font-black">75K+</p>
          <p className="text-brand-light text-sm uppercase tracking-wider font-bold">Players</p>
        </div>
        <div className="glass-card p-6 text-center shadow-yellow-500/5 border-b-2 border-b-yellow-500 group">
          <Coins className="w-8 h-8 mx-auto text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-3xl font-black">₹50L+</p>
          <p className="text-brand-light text-sm uppercase tracking-wider font-bold">Prize Pool</p>
        </div>
        <div className="glass-card p-6 text-center shadow-neon-red/5 border-b-2 border-b-neon-red group">
          <Target className="w-8 h-8 mx-auto text-neon-red mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-3xl font-black">18K+</p>
          <p className="text-brand-light text-sm uppercase tracking-wider font-bold">Teams</p>
        </div>
      </section>

      {/* Dashboard Preview (if logged in) */}
      {userData && (
        <section>
          <div className="glass-card p-8 flex items-center justify-between border border-neon-blue/20 bg-gradient-to-r from-neon-blue/10 to-transparent">
            <div>
              <h3 className="text-brand-light text-sm font-bold uppercase tracking-wider mb-2">Wallet Balance</h3>
              <p className="text-5xl font-black text-white text-glow">₹{userData.walletBalance}</p>
            </div>
            <Link to="/wallet" className="neon-button neon-button-purple text-sm px-6 py-3">Add Cash</Link>
          </div>
        </section>
      )}

      {/* 3. Featured Tournaments */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <h2 className="text-4xl font-black uppercase italic flex items-center gap-4">
            <Gamepad2 className="text-neon-red w-10 h-10" /> 
            Featured <span className="text-neon-red text-glow-red">Battles</span>
          </h2>
          <Link to="/tournaments" className="text-brand-light hover:text-white font-bold flex items-center transition-colors bg-white/5 px-6 py-2 rounded-full border border-white/10 hover:bg-white/10">
            See All <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
        
        {featuredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-16 text-center border-dashed border-2 border-white/10">
             <div className="animate-pulse flex flex-col items-center">
               <div className="w-16 h-16 bg-white/10 rounded-full mb-4"></div>
               <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
               <div className="h-3 w-32 bg-white/5 rounded"></div>
             </div>
          </div>
        )}
      </section>

      {/* 7. How It Works */}
      <section className="bg-brand-gray/20 rounded-3xl p-10 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-neon-purple/5 to-transparent -z-10"></div>
        <h2 className="text-4xl font-black uppercase italic text-center mb-12">Path to <span className="text-neon-purple text-glow">Glory</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
          {[
            { step: '1', title: 'Sign In', desc: 'Create account or login with Google', color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
            { step: '2', title: 'Add Cash', desc: 'Top up your wallet using secure UPI', color: 'text-neon-purple', bg: 'bg-neon-purple/10 border-neon-purple/30' },
            { step: '3', title: 'Join Battle', desc: 'Select game and pay entry fee', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
            { step: '4', title: 'Get Approved', desc: 'Admin verifies your payment & details', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
            { step: '5', title: 'Room Unlock', desc: 'Get ID/Pass 10 mins before match', color: 'text-neon-red', bg: 'bg-neon-red/10 border-neon-red/30' },
            { step: '6', title: 'Win Rewards', desc: 'Dominate and get cash in wallet', color: 'text-white', bg: 'bg-white/10 border-white/30' },
          ].map((s) => (
            <div key={s.step} className="text-center group">
              <div className={`w-16 h-16 rounded-2xl ${s.bg} border flex items-center justify-center mx-auto mb-4 group-hover:-translate-y-2 transition-transform duration-300 shadow-xl`}>
                <span className={`text-2xl font-black ${s.color}`}>{s.step}</span>
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-brand-light text-xs mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Rules Section */}
      <section>
        <h2 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-3">
          <ShieldCheck className="text-brand-light w-8 h-8" /> 
          Arena <span className="text-brand-light">Rules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "No hacking, cheating, or use of 3rd party apps.",
            "Correct In-Game Name and UID is strictly required.",
            "Room ID & Password unlock exactly 10 mins before match.",
            "Admin decision is final and binding in all disputes."
          ].map((rule, idx) => (
            <div key={idx} className="bg-brand-gray/40 border border-white/5 p-4 rounded-xl flex items-start gap-4 hover:bg-brand-gray/60 transition-colors">
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center font-bold text-brand-light flex-shrink-0">{idx + 1}</div>
              <p className="text-sm text-brand-light pt-1">{rule}</p>
            </div>
          ))}
        </div>
      </section>
      {/* About / Description Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-red/5 rounded-3xl -z-10" />
        <div className="glass-card p-10 md:p-14 border border-white/10 rounded-3xl text-center">
          <div className="inline-block px-4 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-sm font-bold uppercase tracking-widest mb-6">
            About Battle Arena
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-6">
            India's <span className="text-neon-blue text-glow-blue">Premier</span> Mobile Esports Platform
          </h2>
          <p className="text-brand-light text-lg leading-relaxed max-w-3xl mx-auto mb-6">
            Battle Arena is India's most trusted Free Fire & BGMI tournament platform. We host daily online tournaments with real cash prizes, instant wallet payouts, and a fair competitive environment for every player — from beginners to pro squads.
          </p>
          <p className="text-brand-light text-base leading-relaxed max-w-3xl mx-auto">
            Our platform is fully secured, admin-verified, and built to give every player the ultimate esports experience. Join thousands of players already competing and winning real money every day!
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { label: 'Daily Tournaments', value: '10+' },
              { label: 'Active Players', value: '5000+' },
              { label: 'Cash Paid Out', value: '₹2L+' },
              { label: 'Games Supported', value: 'FF & BGMI' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-brand-light uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section>
        <h2 className="text-4xl font-black uppercase italic text-center mb-10">
          Contact <span className="text-neon-red text-glow-red">Us</span>
        </h2>
        <div className="flex justify-center">

          {/* Instagram */}
          <a href="https://www.instagram.com/battle_arena_new_launch?igsh=MWNndjB6M3Qydm52cw%3D%3D" target="_blank" rel="noreferrer"
            className="glass-card p-10 text-center border border-pink-500/20 hover:border-pink-500/60 hover:bg-pink-500/5 transition-all duration-300 group cursor-pointer w-full max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="url(#igGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f9ce34" />
                    <stop offset="35%" stopColor="#ee2a7b" />
                    <stop offset="100%" stopColor="#6228d7" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">Instagram</h3>
            <p className="text-brand-light text-sm mb-4">Follow us for updates & highlights</p>
            <span className="font-bold text-base" style={{background: 'linear-gradient(90deg,#f9ce34,#ee2a7b,#6228d7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>@battle_arena_new_launch</span>
          </a>

        </div>

        {/* Mission / Vision / Values Cards */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded-full text-neon-blue text-xs font-bold uppercase tracking-widest mb-3">
              Who We Are
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic">
              Our <span className="text-neon-blue text-glow-blue">Purpose</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Mission */}
            <div className="glass-card p-8 border border-neon-blue/20 hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-2xl -z-0 group-hover:bg-neon-blue/10 transition-all" />
              <div className="w-14 h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-neon-blue mb-3">Our Mission</h3>
              <p className="text-brand-light text-sm leading-relaxed">
                To build India's most trusted and fair esports tournament platform — where every player, from village to city, gets a real chance to compete, win, and earn from their gaming skills.
              </p>
              <div className="mt-5 h-0.5 w-12 bg-neon-blue/40 rounded-full group-hover:w-24 transition-all duration-500" />
            </div>

            {/* Vision */}
            <div className="glass-card p-8 border border-neon-purple/20 hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-2xl -z-0 group-hover:bg-neon-purple/10 transition-all" />
              <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform">
                🚀
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-neon-purple mb-3">Our Vision</h3>
              <p className="text-brand-light text-sm leading-relaxed">
                To become the #1 mobile esports destination in India — hosting 1000+ daily tournaments, empowering 1 million+ players, and making esports a mainstream career path for Indian youth.
              </p>
              <div className="mt-5 h-0.5 w-12 bg-neon-purple/40 rounded-full group-hover:w-24 transition-all duration-500" />
            </div>

            {/* Values */}
            <div className="glass-card p-8 border border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -z-0 group-hover:bg-yellow-500/10 transition-all" />
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform">
                🏆
              </div>
              <h3 className="text-xl font-black uppercase tracking-wider text-yellow-400 mb-3">Our Values</h3>
              <ul className="text-brand-light text-sm leading-relaxed space-y-2">
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✦</span> 100% Fair Play & Anti-Cheat</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✦</span> Instant Wallet Payouts</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✦</span> Admin-Verified Tournaments</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✦</span> Made for Indian Gamers</li>
              </ul>
              <div className="mt-5 h-0.5 w-12 bg-yellow-500/40 rounded-full group-hover:w-24 transition-all duration-500" />
            </div>

          </div>
        </div>

        {/* India Pride Banner */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-col items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="text-2xl">🇮🇳</span>
            <p className="text-lg font-black uppercase tracking-widest"
              style={{background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              India's First Website
            </p>
            <p className="text-brand-light text-sm font-bold uppercase tracking-wider">
              Built Exclusively for Indian Players 🎮
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-brand-light text-sm">
          <p>© 2025 <span className="text-white font-bold">Battle Arena Esports</span>. All rights reserved. | Made with ❤️ for Indian Gamers</p>
        </div>
      </section>

    </div>
  );
}
