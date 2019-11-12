const express = require('express');
const router = express.Router();
const Tools = require('../src/http');
const redis = require('../src/redis');
const version = "/v1";

router.use((req, res, next) => {
	//console.log(`首页访问ip:${Tools.getClientIp(req,'nginx')}`)
	//console.log(res.redisClient)
	//console.log(req.url)
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

/*
 **
 ** 1、搜索歌曲名
 **	params[s=歌曲名,type,offset,limit]
 **	/search?s=大城小爱
 **
 */
router.get(version + '/search', function(request, response) {
	var data = {
		s: decodeURI(request.query.s) || '',
		offset: request.query.offset || '0',
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
 **	params[id=歌曲id,br]
 **	/music/url?id=25643093
 **
 */
router.get(version + '/music/url', function(request, response) {
	var params = {
		path: '/weapi/song/enhance/player/url',
		data: {
			ids: [parseInt(request.query.id)],
			br: parseInt(request.query.br || 999000),
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

//以下没改
//推荐mv
router.get(version + '/personalized/mv', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {};
	Tools.WebAPI('/api/personalized/mv', data, cookie, response)
})

//独家放送
router.get(version + '/personalized/privatecontent', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {};
	Tools.WebAPI('/api/personalized/privatecontent', data, cookie, response)
})


//推荐dj
router.get(version + '/personalized/djprogram', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {};
	Tools.WebAPI('/api/personalized/djprogram', data, cookie, response)
})

//每日推荐歌曲301
router.get(version + '/recommend/songs', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		"total": true,
		"csrf_token": ""
	};
	Tools.WebAPI('/weapi/v1/discovery/recommend/songs', data, cookie, response)
});

//每日推荐歌单301
router.get(version + '/recommend/resource', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		'offset': 0,
		'limit': 20,
		'total': true,
		"csrf_token": ""
	};
	Tools.WebAPI('/weapi/v1/discovery/recommend/resource', data, cookie, response)
});



//搜索multimatch
router.get(version + '/search/multimatch', function(request, response) {
	var keywords = request.query.s || '';
	var type = request.query.type || 1;
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		"csrf_token": "",
		type: type || 1,
		s: keywords || ''
	};
	Tools.WebAPI('/weapi/search/suggest/multimatch', data, cookie, response)
});


//搜索suggest
router.get(version + '/search/suggest', function(request, response) {
	var keywords = request.query.keywords || '';
	var type = request.query.type || 1;
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		"csrf_token": "",
		type: type || 1,
		s: keywords || ''
	};
	Tools.WebAPI('/weapi/search/suggest/web', data, cookie, response)
});


//fm
router.get(version + '/fm', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		"csrf_token": ""
	}
	Tools.WebAPI('/weapi/v1/radio/get', data, cookie, response)
});



//热门歌手 
router.get(version + '/top/artist', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		'offset': request.query.offset,
		'total': false,
		'type': request.query.type,
		'limit': request.query.limit,
		'csrf_token': ''
	}
	Tools.WebAPI('/weapi/artist/top', data, cookie, response);
});

//新歌上架 ,type ALL, ZH,EA,KR,JP
router.get(version + '/top/songs', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		'type': request.query.type,
		'area': request.query.type,
		'cat': request.query.type,
		"csrf_token": ""
	}
	Tools.WebAPI('/weapi/v1/discovery/new/songs', data, cookie, response);
});

//新碟上架 ,type ALL, ZH,EA,KR,JP
router.get(version + '/top/album', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		'offset': request.query.offset,
		'total': true,
		'limit': request.query.limit,
		'area': request.query.type,
		"csrf_token": ""
	}
	Tools.WebAPI('/weapi/album/new', data, cookie, response);
});

//simi ,相似歌单，歌曲，关注的用户
router.get(version + '/simi/song', function(request, response) {
	var cookie = request.get('Cookie') ? request.get('Cookie') : (request.query.cookie ? request.query.cookie : '');
	var data = {
		'songid': request.query.id,
		"csrf_token": ""
	}
	Tools.WebAPI('/weapi/v1/discovery/simiSong', data, cookie, response);
});
module.exports = router;