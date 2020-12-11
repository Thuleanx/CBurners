var assert = require('assert');
const { type } = require('os');
var codeforces = require('../dependencies/codeforces.js');

describe('Codeforces Interactions', function() {
	describe('User specific commands', function() {
		const userHandle = 'peterr';

		it('getUserInfo', function(done) {
			codeforces.getUserInfo(userHandle).then((res) => {
				if (typeof res === 'string')
					done(res);
				else if ( typeof res === 'undefined')
					done("Response is undefined");
				else done();
			}, done);
		});

		it('getUserStatus', function(done) {
			codeforces.getUserStatus(userHandle).then((res) => {
				if (typeof res === 'string')
					done(res);
				else if ( typeof res === 'undefined')
					done("Response is undefined");
				else done();
			}, done);
		}).timeout(5000);

		it('getUserInfoMultiple', function(done) {
			codeforces.getUserInfoMultiple([userHandle]).then((res) => {
				if (typeof res === 'string')
					done(res);
				else if ( typeof res === 'undefined')
					done("Response is undefined");
				else done();
			}, done);
		});
	});
});