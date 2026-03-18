const app = require('./src/app');
const db = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test DB connection
        await db.query('SELECT 1');
        console.log('MySQL connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to MySQL:', error.message);
        process.exit(1);
    }
}

startServer();