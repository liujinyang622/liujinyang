import React, { useState } from 'react';
import API from '../api';

export default function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const submit = async () => {
    const res = await API.post('/auth/register', { username, password, displayName });
    onRegister(res.data.token, res.data.user);
  };

  return (
    <div>
      <h4>Register</h4>
      <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
      <input placeholder="display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={submit}>Register</button>
    </div>
  );
}

