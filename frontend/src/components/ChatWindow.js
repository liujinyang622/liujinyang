import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ChatWindow({ user, socket, chatUser }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await API.get(`/messages/history/user/${chatUser._id}`);
      setMsgs(res.data);
    };
    load();
  }, [chatUser]);

  useEffect(() => {
    if (!socket) return;
    socket.on('private_message', (msg) => {
      // show only messages relevant to this chat
      if ((msg.from === user.id && msg.toUser === chatUser._id) || (msg.from === chatUser._id && msg.toUser === user.id)) {
        setMsgs(prev => [...prev, msg]);
      }
    });
    return () => socket.off('private_message');
  }, [socket, chatUser, user]);

  const send = () => {
    if (!text) return;
    const payload = { from: user.id, toUser: chatUser._id, type: 'text', content: text };
    socket.emit('private_message', payload);
    setText('');
  };

  const uploadFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const form = new FormData();
    form.append('file', f);
    const res = await API.post('/messages/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    const payload = { from: user.id, toUser: chatUser._id, type: 'file', content: res.data.url, fileName: res.data.fileName };
    socket.emit('private_message', payload);
  };

  return (
    <div className="chat-window">
      <h3>{chatUser.displayName || chatUser.username}</h3>
      <div className="messages">
        {msgs.map(m => (
          <div key={m._id} className={`msg ${m.from === user.id ? 'me' : 'them'}`}>
            <div className="meta">{m.type} {m.fileName || ''}</div>
            {m.type === 'text' && <div>{m.content}</div>}
            {m.type === 'image' && <img src={m.content} alt="" />}
            {m.type === 'file' && <a href={m.content} target="_blank" rel="noreferrer">{m.fileName || 'file'}</a>}
          </div>
        ))}
      </div>
      <div className="composer">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" />
        <input type="file" onChange={uploadFile} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
