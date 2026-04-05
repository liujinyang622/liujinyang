import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ChatList({ user, setActiveChat, setActiveGroup }) {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await API.get('/users/search?q=');
      setContacts(res.data);
      const g = await API.get('/groups'); // optional endpoint; for demo we skip
    };
    load();
  }, []);

  const startChat = (u) => {
    setActiveGroup(null);
    setActiveChat(u);
  };

  const createGroup = async () => {
    const name = prompt('Group name');
    if (!name) return;
    const res = await API.post('/groups', { name, memberIds: [] });
    setGroups(prev => [res.data, ...prev]);
    setActiveGroup(res.data);
  };

  return (
    <div>
      <h4>Contacts</h4>
      <input placeholder="search" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="contacts">
        {contacts.filter(u=>u.username.includes(q)).map(c => (
          <div key={c._id} className="contact" onClick={()=>startChat(c)}>
            <img src={c.avatarUrl || '/default-avatar.png'} alt="" />
            <div>{c.displayName || c.username}</div>
          </div>
        ))}
      </div>
      <hr />
      <h4>Groups</h4>
      <button onClick={createGroup}>Create Group</button>
      <div>
        {groups.map(g => (
          <div key={g._id} onClick={()=>{ setActiveChat(null); setActiveGroup(g); }}>
            {g.name}
          </div>
        ))}
      </div>
    </div>
  );
}
