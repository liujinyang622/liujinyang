仓库结构如下
liujinyang622/
├─ backend/                # 后端代码
│  ├─ package.json
│  ├─ server.js
│  ├─ config/
│  │   └─ db.js
│  ├─ models/
│  │   ├─ User.js
│  │   ├─ Message.js
│  │   ├─ Group.js
│  │   └─ Post.js
│  ├─ routes/
│  │   ├─ auth.js
│  │   ├─ users.js
│  │   ├─ messages.js
│  │   ├─ groups.js
│  │   └─ posts.js
│  ├─ middleware/
│  │   └─ auth.js
│  └─ uploads/             # 上传文件存放
└─ frontend/               # 前端代码
   ├─ package.json
   ├─ public/
   └─ src/
      ├─ index.js
      ├─ App.js
      ├─ api.js
      ├─ styles.css
      └─ components/
          ├─ Login.js
          ├─ Register.js
          ├─ ChatList.js
          ├─ ChatWindow.js
          ├─ GroupChat.js
          ├─ Profile.js
          └─ Moments.js

