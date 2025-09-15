const mongoose = require('mongoose');
const config = require('../config');

let isConnected = false;

function getConnectionState() {
	const state = mongoose.connection.readyState;
	// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
	return state;
}

async function connectToDatabase() {
	if (!config.mongo.uri) {
		throw new Error('MONGO_URI is not set');
	}

	if (isConnected) return mongoose.connection;

	mongoose.set('strictQuery', true);
	await mongoose.connect(config.mongo.uri, {
		maxPoolSize: config.mongo.maxPoolSize
	});
	isConnected = true;
	return mongoose.connection;
}

async function disconnectFromDatabase() {
	if (!isConnected) return;
	await mongoose.disconnect();
	isConnected = false;
}

module.exports = {
	connectToDatabase,
	disconnectFromDatabase,
	getConnectionState
};


