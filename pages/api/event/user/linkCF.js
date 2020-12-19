const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

export default function handler(req, res) {
	return new  Promise(resolve => {
		if (authenticate(req, res)) {
			const {username, handle} = req.query;

			if (!username) {
				res.status(500).json({
					comment: `Username required. Not provided.`
				});
				resolve();
			} else if (!handle) {
				res.status(500).json({
					comment: `Codeforces handle required. Not provided.`
				});
				resolve();
			} else {
				manager.linkCodeforces(username, handle).then(
					() => {
						res.status(200).json({
							comment: `User ${username} successfully linked to the codeforces handle ${handle}`
						});
						resolve();
					}, err => {
						res.status(500).json({
							comment: err
						});
						resolve();
					}
				);
			}
		} else resolve();

	});
}