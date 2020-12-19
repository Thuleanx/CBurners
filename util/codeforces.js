const axios = require('axios');

const codeforcesPath = 'https://codeforces.com/api';

async function getUserInfoMultiple(handles) {
	var requestStr = `/user.info?handles=`;
	handles.forEach(handle => {
		requestStr += handle + ';';
	});
	var res = await axios.get(codeforcesPath + requestStr);
	if (res.data.status == "OK") {
		return res.data.result;
	} else return res.data.comment;
}

module.exports = {
	getUserStatus: async (handle) => {
		var res = await axios.get(codeforcesPath + `/user.status?handle=${handle}`);
		if (res.data.status == "OK") return res.data.result;
		else						return res.data.comment;
	},
	getUserInfoMultiple: getUserInfoMultiple,
	getUserInfo: async (handle) => {
		var res = await getUserInfoMultiple([handle]);
		if (Array.isArray(res))
			return res[0];
		else return res;
	}
};