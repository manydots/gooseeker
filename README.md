# 网易云音乐music（仅供学习使用）

[music-preview](https://music.jeeas.cn/)

[windows64:redis下载地址](http://qrcode.jeeas.cn/download/redis.zip)

### 项目启动
```
 
   npm run server
   
```

### 项目部署
```

	使用wss建立websoket时需要注意:
    nginx需要配置:(或者查看https://github.com/manydots/node)

	location / {
	  ...
	  proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      ...
    }

```

### API调用限制
```javascript
 	
 	express-rate-limit:访问限制20s内60次
 	apicache:缓存3s

```

### music文档说明
```javascript
	
	const hostname = "https://music.jeeas.cn/";
	const version = "/v1";
	const getApi = hostname + version;
			
		以get方式请求

		1、搜索歌曲名 params[s=歌曲名,type,offset,limit]
		  getApi/search?s=歌曲名

		2、单曲播放地址 params[id=歌曲id,br]
		  getApi/music/url?id=25643093

		3、歌词 params[id]
		  getApi/lyric?id=25643093
		
		4、单曲详情 params[id]
		  getApi/music/detail?id=25643093

		5、专辑详情 params[id] 
		  getApi/album/detail?id=2263164

		6、歌单类型列表 params[]
		  getApi/playlist/catlist
		
		7、歌单类型列表-热门类型 params[] 
		  getApi/playlist/hot
		
		8、推荐新音乐 params[] 
		  getApi/personalized/newsong

		9、搜索hot params[]
		  getApi/search/hot

		10、推荐歌单 params[] 
		  getApi/personalized


```

### 更新
```javascript
 	
 	socket.io:向首页推送API调用数据
 	redis:将API调用数据存入redis中

```

### 参考项目
```
	
	https://github.com/sqaiyan/netmusic-node
    https://github.com/Binaryify/NeteaseCloudMusicApi

```