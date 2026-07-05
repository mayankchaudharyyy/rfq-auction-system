const app = require('./src/app');
const connectDB = require('./src/config/db');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io available in controllers via app
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_rfq_room', (rfq_id) => {
        socket.join(`rfq:${rfq_id}`);
        console.log(`Socket ${socket.id} joined room rfq:${rfq_id}`);
    });

    socket.on('leave_rfq_room', (rfq_id) => {
        socket.leave(`rfq:${rfq_id}`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

async function startServer() {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
