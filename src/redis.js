var redis = require('redis');
var client = null;

function initRedis(callback) {
	if (!client) {
		client = redis.createClient(6379, '127.0.0.1');
	}
	client.on('connect', function() {
		console.log('redis connect success!');
		if (callback) {
			callback(client);
		}

	});

	client.on('error', function() {
		console.log('redis connect error!');
	});

};

function hmSet(options, callback) {
	if (!client) {
		initRedis()
	}
	if (client) {
		client.hmset(options.apiType, options.apiName, options.total);
		if (callback) {
			callback();
		};
	}
}

function hgetAll(keys, callback, isTotal) {
	if (!client) {
		initRedis()
	}

	if (client) {
		client.hgetall(keys, function(err, obj) {
			if (err) {
				throw err
			};
			if (callback) {
				if (isTotal) {
					callback(obj, getApiNumber(obj));
				} else {
					callback(obj);
				}
			}
		});
	}

}
var apiLength = 10;

function getApiNumber(res) {
	var totals = 0;
	if (res) {
		//console.log(res);
		for (var i = 1; i < (apiLength + 1); i++) {
			if (res[`count_apiType_${i}`]) {
				var nCount = parseInt(res[`count_apiType_${i}`]) || 0;
				totals += nCount;
			}
		}

	};
	return totals;
}


//console.log(client)
// addRedis('ip', '127.0.0.1')
// readRedis('ip', function(res) {
// 	console.log(res)
// })

module.exports = {
	hmSet: hmSet,
	hgetAll: hgetAll,
	initRedis: initRedis
};