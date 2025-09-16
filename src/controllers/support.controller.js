const { SupportTicket } = require('../models');

async function createTicket(req, res, next) {
	try {
		const { subject, description } = req.body;
		const created = await SupportTicket.create({ userId: req.user.id, subject, description });
		return res.status(201).json({ success: true, data: created });
	} catch (err) { return next(err); }
}

async function getTicket(req, res, next) {
	try {
		const item = await SupportTicket.findOne({ _id: req.params.id, userId: req.user.id }).lean().exec();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json({ success: true, data: item });
	} catch (err) { return next(err); }
}

module.exports = { createTicket, getTicket };


