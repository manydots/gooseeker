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
		if (!options.data.csrf_token || options.data.csrf_token == '') {
			options.data.csrf_token = '';
		}

	} else {
		options.data = {};
		options.data.csrf_token = '';
	}
	let cryptoreq = Encrypt(options.data);
	let method = options.method ? options.method : "POST";

	if (!authApi(options, method)) {
		response.send({
			code: -101,
			msg: `${method} fetch error.`
		})
		return;
	}

	//不使用
	//return new Promise((resolve, reject) => {}}
	var httpClients = http.request({
		hostname: 'music.163.com',
		method: method,
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
				code: -102,
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
				};
				if (res.headers['set-cookie']) {
					//cookie = baseCookie + ';' + res.headers['set-cookie'];
					var _csrf = getKeys('__csrf', res.headers['set-cookie']);
					if (_csrf) {
						response.cookie('__csrf', _csrf.keys, {
							httpOnly: true
						})
					}
				}

				//response.cookie('__csrf=', 'stone')
				var count = {
					apiType: 'count_apiType',
					apiName: `count_apiType_${options.apiType}`,
					total: 1
				};

				if (response.redisClient) {
					redis.hgetAll('count_apiType', function(res, totals) {
						//console.log(res,totals);
						if (res) {
							var beforeCount = parseInt(res[count.apiName]) || 0;
							//console.log(beforeCount);
							count.total = beforeCount + 1;
							if (response.ioServer) {
								console.log('---socket.io数据news推送中---');
								response.ioServer.sockets.emit('news', {
									totals: totals + 1,
									newsType: "server-prop-for",
									dataType: 'number'
								});
							}
							redis.hmSet(count);
						} else {
							if (response.ioServer) {
								console.log('---socket.io数据news推送中---');
								response.ioServer.sockets.emit('news', {
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
					response.send(rsp);
				}

			})
		}
	})
	httpClients.write('params=' + cryptoreq.params + '&encSecKey=' + cryptoreq.encSecKey);
	httpClients.end();
};

function socketHttp(io, options, callback, errors) {
	let cookie = baseCookie;
	let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
	let rsp = '';
	let method = options.method ? options.method : "POST";
	if (options.data) {
		options.data.csrf_token = '';
	} else {
		options.data = {};
		options.data.csrf_token = '';
	}
	let cryptoreq = Encrypt(options.data);
	//console.log(method)
	if (!authApi(options, method)) {
		if (errors) {
			errors({
				code: -101,
				msg: `${method} fetch error.`
			})
		}
		return;
	}
	var httpClients = http.request({
		hostname: 'music.163.com',
		method: method,
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
		}
	}, function(req, res) {
		req.on('error', function(err) {
			if (errors) {
				errors({
					code: -102,
					msg: 'fetch error'
				})
			}
			return;
		});
		req.setEncoding('utf8');
		if (req.statusCode != 200) {

		} else {
			req.on('data', function(chunk) {
				rsp += chunk;
			});

			//console.log(rsp)
			req.on('end', function() {
				if (!rsp || rsp == '' || rsp == null) {
					socketHttp(io, options, callback, errors);
					return;
				} else {
					callback(stringToObject(rsp));
				}

				var count = {
					apiType: 'count_apiType',
					apiName: `count_apiType_${options.apiType}`,
					total: 1
				};

				//console.log(options.redisClient);
				if (io && io.redisClient) {
					redis.hgetAll('count_apiType', function(res, totals) {
						//console.log(res,totals);
						if (res) {
							var beforeCount = parseInt(res[count.apiName]) || 0;
							//console.log(beforeCount);
							count.total = beforeCount + 1;
							console.log('---socketHttp数据news推送中---');
							io.sockets.emit('news', {
								totals: totals + 1,
								newsType: "server-prop-for",
								dataType: 'number'
							});
							redis.hmSet(count);
						} else {
							console.log('---socketHttp数据news推送中---');
							io.sockets.emit('news', {
								totals: totals,
								newsType: "server-prop-for",
								dataType: 'number'
							});
							redis.hmSet(count);
						}

					}, true)
				}


			})


		}

	})

	httpClients.write('params=' + cryptoreq.params + '&encSecKey=' + cryptoreq.encSecKey);
	httpClients.end();

}

function stringToObject(data) {
	var results = null;
	if (data && data != '' && data != '""') {
		results = data;
	} else {
		return;
	}
	while (typeof results === 'string') {
		if (results.indexOf('{') > -1 && results.lastIndexOf('}') > -1) {
			results = JSON.parse(results);
		} else {
			break;
		}
	};
	return results;
}

function authApi(options, method) {
	let isReq = false;
	var apiList = [{
		api: '/weapi/cloudsearch/get/web',
		apiType: '1',
		desc: '搜索歌曲名',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/song/enhance/player/url',
		apiType: '2',
		desc: '单曲播放地址',
		methodOnly: 'post,POST'
	}, {
		api: '/api/song/lyric',
		apiType: '3',
		desc: '歌词',
		methodOnly: 'get,GET'
	}, {
		api: '/weapi/v3/song/detail',
		apiType: '4',
		desc: '单曲详情',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/v1/album/',
		apiType: '5',
		desc: '专辑详情',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/playlist/catalogue',
		apiType: '6',
		desc: '歌单类型列表',
		methodOnly: 'post,POST'
	}, {
		api: '/api/playlist/hottags',
		apiType: '7',
		desc: '歌单类型列表-热门类型',
		methodOnly: 'post,POST'
	}, {
		api: '/api/personalized/newsong',
		apiType: '8',
		desc: '推荐新音乐',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/search/hot',
		apiType: '9',
		desc: '搜索hot',
		methodOnly: 'post,POST'
	}, {
		api: '/api/personalized/playlist',
		apiType: '10',
		desc: '推荐歌单',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/login/cellphone',
		apiType: '11',
		desc: '手机登录',
		methodOnly: 'post,POST'
	}, {
		api: '/weapi/login/token/refresh',
		apiType: '12',
		desc: '登录信息刷新',
		methodOnly: 'post,POST'
	}, {
		api: '/user/detail',
		apiType: '13',
		desc: '用户详情',
		methodOnly: 'post,POST'
	}, {
		api: '/user/playlist',
		apiType: '14',
		desc: '用户歌单',
		methodOnly: 'post,POST'
	}, {
		api: '/playlist/detail',
		apiType: '15',
		desc: '歌单详情',
		methodOnly: 'post,POST'
	}];

	for (let item of apiList) {
		if (item.apiType === options.apiType) {
			if (item.methodOnly.indexOf(method) > -1) {
				isReq = true;
			}
			break;
		}
	}

	//console.log(isReq)
	return isReq;
}

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


function getKeys(keys, str) {
	if (typeof str === 'object' && keys != '') {
		for (let item in str) {
			if (str[item].indexOf(keys) > -1) {
				return {
					keys: getCookieItem(keys, str[item]),
					Expires: getCookieItem('Expires', str[item]),
					values: str[item]
				};
				break;
			}
		}
	}
}

function getCookieItem(name, str) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regex = new RegExp("[\\;]?" + name + "=([^;]*)"),
		results = regex.exec(str);
	return results == null ? "" : decodeURIComponent(results[1]);
}

function initServer(io, callback) {
	if (io) {
		io.on('connection', function(socket) {
			socket.on('message', function(data) {
				//console.log(`[${formatDate()}]---index ${data.message}---`)
			});

			//给除了自己以外的客户端广播消息
			socket.broadcast.emit('news', {
				message: 'new connection',
				newsType: 'server-prop-broadcast',
				dataType: 'string'
			});

			//给所有客户端广播消息
			//io.sockets.emit("msg",{data:"hello,all"});

			socket.on('disconnect', function() {
				console.log(`[${formatDate()}]---Someone Left.---`)
			});

			socket.on('https-music-api', function(data) {
				//x-real-ip x-forwarded-for 通过nginx后的真实ip
				//console.log(socket.handshake.headers)
				//仅[127.0.0.1:3000,music.jeeas.cn]可使用socketHttp方式调用
				if (socket.handshake.headers.host == '127.0.0.1:3000' || socket.handshake.headers.host == '127.0.0.1:3033' || socket.handshake.headers.host == 'music.jeeas.cn') {
					//console.log(data.options)
					socketHttp(io, data.options, function(res) {
						//socket.emit给当前连接发送消息
						//console.log(res)
						if (data.isNeedPage) {
							var pageSize = data.options.data.limit;
							var totals = res.result.songCount;
							res.page = {
								pageCount: Math.ceil(totals / pageSize),
								pageIndex: data.options.data.pageIndex,
								totals: totals,
								keywords: data.options.data.s
							}
						}
						socket.emit('songs', res);
					}, function(err) {
						res.page = null;
						socket.emit('songs', err);
					})
				} else {
					socket.emit('songs', {
						code: -103,
						msg: 'ip-limit.'
					});
				}

			});

			if (callback) {
				callback(socket)
			}
		});
	}

}

function randomSongs() {
	var songs = ['林中鸟'];
	return songs[parseInt(Math.random() * songs.length)]
}

module.exports = {
	WebAPI: WebAPI,
	getClientIp: getClientIp,
	formatDate: formatDate,
	initServer: initServer,
	randomSongs: randomSongs
}