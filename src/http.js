var Encrypt = require('./crypto.js');
var http = require('http');
const userAgents = require('./userAgent');
var cookie = null;
var user = {};
var jsessionid = randomString('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ\\/+', 176) + ':' + (new Date).getTime();
var nuid = randomString('0123456789abcdefghijklmnopqrstuvwxyz', 32);

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
			'User-Agent': userAgent
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
				
				if (callback) {
					callback(rsp)
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

module.exports = {
	WebAPI: WebAPI,
	getClientIp:getClientIp
}