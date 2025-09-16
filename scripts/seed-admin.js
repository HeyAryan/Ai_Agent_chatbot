const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('../src/config');
const { connectToDatabase, disconnectFromDatabase } = require('../src/db/mongoose');
const { User } = require('../src/models');

async function run() {
	await connectToDatabase();
	let user = await User.findOne({ email: 'admin@example.com' }).exec();
	if (!user) {
		user = await User.create({ email: 'admin@example.com', name: 'Admin', role: 'admin', termsAccepted: true });
	}
	const payload = { userId: user._id.toString(), email: user.email, role: user.role };
	const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
	const out = { token, user: { id: user._id.toString(), email: user.email, role: user.role } };
	fs.writeFileSync('seed-output.json', JSON.stringify(out));
	console.log(JSON.stringify(out));
	await disconnectFromDatabase();
}

run().catch(async (e) => { console.error(e); try { await disconnectFromDatabase(); } catch {} process.exit(1); });


