function initServer(io,callback) {
	if (io) {
		io.on('connection', function(socket) {
			socket.on('message', function(data) {
				console.log(data.message)
			});
			//console.log('emit所有人推送,broadcast除某个套接字以外的所有人发送消息，eg:connection不推送');
			//向所有连接推送news消息
			socket.broadcast.emit('news', {
				message: 'a new connection',
				newsType: 'server-prop'
			});
			if(callback){
				callback(socket)
			}

			socket.on('disconnect', function() {
				//console.log('disconnect')
			});
		});
	}

}

module.exports = {
	initServer: initServer
};