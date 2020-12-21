const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		if (authenticate(req, res)) {
			const {league_name, username} = req.query;

			if (!league_name) {
				res.status(500).json({
					comment: `League name required. Not provided.`
				});
				resolve();
			} else if (!username) {
				res.status(500).json({
					comment: ` required. Not provided.`
				});
				resolve();
			} else {
				manager.updateUserPerformance(league_name, username).then((_) => {
					res.status(200).json({
						comment: `${username}'s performance in ${league_name} updated`
					});
					resolve();
				}, err => {
					res.status(500).json({
						comment: err
					});
					resolve();
				});
			}
		} else resolve();
	});
}