import React, { useEffect, useState } from 'react';
import API from '../api';

export default function Moments({ user }) {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await API.get('/posts');
      setPosts(res.data);
    };
    load();
  }, []);

  const publish = async () => {
    const form = new FormData();
    form.append('text', text);
    if (media) form.append('media', media);
    const res = await API.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setPosts(prev => [res.data, ...prev]);
    setText('');
    setMedia(null);
  };

  const like = async (id) => {
    const res = await API.post(`/posts/${id}/like`);
    setPosts(prev => prev.map(p => p._id === id ? res.data : p));
  };

  const comment = async (id) => {
    const c = prompt('Comment');
    if (!c) return;
    const res = await API.post(`/posts/${id}/comment`, { text: c });
    setPosts(prev => prev.map(p => p._id === id ? res.data : p));
  };

  return (
    <div>
      <h4>Moments</h4>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share something" />
      <input type="file" onChange={e=>setMedia(e.target.files[0])} />
      <button onClick={publish}>Post</button>
      <div className="posts">
        {posts.map(p => (
          <div key={p._id} className="post">
            <div><strong>{p.author.displayName}</strong></div>
            <div>{p.text}</div>
            {p.mediaUrls && p.mediaUrls.map((m,i)=> <img key={i} src={m} alt="" style={{maxWidth:200}} />)}
            <div>
              <button onClick={()=>like(p._id)}>Like {p.likes.length}</button>
              <button onClick={()=>comment(p._id)}>Comment {p.comments.length}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
