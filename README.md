# GigFlow Backend

Reliable Node.js/Express API handling business logic, transactions, and real-time events.

## 🚀 Setup

1.  **Install**: `npm install`
2.  **Configure**: Create `.env` using keys from `.env.example`.
3.  **Run**: `npm run dev`

## � Advanced Backend Features

### 1. ACID Transactions (Hire Flow)
We implemented **MongoDB Multi-Document Transactions** in `bidController.js`.
*   **Why?** hiring involves multiple dependent writes (Update Gig, Update Bid, Reject Others, Create Notification).
*   **How?** Using `mongoose.startSession()` and `session.withTransaction()`. If any op fails, **ALL** ops roll back.

### 2. Real-Time Engine (Socket.io)
We use a **Room-based architecture** in `server.js`.
*   Users join a private room: `socket.join(userId)`.
*   Servers emit events only to specific rooms: `io.to(freelancerId).emit('hire_notification')`.

### 3. Aggregation Pipelines
We use `Gig.aggregate([...])` in `gigController.js`.
*   Effectively joins Collections to return calculated fields (like `bidsCount`) in a single DB round-trip.

### 4. Chat & Messaging Architecture 📨
*   **Dual-Layer Notifications**:
    *   **Socket Events**: `receive_message` and `messages_read` for real-time UI updates.
    *   **API Fallback**: `GET /api/messages` calculates unread counts for initial state.
*   **Read Status Logic**:
    *   `PUT /api/messages/read/:senderId`: updates message status in bulk and triggers a socket event to the sender.
*   **Context Matching**:
    *   `GET /api/gigs/matches/:userId`: Aggregation to find common gigs between two users (e.g., Freelancer hired on Client's gig).

## 📡 API Endpoints
*   `POST /api/auth/*`: Register, Login, Logout (Cookie-based).
*   `GET /api/gigs/*`: Search, post, and manage gigs.
*   `POST /api/bids/*`: Place bids and hire freelancers (Transactional).
