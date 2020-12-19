const authManager = require('./data/authManager.js');

module.exports = {
	authenticate: (req, res) => {
		var token = req.headers['authentication'];

		if (token == null) {
			res.status(401).json({
				comment: "Authentication token missing"
			});
			return false;
		}

		if (!authManager.verifyToken(token)) {
			res.status(401).json({
				comment: "Authentication token not (or no longer) valid."
			});
			return false;
		}

		return true;
	}
}