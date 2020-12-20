const path = require('path');
const fs = require('fs');

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

export default function handler(req, res) {
	if (!req.query.path) {
		res.status(500).json({
			comment: `Filepath required. Not provided.`
		});
	} else {
		const filepath = req.query.path.startsWith("/") ? req.query.path : `/${req.query.path}`;
		const dir = path.resolve(`public${filepath}`);

		if (fs.existsSync(dir)) {
			var imgStream = fs.createReadStream(dir);
			var type = mime[path.extname(dir).slice(1)] || 'text/plain';
			res.writeHead(200, {
				'Content-Type': type
			});
			imgStream.pipe(res);
		} else {
			res.status(404).json({
				comment: `File not found`
			});
		}
	}
}