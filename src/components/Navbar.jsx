import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, Wallet, Trophy, Gamepad2, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const { currentUser, userData, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-brand-darker/90 backdrop-blur-md border-b border-white/10 shadow-lg py-4' : 'bg-transparent py-6'
    )}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Gamepad2 className="w-8 h-8 text-neon-blue group-hover:text-neon-purple transition-colors" />
          <span className="text-2xl font-black tracking-widest text-glow uppercase italic">Battle Arena</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={clsx(
                  'text-sm font-semibold uppercase tracking-wider transition-colors',
                  location.pathname === link.path ? 'text-neon-blue text-glow-blue' : 'text-brand-light hover:text-white'
                )}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-semibold uppercase tracking-wider text-neon-red hover:text-glow-red flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Link to="/wallet" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all">
                  <Wallet className="w-4 h-4 text-neon-blue" />
                  <span className="font-bold">₹{userData?.walletBalance || 0}</span>
                </Link>
                <Link to="/profile" className="w-10 h-10 rounded-full bg-brand-gray border border-white/20 flex items-center justify-center overflow-hidden">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-brand-light" />
                  )}
                </Link>
              </>
            ) : (
              <Link to="/login" className="neon-button neon-button-blue">
                Login / Join
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-darker border-b border-white/10 p-4 flex flex-col gap-4 shadow-xl">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'p-3 rounded-lg',
                location.pathname === link.path ? 'bg-white/10 text-neon-blue' : 'text-brand-light'
              )}
            >
              {link.name}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setIsOpen(false)} className="p-3 rounded-lg text-neon-red">Admin Panel</Link>
          )}
          {currentUser ? (
            <div className="flex flex-col gap-2 mt-4 border-t border-white/10 pt-4">
              <Link to="/wallet" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-3 text-white">
                <Wallet className="w-5 h-5" /> Wallet (₹{userData?.walletBalance || 0})
              </Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-3 text-white">
                <User className="w-5 h-5" /> Profile
              </Link>
              <button onClick={() => { logout(); setIsOpen(false); }} className="text-left p-3 text-red-500">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="neon-button neon-button-blue text-center mt-4">
              Login / Join
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
