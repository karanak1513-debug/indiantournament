import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Coins, Trophy, Calendar, Map, Target } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function TournamentCard({ tournament }) {
  const isFull = tournament.joinedSlots >= tournament.maxSlots;
  const isClosed = tournament.status === 'closed' || tournament.status === 'completed';
  const isLive = tournament.status === 'live';

  const statusConfig = {
    open: { color: 'bg-green-500/20 text-green-400 border-green-500/50', border: 'border-green-500/30 hover:border-green-400', shadow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]' },
    live: { color: 'bg-red-500/20 text-red-400 border-red-500/50', border: 'border-red-500/30 hover:border-red-400', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' },
    starting_soon: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', border: 'border-orange-500/30 hover:border-orange-400', shadow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]' },
    closed: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/50', border: 'border-white/10 hover:border-white/20', shadow: 'hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]' },
    completed: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', border: 'border-purple-500/30 hover:border-purple-400', shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
  };

  const status = statusConfig[tournament.status] || statusConfig.open;

  return (
    <div className={clsx(
      "glass-card group relative flex flex-col overflow-hidden transition-all duration-500",
      "transform hover:-translate-y-2",
      status.border, status.shadow
    )}>
      {/* Top Banner Image / Game Type Indicator */}
      <div className="h-40 bg-brand-darker relative overflow-hidden">
        {tournament.externalImageUrl ? (
           <img src={tournament.externalImageUrl} alt={tournament.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-brand-gray to-brand-darker"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-darker/20 to-transparent z-10"></div>
        
        <div className="absolute top-3 right-3 z-20">
          <span className={clsx(
            'px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider shadow-lg',
            status.color
          )}>
            {tournament.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="absolute bottom-3 left-4 z-20 w-full pr-4">
          <h3 className="text-2xl font-black italic uppercase text-white group-hover:text-neon-blue transition-colors text-glow truncate">
            {tournament.title}
          </h3>
          <p className="text-xs font-bold text-brand-light flex items-center gap-2 mt-1 uppercase tracking-wider">
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">{tournament.game}</span>
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">{tournament.mode}</span>
          </p>
        </div>
      </div>

      <div className="p-5 flex-grow flex flex-col gap-4 relative">
        {/* Description */}
        {tournament.description && (
          <p className="text-brand-light text-xs leading-relaxed border-l-2 border-neon-blue/40 pl-3 italic">
            {tournament.description}
          </p>
        )}
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
          <div className="flex items-center gap-2 text-brand-light">
            <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
            <span className="text-xs">Prize: <br/><strong className="text-white text-sm">₹{tournament.prizePool}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-brand-light">
            <Coins className="w-4 h-4 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
            <span className="text-xs">Entry: <br/><strong className="text-white text-sm">₹{tournament.entryFee}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-brand-light">
            <Map className="w-4 h-4 text-green-400" />
            <span className="text-xs">Map: <br/><strong className="text-white text-sm truncate">{tournament.map}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-brand-light">
            <Target className="w-4 h-4 text-red-400" />
            <span className="text-xs">Mode: <br/><strong className="text-white text-sm">{tournament.mode}</strong></span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-center gap-2 text-white font-bold bg-white/5 p-2 rounded-lg text-sm border border-white/10">
          <Calendar className="w-4 h-4 text-neon-purple" />
          {format(new Date(tournament.matchStartTime), 'MMM dd, yyyy - hh:mm a')}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-brand-light">Slots Joined</span>
            <span className={isFull ? 'text-red-400' : 'text-neon-blue'}>
              {tournament.joinedSlots} / {tournament.maxSlots}
            </span>
          </div>
          <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
            <div 
              className={clsx(
                "h-full rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor]",
                isFull ? "bg-red-500 text-red-500" : "bg-neon-blue text-neon-blue"
              )}
              style={{ width: `${Math.min((tournament.joinedSlots / tournament.maxSlots) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 mt-auto">
          <Link to={`/tournaments/${tournament.id}`} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 text-center py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02]">
            Details
          </Link>
          {!isClosed && !isFull && (
            <Link to={`/tournaments/${tournament.id}`} className="flex-1 neon-button neon-button-blue text-center text-sm py-2.5 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              Join Battle
            </Link>
          )}
          {(isClosed || isFull) && (
            <button disabled className="flex-1 bg-black/40 text-brand-light border border-white/10 text-center py-2.5 rounded-lg font-bold text-sm cursor-not-allowed uppercase tracking-wider">
              {isFull ? 'Full' : 'Closed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
