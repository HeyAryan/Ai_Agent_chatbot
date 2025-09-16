const { Agent } = require('../models');

async function listAssistants(req, res, next) {
	try {
		const { category, tag } = req.query;
		const filter = {};
		if (category) filter.category = category;
		if (tag) filter.tags = tag;
		const assistants = await Agent.find(filter).sort({ createdAt: -1 }).lean().exec();
		return res.json({ success: true, data: assistants });
	} catch (err) { return next(err); }
}

async function getAssistant(req, res, next) {
	try {
		const item = await Agent.findById(req.params.id).lean().exec();
		if (!item) return res.status(404).json({ message: 'Not found' });
		return res.json({ success: true, data: item });
	} catch (err) { return next(err); }
}

async function createAssistant(req, res, next) {
	try {
		const created = await Agent.create(req.body);
		return res.status(201).json({ success: true, data: created });
	} catch (err) { return next(err); }
}

async function updateAssistant(req, res, next) {
	try {
		const updated = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean().exec();
		if (!updated) return res.status(404).json({ message: 'Not found' });
		return res.json({ success: true, data: updated });
	} catch (err) { return next(err); }
}

async function deleteAssistant(req, res, next) {
	try {
		const deleted = await Agent.findByIdAndDelete(req.params.id).lean().exec();
		if (!deleted) return res.status(404).json({ message: 'Not found' });
		return res.status(204).send();
	} catch (err) { return next(err); }
}

module.exports = { listAssistants, getAssistant, createAssistant, updateAssistant, deleteAssistant };


