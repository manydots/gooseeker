var express = require('express');
var app = express();
var path = require('path');
var cache = require('apicache').middleware;
var router = require('./routes/index');
var serverName = process.env.NAME || 'Unknown';
var port = process.env.port || 3000;
var url = `http://127.0.0.1:${port}`;
var rateLimit = require("express-rate-limit");

//static
app.use('/static', express.static(path.join(__dirname, 'public')));

//api访问限制20s内60次
const limiter = rateLimit({
	windowMs: 20 * 1000, // 60 s
	max: 60, //limit each IP to {max} requests per windowMs
	handler: function(req, res) {
		console.log(`访问频繁ip:[${req.ip}]`);
		res.status(429).end('Too many requests, please try again later.');
	}
});
app.use(limiter);

//cache 缓存2分钟  2 minutes  0.05 minutes=3s
app.use(cache('0.05 minutes', ((req, res) => res.statusCode === 200)));

//设置跨域访问
app.all('*', (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", '3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

//使用ejs
app.set('views', path.join(__dirname, './views'));
app.set("view engine", "ejs");

//使用路由
app.use(router);

app.listen(port, () => {
	console.log('Server listening at port %d', port);
	console.log('Visit http://127.0.0.1:%d', port);
	console.log('Hello, I\'m %s, how can I help?', serverName);
});