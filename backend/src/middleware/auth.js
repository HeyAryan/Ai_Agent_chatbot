const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

async function auth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) return res.status(401).json({ message: 'Unauthorized' });
		const payload = jwt.verify(token, config.jwt.secret);
		const user = await User.findById(payload.userId).lean().exec();
		if (!user) return res.status(401).json({ message: 'Invalid token user' });
		req.user = { id: user._id.toString(), email: user.email, role: user.role };
		return next();
	} catch (err) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}

function requireAdmin(req, res, next) {
	if (req.user && req.user.role === 'admin') return next();
	return res.status(403).json({ message: 'Forbidden' });
}

module.exports = { auth, requireAdmin };


