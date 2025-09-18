const { Plan, User } = require('../models');

async function getPricing(req, res, next) {
	try {
		const plans = await Plan.find({}).sort({ amount: 1 }).lean().exec();
		return res.json({ success: true, data: plans });
	} catch (err) { return next(err); }
}

async function subscribe(req, res, next) {
	try {
		const { plan } = req.body;
		await User.findByIdAndUpdate(req.user.id, { membershipPlan: plan }).exec();
		return res.json({ success: true, message: 'Subscribed' });
	} catch (err) { return next(err); }
}

async function cancel(req, res, next) {
	try {
		await User.findByIdAndUpdate(req.user.id, { membershipPlan: null }).exec();
		return res.json({ success: true, message: 'Cancelled' });
	} catch (err) { return next(err); }
}

async function status(req, res, next) {
	try {
		const user = await User.findById(req.user.id).lean().exec();
		return res.json({ success: true, data: { plan: user.membershipPlan || 'free' } });
	} catch (err) { return next(err); }
}

module.exports = { getPricing, subscribe, cancel, status };


