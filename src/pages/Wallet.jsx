import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { Wallet as WalletIcon, Plus, Copy, CheckCircle, Clock, XCircle, Eye, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Wallet() {
  const { userData } = useAuth();
  const [amount, setAmount] = useState('');
  const [screenshotLink, setScreenshotLink] = useState('');
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    if (!userData?.uid) return;
    
    // Listen to payment settings
    const unsubSettings = onSnapshot(collection(db, 'paymentSettings'), (snapshot) => {
      if(!snapshot.empty) setSettings(snapshot.docs[0].data());
    });

    // Listen to user's payment requests
    const qPayments = query(collection(db, 'payments'), where('userId', '==', userData.uid));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    // Listen to user's transactions
    const qTransactions = query(collection(db, 'walletTransactions'), where('userId', '==', userData.uid));
    const unsubTrans = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    return () => { unsubSettings(); unsubPayments(); unsubTrans(); };
  }, [userData]);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!amount || !screenshotLink || loading) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        userId: userData.uid,
        userName: userData.name,
        userEmail: userData.email,
        amount: Number(amount),
        screenshotLink,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setAmount('');
      setScreenshotLink('');
      setToast('Payment request submitted!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      setToast('Error submitting payment.');
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast('UPI ID Copied!');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {toast && (
        <div className="fixed top-24 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          {/* Balance Card */}
          <div className="glass-card p-8 text-center bg-gradient-to-b from-white/10 to-transparent relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <WalletIcon className="w-24 h-24" />
             </div>
             <h2 className="text-brand-light font-bold uppercase tracking-wider mb-2">Available Balance</h2>
             <p className="text-6xl font-black text-white text-glow">₹{userData?.walletBalance || 0}</p>
          </div>

          {/* Add Cash Card */}
          <div className="glass-card p-6 border-neon-purple/30 shadow-neon-purple/10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-purple">
              <Plus className="w-5 h-5" /> Add Cash
            </h3>
            {settings ? (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg text-center space-y-2">
                  <p className="text-sm text-brand-light">Scan QR or use UPI ID</p>
                  {settings.qrImageUrl && (
                    <img src={settings.qrImageUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg" />
                  )}
                  <div className="flex items-center justify-between bg-brand-darker p-2 rounded">
                    <span className="font-mono text-sm">{settings.upiId}</span>
                    <button onClick={() => copyToClipboard(settings.upiId)} className="text-brand-light hover:text-white"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitPayment} className="space-y-3">
                  <input type="number" required min={settings.minAddCash || 10} placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 focus:border-neon-purple outline-none" />
                  <input type="file" accept="image/*" required onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setScreenshotLink(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full bg-white/5 border border-white/10 rounded py-2 px-3 focus:border-neon-purple outline-none" />
                  <button type="submit" disabled={loading} className="w-full neon-button neon-button-purple">Submit Request</button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-brand-light">Loading payment settings...</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          {/* Payment Requests */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Payment Requests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-brand-light">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2 text-center">Proof</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? payments.map(p => (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-3">{format(new Date(p.createdAt), 'MMM dd, hh:mm a')}</td>
                      <td className="py-3 font-bold">₹{p.amount}</td>
                      <td className="py-3 text-center">
                        {p.screenshotLink && (
                          <button 
                            onClick={() => setSelectedProof(p.screenshotLink)}
                            className="text-neon-purple hover:text-white transition-colors p-1"
                          >
                            <Eye className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </td>
                      <td className="py-3">
                        {p.status === 'pending' && <span className="text-yellow-400 flex items-center gap-1"><Clock className="w-4 h-4"/> Pending</span>}
                        {p.status === 'approved' && <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Approved</span>}
                        {p.status === 'rejected' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> Rejected</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="py-4 text-center text-brand-light">No requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction History */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-brand-light">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? transactions.map(t => (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="py-3">{format(new Date(t.createdAt), 'MMM dd, hh:mm a')}</td>
                      <td className="py-3">{t.reason}</td>
                      <td className={`py-3 text-right font-bold ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="py-4 text-center text-brand-light">No transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full max-h-[80vh] glass-card p-2 border-neon-purple/30 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-2 border-b border-white/10">
              <h4 className="font-bold text-neon-purple flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Uploaded Proof</h4>
              <button 
                onClick={() => setSelectedProof(null)}
                className="p-2 hover:bg-white/5 rounded-lg text-brand-light hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-auto p-2 flex items-center justify-center bg-black/20">
              <img 
                src={selectedProof} 
                alt="Full Proof" 
                className="max-w-full h-auto object-contain rounded"
              />
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedProof(null)}></div>
        </div>
      )}
    </div>
  );
}