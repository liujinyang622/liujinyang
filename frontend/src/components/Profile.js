import React, { useState } from 'react';
import API from '../api';

export default function Profile({ user, setUser }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [avatar, setAvatar] = useState(null);

  const save = async () => {
    const form = new FormData();
    form.append('displayName', displayName);
    if (avatar) form.append('avatar', avatar);
    const res = await API.post('/users/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    alert('Saved');
  };

  return (
    <div>
      <h4>Profile</h4>
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} />
      <input type="file" onChange={e=>setAvatar(e.target.files[0])} />
      <button onClick={save}>Save</button>
    </div>
  );
}
