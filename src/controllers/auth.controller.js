const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { googleSignIn } = require('../services/auth.service');
const { User } = require('../models');
const config = require('../config');

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

async function postLogout(req, res) {
	return res.status(200).json({ success: true });
}

async function getUserDetailsFromSession(req, res, next) {
	const startTime = Date.now();
	const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	
	console.log(`[AUTH] [${requestId}] Starting user session validation`, {
		ip: req.ip || req.connection.remoteAddress,
		userAgent: req.headers['user-agent'],
		timestamp: new Date().toISOString()
	});

	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		
		console.log(`[AUTH] [${requestId}] Token extraction`, {
			hasAuthHeader: !!authHeader,
			hasToken: !!token,
			tokenLength: token ? token.length : 0
		});
		
		if (!token) {
			console.warn(`[AUTH] [${requestId}] No token provided`, {
				authHeader: authHeader ? 'present' : 'missing',
				duration: Date.now() - startTime
			});
			return res.status(401).json({ 
				success: false, 
				message: 'No token provided' 
			});
		}

		try {
			console.log(`[AUTH] [${requestId}] Verifying JWT token`);
			const payload = jwt.verify(token, config.jwt.secret);
			
			console.log(`[AUTH] [${requestId}] Token verified successfully`, {
				userId: payload.userId,
				email: payload.email,
				role: payload.role,
				exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'no expiration'
			});

			console.log(`[AUTH] [${requestId}] Looking up user in database`);
			const user = await User.findById(payload.userId).lean().exec();
			
			if (!user) {
				console.error(`[AUTH] [${requestId}] User not found in database`, {
					userId: payload.userId,
					duration: Date.now() - startTime
				});
				return res.status(401).json({ 
					success: false, 
					message: 'Invalid token - user not found' 
				});
			}

			console.log(`[AUTH] [${requestId}] User found successfully`, {
				userId: user._id,
				email: user.email,
				role: user.role,
				membershipPlan: user.membershipPlan,
				duration: Date.now() - startTime
			});

			const responseData = {
				id: user._id,
				email: user.email,
				name: user.name,
				role: user.role,
				profileImage: user.profileImage,
				membershipPlan: user.membershipPlan,
				bio: user.bio,
				settings: user.settings,
				notificationSettings: user.notificationSettings,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			};

			console.log(`[AUTH] [${requestId}] Returning user details successfully`, {
				userId: user._id,
				email: user.email,
				responseFields: Object.keys(responseData).length,
				duration: Date.now() - startTime
			});

			return res.json({ 
				success: true, 
				data: responseData
			});
		} catch (jwtError) {
			console.error(`[AUTH] [${requestId}] JWT verification failed`, {
				error: jwtError.name,
				message: jwtError.message,
				duration: Date.now() - startTime
			});

			if (jwtError.name === 'TokenExpiredError') {
				console.warn(`[AUTH] [${requestId}] Token expired`, {
					expiredAt: jwtError.expiredAt ? new Date(jwtError.expiredAt).toISOString() : 'unknown',
					duration: Date.now() - startTime
				});
				return res.status(401).json({ 
					success: false, 
					message: 'Token expired' 
				});
			} else if (jwtError.name === 'JsonWebTokenError') {
				console.warn(`[AUTH] [${requestId}] Invalid token format`, {
					message: jwtError.message,
					duration: Date.now() - startTime
				});
				return res.status(401).json({ 
					success: false, 
					message: 'Invalid token' 
				});
			} else {
				console.error(`[AUTH] [${requestId}] Unexpected JWT error`, {
					error: jwtError.name,
					message: jwtError.message,
					stack: jwtError.stack,
					duration: Date.now() - startTime
				});
				throw jwtError;
			}
		}
	} catch (err) { 
		console.error(`[AUTH] [${requestId}] Unexpected error in getUserDetailsFromSession`, {
			error: err.name,
			message: err.message,
			stack: err.stack,
			duration: Date.now() - startTime
		});
		return next(err); 
	}
}

module.exports = {
	postGoogleSignIn,
	postLogout,
	getUserDetailsFromSession
};


