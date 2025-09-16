const { User } = require('../models');

async function getMe(req, res, next) {
	try {
		const user = await User.findById(req.user.id).lean().exec();
		return res.json({ success: true, data: user });
	} catch (err) { return next(err); }
}

async function updateMe(req, res, next) {
	try {
		const updates = (({ name, profileImage, bio }) => ({ name, profileImage, bio }))(req.body);
		const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean().exec();
		return res.json({ success: true, data: user });
	} catch (err) { return next(err); }
}

async function updateSettings(req, res, next) {
	try {
		const { settings } = req.body;
		const user = await User.findByIdAndUpdate(req.user.id, { settings }, { new: true }).lean().exec();
		return res.json({ success: true, data: user });
	} catch (err) { return next(err); }
}

async function deleteMe(req, res, next) {
	try {
		await User.findByIdAndDelete(req.user.id).exec();
		return res.status(204).send();
	} catch (err) { return next(err); }
}

module.exports = { getMe, updateMe, updateSettings, deleteMe };


