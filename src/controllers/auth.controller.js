const createError = require('http-errors');
const { googleSignIn } = require('../services/auth.service');

async function postGoogleSignIn(req, res, next) {
	try {
		const idToken = req.body.idToken || req.body.token;
		if (!idToken) {
			throw createError(400, 'idToken is required');
		}
		const { token, user } = await googleSignIn(idToken);
		return res.status(200).json({
			success: true,
			token,
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
				role: user.role,
				profileImage: user.profileImage
			}
		});
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	postGoogleSignIn
};


