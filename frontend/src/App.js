import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import API, { setToken } from './api';
import Login from './components/Login';
import Register from './components/Register';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import GroupChat from './components/GroupChat';
import Profile from './components/Profile';
import Moments from './components/Moments';
import GroupChat from './components/GroupChat';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setTok] = useState(localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    if (token) setToken(token);
    if (user) {
      const s = io(SOCKET_URL);
      s.on('connect', () => {
        s.emit('auth', user.id);
      });
      setSocket(s);
      return () => s.disconnect();
    }
  }, [user, token]);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setTok(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTok(null);
    setUser(null);
    setSocket(null);
  };

  if (!user) {
    return (
      <div className="app">
        <div className="auth">
          <h2>Chat App</h2>
          <Login onLogin={handleLogin} />
          <hr />
          <Register onRegister={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h3>Welcome {user.displayName}</h3>
        <button onClick={handleLogout}>Logout</button>
        <Profile user={user} setUser={setUser} />
        <ChatList user={user} setActiveChat={setActiveChat} setActiveGroup={setActiveGroup} />
        <Moments user={user} />
      </aside>
      <main className="main">
        {activeChat && <ChatWindow user={user} socket={socket} chatUser={activeChat} />}
        {activeGroup && <GroupChat user={user} socket={socket} group={activeGroup} />}
        {!activeChat && !activeGroup && <div className="placeholder">Select a chat or group</div>}
      </main>
    </div>
  );
}

export default App;

