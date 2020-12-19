const {authenticate} = require('../../../../util/authenticate.js');
var manager = require('../../../../util/data/leagueContentManager.js');

export default async function handler(req, res) {
	return new Promise (resolve => {
		if (authenticate(req, res)) {
			const {league_name} = req.query;

			if (!league_name) {
				res.status(500).json({
					comment: `League name required. Not provided.`
				});
				resolve();
			} else {
				manager.deleteLeague(league_name).then( 
					() => {
						res.status(200).json({
							comment: `League ${league_name} successfully deleted.`
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