const fs = require('fs');
const path = require('path');

const files = {
  "src/pages/Tournaments.jsx": `import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import TournamentCard from '../components/TournamentCard';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const filtered = tournaments.filter(t => filter === 'all' ? true : t.game === filter);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black uppercase italic text-glow">Tournaments</h1>
      <div className="flex gap-4">
        {['all', 'Free Fire', 'BGMI'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={\`px-4 py-2 rounded-lg font-bold transition-all \${filter === f ? 'bg-neon-blue text-white' : 'bg-white/5 text-brand-light'}\`}>
            {f === 'all' ? 'All Games' : f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(t => <TournamentCard key={t.id} tournament={t} />)}
      </div>
    </div>
  );
}`,
  "src/pages/TournamentDetails.jsx": `import React from 'react'; export default function TournamentDetails() { return <div>Tournament Details</div>; }`,
  "src/pages/Wallet.jsx": `import React from 'react'; export default function Wallet() { return <div>Wallet</div>; }`,
  "src/pages/Leaderboard.jsx": `import React from 'react'; export default function Leaderboard() { return <div>Leaderboard</div>; }`,
  "src/pages/Profile.jsx": `import React from 'react'; export default function Profile() { return <div>Profile</div>; }`,
  "src/pages/LoginSignup.jsx": `import React from 'react'; export default function LoginSignup() { return <div>Login / Signup</div>; }`,
  "src/pages/AdminPanel.jsx": `import React from 'react'; export default function AdminPanel() { return <div>Admin Panel</div>; }`,
};

for (const [filepath, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
}
console.log("Files generated");
