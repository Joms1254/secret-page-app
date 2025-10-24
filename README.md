Secret Page App

built with Next.js (TypeScript), Tailwind CSS, and Supabase.  
The app allows users to register, log in, manage secret messages, connect with friends, and share secrets securely protected by Row-Level Security (RLS) and real-time Supabase authentication.

---


## Features

### Authentication
- User registration and login using Supabase Auth  
- Route protection via Next.js middleware  
- Logout and permanent account deletion  

### Dashboard
- Central navigation hub for all secret pages  
- Responsive layout designed with Tailwind CSS  

### Secret Page 1
- View your personal secret message  
- Logout and delete account options  

### Secret Page 2
- Add or update your secret message  
- Inherits all Secret Page 1 functionality  

### Secret Page 3
- Send, accept, and reject friend requests  
- View friends and their secret messages  
- Attempting to view non-friends’ secrets returns a 401 Unauthorized (via RLS)  

---

## Tech Stack

| Category | Technology |
|-----------|-------------|
| Framework | Next.js 14 |
| Language | TypeScript |
| Styling | Tailwind CSS|
| Database & Auth | Supabase |
| Security | Row-Level Security (RLS) |
| Deployment | Vercel |


