const client = require('../mongodb.js');
const jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');

var passwordHashOptions = {
	saltLength: 8,
	iterations: 1
}

const databaseName = 'auth';
const collectionName = 'admin';

module.exports = {
	generatePasswordHash: (password) => {
		return passwordHash.generate(password, passwordHashOptions);
	},
	verifyUser: async (username, password) => {
		const database = await client.getDatabase(databaseName);
		const collection = client.getCollection(database, collectionName);

		const user = await client.findEntry(collection, {username: username});

		if (user == null) throw `User ${username} does not exist`;

		return passwordHash.verify(password, user.hashedPassword);
	},
	generateToken: (payload) => {
		return jwt.sign(payload, process.env.SECRET, { expiresIn: 60*60*24 });
	},
	verifyToken: (token) => {
		return jwt.verify(token, process.env.SECRET);
	}
}