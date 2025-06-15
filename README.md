# SnippetHub – Save, Organize, and Collaborate on Snippets

SnippetHub is a full-stack web app to save, organize, and collaborate on your personal or shared text/code/file snippets. Built using the MERN stack with real-time collaboration, localStorage fallback, and now Redis caching for faster response times.

---

## Live Demo

- Frontend (Vercel): [snippet-hub-six.vercel.app](https://snippet-hub-six.vercel.app)
- Backend (Render): [snippethub-backend.onrender.com](https://snippethub-backend.onrender.com)

---

## Repositories

- Frontend GitHub: [github.com/Div1828/Snippet-Hub](https://github.com/Div1828/Snippet-Hub)
- Backend GitHub: [github.com/Div1828/SnippetHubBackend](https://github.com/Div1828/SnippetHubBackend)

---

## Features

### Snippet Management
- Add, edit, delete snippets
- Categorize and tag snippets
- Pin and unpin snippets
- Filter by category

### Collaboration & Presence
- Add collaborators (by username)
- Real-time content editing (via Socket.IO)
- Presence tracking – shows who is active in a snippet

### Authentication
- Register and Login with JWT tokens
- Protected routes based on user role and snippet visibility
- Snippet privacy: Public or Private

### Advanced Features
- Redis Caching: Frequently fetched data (like all snippets) is cached in Redis to reduce DB load and improve performance.
  - Cache Hit/Miss messages in terminal
  - Cache is automatically invalidated on snippet changes

- Frontend state is backed up in localStorage for offline-first experience

---

## Tech Stack

| Layer     | Tech Used                          |
|-----------|------------------------------------|
| Frontend  | React, TypeScript, Chakra UI       |
| Backend   | Node.js, Express.js, MongoDB       |
| Real-time | Socket.IO                          |
| Auth      | JWT + Custom Middleware            |
| Caching   | Redis (Upstash with ioredis)       |
| Hosting   | Vercel (Frontend), Render (Backend) |

---