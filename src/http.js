var Encrypt = require('./crypto.js');
var http = require('http');
var userAgents = require('./userAgent');
var cookie = null;
var user = {};
var jsessionid = randomString('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ\\/+', 176) + ':' + (new Date).getTime();
var nuid = randomString('0123456789abcdefghijklmnopqrstuvwxyz', 32);
var redis = require('./redis');

function randomString(pattern, length) {
	return Array.apply(null, {
		length: length
	}).map(() => (pattern[Math.floor(Math.random() * pattern.length)])).join('');
}

var baseCookie = `JSESSIONID-WYYY=${jsessionid}; _iuqxldmzr_=32; _ntes_nnid=${nuid},${(new Date).getTime()}; _ntes_nuid=${nuid}`;

function WebAPI(options, callback) {

	let cookie = options.request.get('Cookie') ? options.request.get('Cookie') : (options.request.query.cookie ? options.request.query.cookie : '');
	let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
	let response = options.response;
	let rsp = '';
	let ip = getClientIp(options.request, 'nginx');

	if (options.data) {
		options.data.csrf_token = '';
	} else {
		options.data = {};
		options.data.csrf_token = '';
	}
	let cryptoreq = Encrypt(options.data);

	//不使用
	//return new Promise((resolve, reject) => {}}
	var httpClients = http.request({
		hostname: 'music.163.com',
		method: options.method ? options.method : "POST",
		path: options.path,
		headers: {
			'Accept': '*/*',
			'Accept-Language': 'zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4',
			'Connection': 'keep-alive',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Referer': 'http://music.163.com',
			'Host': 'music.163.com',
			'Cookie': cookie,
			'User-Agent': userAgent,
			'X-Forwarded-For': ip,
			'Proxy-Client-IP': ip
		}
	}, function(res) {
		//console.log(res.statusCode)
		res.on('error', function(err) {
			response.send({
				code: 200,
				msg: 'fetch error'
			});
			return;
		});
		res.setEncoding('utf8');
		if (res.statusCode != 200) {


		} else {
			res.on('data', function(chunk) {
				rsp += chunk;
			});
			//console.log(rsp)
			res.on('end', function() {
				if (!rsp || rsp == '' || rsp == null) {
					WebAPI(options, callback);
					return;
				}
				var count = {
					apiType: 'count_apiType',
					apiName: `count_apiType_${options.apiType}`,
					total: 1
				}

				if (response.redisClient) {
					redis.hgetAll('count_apiType', function(res, totals) {
						//console.log(res,totals);
						if (res) {
							var beforeCount = parseInt(res[count.apiName]) || 0;
							//console.log(beforeCount);
							count.total = beforeCount + 1;
							if (response.ioServer) {
								console.log('---socket.io数据news推送中---');
								response.ioServer.emit('news', {
									totals: totals + 1,
									newsType: "server-prop-for",
									dataType: 'number'
								});
							}
							redis.hmSet(count);
						} else {
							if (response.ioServer) {
								console.log('---socket.io数据news推送中---');
								response.ioServer.emit('news', {
									totals: totals,
									newsType: "server-prop-for",
									dataType: 'number'
								});
							}
							redis.hmSet(count);
						}

					}, true)
				}

				console.log(`时间:[${formatDate()}],访问ip:[${ip}],api:[${decodeURI(options.request.url)}],path:[${options.path}]`)
				if (callback) {
					callback(rsp);
				} else {
					if (res.headers['set-cookie']) {
						cookie = baseCookie + ';' + res.headers['set-cookie'];
						response.send({
							code: 200,
							i: JSON.parse(rsp)
						});
						user = JSON.parse(rsp)
						return;
					}
					response.send(rsp)
				}

			})
		}
	})
	httpClients.write('params=' + cryptoreq.params + '&encSecKey=' + cryptoreq.encSecKey);
	httpClients.end();
};

function getClientIp(req, proxyType) {
	let ip = req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
	// 如果使用了nginx代理

	if (proxyType === 'nginx') {
		// headers上的信息容易被伪造,但是我不care,自有办法过滤,例如'x-nginx-proxy'和'x-real-ip'我在nginx配置里做了一层拦截把他们设置成了'true'和真实ip,所以不用担心被伪造
		// 如果没用代理的话,我直接通过req.connection.remoteAddress获取到的也是真实ip,所以我不care
		ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || ip;
	}
	const ipArr = ip.split(',');
	// 如果使用了nginx代理,如果没配置'x-real-ip'只配置了'x-forwarded-for'为$proxy_add_x_forwarded_for,如果客户端也设置了'x-forwarded-for'进行伪造ip
	// 则req.headers['x-forwarded-for']的格式为ip1,ip2只有最后一个才是真实的ip
	if (proxyType === 'nginx') {
		ip = ipArr[ipArr.length - 1];
	}
	if (ip.indexOf('::ffff:') !== -1) {
		ip = ip.substring(7);
	}

	return ip;
};

function formatDate(date, fmt) {
	if (!date) {
		date = new Date();
	} else {
		date = new Date(date);
	}
	if (fmt === undefined) {
		fmt = 'yyyy-MM-dd hh:mm:ss';
	}
	var o = {
		'M+': date.getMonth() + 1, //月份
		'd+': date.getDate(), //日
		'h+': date.getHours(), //小时
		'm+': date.getMinutes(), //分
		's+': date.getSeconds(), //秒
		'q+': Math.floor((date.getMonth() + 3) / 3), //季度
		'S': date.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
	return fmt;

}

function initServer(io, callback) {
	if (io) {
		io.on('connection', function(socket) {
			socket.on('message', function(data) {
				//console.log(`[${formatDate()}]---index ${data.message}---`)
			});
			//console.log('emit所有人推送,broadcast除某个套接字以外的所有人发送消息，eg:connection不推送');
			//向所有连接推送news消息
			socket.broadcast.emit('news', {
				message: 'new connection',
				newsType: 'server-prop-broadcast',
				dataType: 'string'
			});

			socket.on('disconnect', function() {
				console.log(`[${formatDate()}]---Someone Left.---`)
			});

			if (callback) {
				callback(socket)
			}
		});
	}

}

module.exports = {
	WebAPI: WebAPI,
	getClientIp: getClientIp,
	formatDate: formatDate,
	initServer: initServer
}