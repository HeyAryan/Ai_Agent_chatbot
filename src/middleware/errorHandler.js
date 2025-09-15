/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
	const statusCode = err.status || err.statusCode || 500;
	const message = err.message || 'Internal Server Error';
	const response = {
		error: {
			message,
		}
	};

	if (process.env.NODE_ENV !== 'production') {
		response.error.stack = err.stack;
	}

	res.status(statusCode).json(response);
}

module.exports = errorHandler;


