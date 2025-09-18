const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const { User } = require('../models');

const googleClient = new OAuth2Client(config.google.clientId);

async function verifyGoogleIdToken(idToken) {
	if (!config.google.clientId) {
		throw new Error('GOOGLE_CLIENT_ID is not configured');
	}
	const ticket = await googleClient.verifyIdToken({
		idToken,
		audience: config.google.clientId
	});
	return ticket.getPayload();
}

async function findOrCreateUserFromGoogle(payload) {
	const email = payload.email;
	const name = payload.name || payload.given_name || '';
	const picture = payload.picture || '';
	if (!email) {
		throw new Error('Google payload missing email');
	}
	let user = await User.findOne({ email }).exec();
	if (!user) {
		user = await User.create({
			email,
			name,
			profileImage: picture,
			termsAccepted: true
		});
	}
	return user;
}

function issueJwt(user) {
	const payload = {
		userId: user._id.toString(),
		email: user.email,
		role: user.role || 'user'
	};
	const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
	return token;
}

async function googleSignIn(idToken) {
	const googlePayload = await verifyGoogleIdToken(idToken);
	const user = await findOrCreateUserFromGoogle(googlePayload);
	const token = issueJwt(user);
	return { token, user };
}

module.exports = {
	googleSignIn
};


