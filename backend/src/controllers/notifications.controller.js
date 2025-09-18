const { Notification } = require('../models');

async function listNotifications(req, res, next) {
	try {
		const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean().exec();
		return res.json({ success: true, data: items });
	} catch (err) { return next(err); }
}

async function markRead(req, res, next) {
	try {
		const { read } = req.body;
		const updated = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { read: !!read }, { new: true }).lean().exec();
		if (!updated) return res.status(404).json({ message: 'Not found' });
		return res.json({ success: true, data: updated });
	} catch (err) { return next(err); }
}

async function deleteNotification(req, res, next) {
	try {
		await Notification.deleteOne({ _id: req.params.id, userId: req.user.id }).exec();
		return res.status(204).send();
	} catch (err) { return next(err); }
}

module.exports = { listNotifications, markRead, deleteNotification };


