# Quick Start Guide - Proxy Server Setup

## ✅ CORS Problem Solved!

The application now uses an Express.js proxy server to bypass CORS restrictions.

## 🚀 How to Run

Start the local backend first (Docker Desktop must be running):

```bash
git clone --branch tasks/277427-bugfix --single-branch https://github.com/NikitinGit/School-back.git
cd School-back
docker compose up -d --build
```

The API runs at `http://localhost:8080`, with Swagger at
`http://localhost:8080/swagger-ui/index.html`. Use Basic Auth `admin` / `admin`.
Then run the frontend commands below from the frontend repository.

### Option 1: Run Everything at Once (Recommended)

Open a terminal and run:

```bash
npm run dev:all
```

This will start:
- ✅ Proxy server on `http://localhost:3001`
- ✅ Next.js app on `http://localhost:3000`

### Option 2: Run Separately (2 Terminals)

**Terminal 1 - Start Proxy Server:**
```bash
npm run proxy
```

You should see:
```
🚀 Proxy server running on http://localhost:3001
📡 Proxying requests to: http://212.220.105.29:8079
✅ CORS enabled for: http://localhost:3000
```

**Terminal 2 - Start Next.js:**
```bash
npm run dev
```

## 🔍 Testing

1. **Check Proxy Health:**
   Open browser: http://localhost:3001/health
   
   You should see:
   ```json
   {
     "status": "ok",
     "message": "Proxy server is running",
     "target": "http://localhost:8080"
   }
   ```

2. **Test API Request:**
   Open browser console on http://localhost:3000 and run:
   ```javascript
   fetch('http://localhost:3001/api/users/me')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Test from the App:**
   - Go to http://localhost:3000
   - Navigate to Profile page
   - The app should load user data from the backend

## 📁 Files Added

- `server.js` - Express proxy server
- `.env.local` - Environment variables (not committed to git)
- `.env.example` - Template for environment variables
- Updated `package.json` with new scripts and dependencies
- Updated `lib/api.ts` to use proxy URL

## 🔧 How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │         │Proxy Server  │         │ Backend API │
│ :3000       │────────▶│ :3001        │────────▶│ :8080       │
│             │         │              │         │             │
│ Next.js     │◀────────│ Express.js   │◀────────│ Spring Boot │
└─────────────┘         └──────────────┘         └─────────────┘
                        Adds CORS headers
```

**Request Flow:**
1. Frontend sends request to `http://localhost:3001/api/users/me`
2. Proxy receives it and forwards to `http://localhost:8080/api/users/me`
3. Backend responds to proxy
4. Proxy adds CORS headers and sends back to frontend
5. ✅ No CORS errors!

## 🛠️ Configuration

Edit `.env.local` to change the proxy URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

The proxy defaults to `http://localhost:8080`. To override the backend target,
set `BACKEND_URL` in the shell before starting the proxy. For example, in PowerShell:

```powershell
$env:BACKEND_URL = 'http://localhost:8080'
npm.cmd run dev:all
```

## 📝 Available Scripts

- `npm run dev` - Start only Next.js (requires proxy running separately)
- `npm run proxy` - Start only proxy server
- `npm run dev:all` - Start both Next.js and proxy together ⭐
- `npm run build` - Build for production
- `npm start` - Start production server

## ⚠️ Important Notes

1. **Always run the proxy server** when developing - the frontend needs it for API calls
2. The `.env.local` file is ignored by git (contains local configuration)
3. Both servers must be running for the app to work properly
4. Proxy server logs all requests in the terminal for debugging

## 🐛 Troubleshooting

**Problem: "fetch failed" or CORS errors**
- ✅ Make sure proxy server is running on port 3001
- ✅ Check console logs in proxy terminal
- ✅ Verify backend is accessible at http://localhost:8080/swagger-ui/index.html

**Problem: Port 3001 already in use**
```bash
# Find and kill the process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

**Problem: Cannot connect to backend**
- ✅ Check if backend server is running
- ✅ Try accessing http://localhost:8080/api/users/me with Basic Auth `admin` / `admin`
- ✅ Check firewall settings

## 🎉 Success!

If you see this in the proxy terminal:
```
🚀 Proxy server running on http://localhost:3001
📡 Proxying requests to: http://localhost:8080
✅ CORS enabled for: http://localhost:3000
```

And this when making requests:
```
[PROXY] GET /api/users/me -> /api/users/me
[RESPONSE] 200 /api/users/me
```

**You're all set! 🎊**
