const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		if (authenticate(req, res)) {
			const {league_name} = req.query;
			if (league_name) {
				manager.endLeague(league_name).then(() => {
					res.status(200).json({
						comment: `League ${league_name} successfully ended.`
					});
					resolve();
				}, err => {
					res.status(500).json({
						comment: err
					});
					resolve();
				});
			} else {
				res.status(500).json({
					comment: "League name required. Not provided."
				});
				resolve();
			}
		} else resolve();
	});
}