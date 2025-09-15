const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const app = require('./app');
const { connectToDatabase, disconnectFromDatabase } = require('./db/mongoose');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function start() {
	try {
		await connectToDatabase();
		server.listen(PORT, () => {
			console.log(`[server] listening on port ${PORT}`);
		});
	} catch (err) {
		console.error('[server] failed to start:', err);
		process.exit(1);
	}
}

// graceful shutdown
async function shutdown(signal) {
	console.log(`[server] received ${signal}. shutting down...`);
	server.close(async () => {
		try {
			await disconnectFromDatabase();
			console.log('[server] db disconnected');
			process.exit(0);
		} catch (err) {
			console.error('[server] error during shutdown', err);
			process.exit(1);
		}
	});
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

module.exports = server;


