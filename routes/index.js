const express = require('express');
const router = express.Router();
const Tools = require('../src/http');
const redis = require('../src/redis');
const crypto = require('crypto');
const version = "/v1";

router.use((req, res, next) => {
	//console.log(`首页访问ip:${Tools.getClientIp(req,'nginx')}`)
	//console.log(res.redisClient)
	next();
});

router.get('/', function(request, response) {
	//解决渲染HTML失败问题,添加服务器返回渲染的type值response.type('html');
	if (response.redisClient) {
		redis.hgetAll('count_apiType', function(res, totals) {
			//console.log(totals);
			response.type('html');
			response.render('index', {
				title: '网易云音乐API-music文档说明',
				totals: totals
			})
		}, true);
	} else {
		response.type('html');
		response.render('index', {
			title: '网易云音乐API-music文档说明',
			totals: 0
		})
	}
});

router.get(version, function(request, response) {
	//解决渲染HTML失败问题,添加服务器返回渲染的type值response.type('html');
	if (response.redisClient) {
		redis.hgetAll('count_apiType', function(res, totals) {
			response.type('html');
			response.render('api', {
				title: 'API调用示例',
				version: version,
				totals: totals
			})

		}, true);
	} else {
		response.type('html');
		response.render('api', {
			title: 'API调用示例',
			version: version,
			totals: 0
		})
	}
});

router.get('/music', function(request, response) {
	//console.log(request.query)
	response.type('html');
	response.render('music', {
		title: '网易云音乐Cloud',
		keywords: Tools.randomSongs()
	})
});

router.get('/web', function(request, response) {
	//console.log(request.query)
	response.type('html');
	response.render('web', {
		title: '网易云音乐Cloud',
		keywords: Tools.randomSongs()
	})
});

//手机登录
router.get(version + '/login/cellphone', function(request, response) {
	if (!request.query.phone || !request.query.password || request.query.phone == '' || request.query.password == '') {
		response.send({
			code: -102,
			msg: '参数异常检查后重试'
		});
		return;
	} else {
		var phone = request.query.phone;
		var data = {
			'phone': phone,
			'password': crypto.createHash('md5').update(request.query.password).digest('hex'),
			'rememberLogin': 'true',
			'countrycode': request.query.countrycode || '',
		};

		Tools.WebAPI({
			path: '/weapi/login/cellphone',
			request: request,
			response: response,
			apiType: '11',
			data: data
		});
	}

});

//登录信息刷新
router.get(version + '/login/refresh', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var csrf = cookie.split('=')[1];
	Tools.WebAPI({
		path: `/weapi/login/token/refresh?csrf_token=${csrf}`,
		request: request,
		response: response,
		apiType: '12'
	});
});

/*
 **
 ** 1、搜索歌曲名
 **	params[s=歌曲名,type,offset,limit]
 **	/search?s=大城小爱
 **
 */
router.get(version + '/search', function(request, response) {
	//type:1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
	//offset : 偏移数量，用于分页 , 如 : 如 :( 页数 -1)*20, 其中20为limit的值,默认为0
	var data = {
		s: decodeURI(request.query.s) || '',
		offset: request.query.offset || 0,
		limit: request.query.limit || 20,
		type: request.query.type || 1
	};
	var params = {
		path: '/weapi/cloudsearch/get/web',
		request: request,
		response: response,
		data: data,
		apiType: '1'
	};
	Tools.WebAPI(params)
});

/*
 **
 ** 2、单曲播放地址
 **	params[id=歌曲id,br=歌曲码率]
 **	/music/url?id=25643093
 **
 */
router.get(version + '/music/url', function(request, response) {
	//br[int]可用值为 64000,128000,198000,320000
	var params = {
		path: '/weapi/song/enhance/player/url',
		data: {
			ids: [parseInt(request.query.id)],
			br: parseInt(request.query.br || 198000),
		},
		request: request,
		response: response,
		apiType: '2'
	};
	Tools.WebAPI(params);
});


/*
 **
 ** 3、歌词
 **	params[id] 
 **	/lyric?id=25643093
 **
 */
router.get(version + '/lyric', function(request, response) {
	var params = {
		path: `/api/song/lyric?os=osx&id=${request.query.id}&lv=-1&kv=-1&tv=-1`,
		request: request,
		response: response,
		method: 'GET',
		apiType: '3'
	};
	Tools.WebAPI(params, function(res) {
		response.setHeader("Content-Type", "application/json");
		response.send(res);
	});
});


/*
 **
 ** 4、单曲详情
 **	params[id] 
 **	/music/detail?id=25643093
 **
 */
router.get(version + '/music/detail', function(request, response) {
	var id = parseInt(request.query.id);
	var data = {
		id: id,
		c: JSON.stringify([{
			id: id
		}]),
		ids: '[' + id + ']',
	};
	var params = {
		path: '/weapi/v3/song/detail',
		request: request,
		response: response,
		data: data,
		apiType: '4'
	};
	Tools.WebAPI(params);
});


/*
 **
 ** 5、专辑详情
 **	params[id] 
 **	/album/detail?id=2263164
 **
 */
router.get(version + '/album/detail', function(request, response) {
	var id = parseInt(request.query.id);
	var params = {
		path: `/weapi/v1/album/${id}`,
		request: request,
		response: response,
		apiType: '5'
	};
	Tools.WebAPI(params);
});



/*
 **
 ** 6、歌单类型列表
 **	params[] 
 **	/playlist/catlist
 **
 */
router.get(version + '/playlist/catlist', function(request, response) {
	Tools.WebAPI({
		path: '/weapi/playlist/catalogue',
		request: request,
		response: response,
		apiType: '6'
	});
})

/*
 **
 ** 7、歌单类型列表-热门类型
 **	params[] 
 **	/playlist/hot
 **
 */
router.get(version + '/playlist/hot', function(request, response) {
	Tools.WebAPI({
		path: '/api/playlist/hottags',
		request: request,
		response: response,
		apiType: '7'
	});
})

/*
 **
 ** 8、推荐新音乐
 **	params[] 
 **	/personalized/newsong
 **
 */
router.get(version + '/personalized/newsong', function(request, response) {
	Tools.WebAPI({
		path: '/api/personalized/newsong',
		request: request,
		response: response,
		apiType: '8',
		data: {
			type: 'recommend'
		}
	});
})


/*
 **
 ** 9、搜索hot
 **	params[] 
 **	/search/hot
 **
 */
router.get(version + '/search/hot', function(request, response) {
	Tools.WebAPI({
		path: '/weapi/search/hot',
		request: request,
		response: response,
		apiType: '9',
		data: {
			type: request.query.type || 1111
		}
	});
});

/*
 **
 ** 10、推荐歌单
 **	params[] 
 **	/personalized
 **
 */
router.get(version + '/personalized', function(request, response) {
	Tools.WebAPI({
		path: '/api/personalized/playlist',
		request: request,
		response: response,
		apiType: '10'
	});
})


/*
 **
 ** 13、用户详情
 **	params[] 
 **	/personalized
 **
 */
router.get(version + '/user/detail', function(request, response) {
	if (!request.query.uid || request.query.uid == '') {
		response.send({
			code: -102,
			msg: '参数异常检查后重试'
		});
		return;
	}
	Tools.WebAPI({
		path: `/api/v1/user/detail/${request.query.uid}`,
		request: request,
		response: response,
		apiType: '13'
	});
})

/*
 **
 ** 14、用户歌单
 **	params[] 
 **	/personalized
 **
 */
router.get(version + '/user/playlist', function(request, response) {
	if (!request.query.uid || request.query.uid == '') {
		response.send({
			code: -102,
			msg: '参数异常检查后重试'
		});
		return;
	}
	Tools.WebAPI({
		path: '/weapi/user/playlist',
		request: request,
		response: response,
		apiType: '14',
		data: {
			"offset": request.query.offset || '0',
			"uid": request.query.uid,
			"limit": request.query.limit || 20,
			"csrf_token": ""
		}
	});
})

/*
 **
 ** 15、歌单详情
 **	params[] 
 **	/personalized
 **
 */
router.get(version + '/playlist/detail', function(request, response) {
	if (!request.query.id || request.query.id == '') {
		response.send({
			code: -102,
			msg: '参数异常检查后重试'
		});
		return;
	}
	Tools.WebAPI({
		path: '/weapi/v3/playlist/detail',
		request: request,
		response: response,
		apiType: '15',
		data: {
			"id": request.query.id,
			"offset": request.query.offset || '0',
			"total": true,
			"n": request.query.n || 20,
			"limit": request.query.limit || 20,
		}
	});
})


/*
 **
 ** 16、退出登录
 **	params[] 
 **	/personalized
 **
 */
router.get(version + '/user/logout', function(request, response) {
	Tools.WebAPI({
		path: '/weapi/logout',
		request: request,
		response: response,
		apiType: '16'
	});
})

module.exports = router;