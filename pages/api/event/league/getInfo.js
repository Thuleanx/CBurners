var manager = require('../../../../util/data/leagueContentManager.js');

// start a leaguge, with the informations given
export default async function handler(req, res) {
	return new Promise (resolve => {
		const {league_name} = req.query;
		if (league_name) {
			manager.getLeagueInfo(league_name).then((league) => {
				if (league==null) {
					res.status(404).json({
						comment: `League ${league_name} not found.`
					});
					resolve();
				} else {
					res.status(200).json(league);
					resolve();
				}
			}, err => {
				res.status(500).json({
					comment: err
				});
				resolve();
			});
		} else {
			res.status(500).json({
				comment: `League name required. Not provided.`
			});
			resolve();
		}
	});
}