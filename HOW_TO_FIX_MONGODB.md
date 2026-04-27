# Fix MongoDB Connection Error

## Most Common Cause: IP Not Whitelisted in Atlas

MongoDB Atlas blocks connections from unknown IP addresses by default.

### Fix (takes 2 minutes):

1. Go to https://cloud.mongodb.com and log in
2. Click your cluster → **Network Access** (left sidebar)
3. Click **+ Add IP Address**
4. Click **Allow Access from Anywhere** → this sets `0.0.0.0/0`
5. Click **Confirm**
6. Wait 30 seconds, then restart the backend: `node server.js`

---

## Other Common Causes

### Cluster is paused (free tier)
Free MongoDB Atlas clusters pause automatically after 60 days of inactivity.
- Go to https://cloud.mongodb.com
- Click **Resume** next to your cluster
- Wait 1-2 minutes for it to start, then retry

### Wrong password in .env
Open `backend/.env` and check `MONGO_URI`:
```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/bloodbank?retryWrites=true&w=majority
```
Make sure USERNAME and PASSWORD match your Atlas credentials.
If your password contains special characters (@, #, !, etc.), they must be URL-encoded.

### No internet connection
MongoDB Atlas is cloud-hosted. You need an active internet connection to run this project.

---

## After Fixing MongoDB

Restart the backend server:
```
cd backend
node server.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```
