const axios = require('axios');

const codeforcesPath = 'https://codeforces.com/api';

async function getUserInfoMultiple(handles) {

	try {
		var requestStr = `/user.info?handles=`;
		handles.forEach(handle => {
			requestStr += handle + ';';
		});
		var res = await axios.get(codeforcesPath + requestStr, {timeout:10000});
		if (res.data.status == "OK") {
			return res.data.result;
		} else return res.data.comment;
	} catch (err) {
		return err;
	}
}

module.exports = {
	getUserStatus: async (handle) => {
		try {
			var res = await axios.get(codeforcesPath + `/user.status?handle=${handle}`, {timeout:10000});
			if (res.data.status == "OK") return res.data.result;
			else						return res.data.comment;
		} catch (err) {
			return err;
		}
	},
	getUserInfoMultiple: getUserInfoMultiple,
	getUserInfo: async (handle) => {
		var res = await getUserInfoMultiple([handle]);
		if (Array.isArray(res))
			return res[0];
		else return res;
	}
};