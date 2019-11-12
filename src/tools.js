var net = require('net');

// 检测端口是否被占用
function portIsOccupied(port) {
	// 创建服务并监听该端口
	if (port) {
		var server = net.createServer().listen(port);
		if (server) {
			server.on('listening', function() {
				server.close(); // 关闭服务
				console.log(`port【${port}】 can use.`);
			});

			server.on('error', function(err) {
				//端口已经被使用
				try {
					if (err.code === 'EADDRINUSE') {
						console.log(`port【${port}】 is already used.`);
					}
				} catch (e) {
					console.log('error..');
				}


			});
		}

	};
};

//portIsOccupied(3000)
module.exports = {
	portIsOccupied: portIsOccupied
}