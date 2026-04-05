import React, { useState } from 'react';
import API from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    try {
      const res = await API.post('/auth/login', { username, password });
      onLogin(res.data.token, res.data.user);
    } catch (e) {
      setErr(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <h4>Login</h4>
      <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={submit}>Login</button>
      <div className="err">{err}</div>
    </div>
  );
}

