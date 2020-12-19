const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

export default async function handler(req, res) {
	return new Promise(resolve => {
		if (authenticate(req, res)) {
			const {league_name, teams} = req.query;
			if (!league_name) {
				res.status(500).json({
					comment: `League name required. Not provided.`
				});
				resolve();
			}
			else if (!teams) {
				res.status(500).json({
					comment: `List of teams required. Not provided.`
				});
				resolve();
			} else {
				manager.createLeague(league_name, teams.split(";")).then( 
					() => {
						res.status(200).json({
							comment: `League ${league_name} successfully created.`
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