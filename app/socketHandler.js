module.exports = function(io) {

	io.on('connection', function(client) {
		console.log('-- ' + client.id + ' joined --');
		client.emit('id', client.id);

		client.on('join', function(roomId) {
			console.log('join room' + roomId)
			client.join(roomId);
		})

		client.on('init', function(roomId) {
			var mark = new Map();
			var roomMembers = io.sockets.adapter.rooms[roomId].sockets;
			for (var clientId in roomMembers) {
				var recSocket = io.sockets.connected[clientId];
				for (var clientId2 in roomMembers) {
					if (clientId != clientId2) {
						if (!mark.has(clientId + clientId2)) {
							var sendSocket = io.sockets.connected[clientId2];
							recSocket.emit('message', {
								type: 'init',
								from: sendSocket.id
							})
							mark.set(clientId + clientId2, 'true');
							mark.set(clientId2 + clientId, 'true');
						}

					}
				}
			}
		});

		client.on('message', function(details) {
			if (io.sockets.connected[details.to]) {
				io.sockets.connected[details.to].emit('message', details);
			}
		});

		client.on('call', function(roomId) {
			client.broadcast.to(roomId).emit('message', {
				type: "call",
				from: client.id
			});

		})


		function leave() {
			console.log('-- ' + client.id + ' left --');
		}

		client.on('disconnect', leave);
		client.on('leave', leave);
	});
};
