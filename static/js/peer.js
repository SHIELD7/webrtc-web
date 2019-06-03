function Peer(id) {
	this.id = id;
	var sendChannel;
	var receiveChannel;

	var configuration = {
		iceServers: [{
			urls: [
				"stun:stun.xten.com",
				"stun:stun.ekiga.net"
			]
		}]
	};

	var pc = new RTCPeerConnection(configuration);


	sendChannel = pc.createDataChannel('datachannel');


	this.getPc = function() {
		return pc;
	}

	pc.oniceconnectionstatechange = function(e) {
		console.log('oniceconnectionstatechange ' + pc.iceConnectionState + ' ' + id);
		document.getElementById(id + 'ice').value = pc.iceConnectionState;
		sendChannel = pc.createDataChannel('datachannel');
	}

	pc.ondatachannel = function(e) {
		receiveChannel = e.channel;
		setupDataHandlers();
		console.log('on datachnnel add' + id);
	}

	pc.onicecandidate = function(e) {
		if (e.candidate) {
			var payload = {};
			payload.label = e.candidate.sdpMLineIndex;
			payload.id = e.candidate.sdpMid;
			payload.candidate = e.candidate;
			sendMessage(id, "candidate", payload);
		}
	}

	this.send = function(type, message) {
		var payload = {};
		payload.what = type;
		payload.data = message;
		sendDataChannelMessage(payload);
		console.log(payload);
	}


		this.onCreateAnswerFail = function() {
			console.log('fail answer' + arguments[0]);
		}
		this.onCreateOfferFail = function() {
			console.log('fail offer' + arguments[0]);
		}

		this.onCreateOfferSuccess = function() {
			console.log('success');
			console.log(arguments[0]);
			var sdp = arguments[0];
			var payload = {};
			payload.type = sdp.type;
			console.log('before' + sdp.sdp);
			payload.sdp = sdp.sdp.replace('b=AS:30', 'b=AS:1638400');
			console.log('after' + payload.sdp);
			sendMessage(id, 'offer', payload);
			var rtcSessionDescriptionInit = {
				'type': payload.type,
				'sdp': payload.sdp
			};
			var sessionDescription = new RTCSessionDescription(rtcSessionDescriptionInit);
			pc.setLocalDescription(sessionDescription);
			console.log(payload);
		}

		this.onCreateAnswerSuccess = function() {
			console.log('success create answer');
			console.log(arguments[0]);
			var sdp = arguments[0];
			var payload = {};
			payload.type = sdp.type;
			console.log('before' + sdp.sdp);
			payload.sdp = sdp.sdp.replace('b=AS:30', 'b=AS:1638400');
			console.log('after' + payload.sdp);
			sendMessage(id, 'answer', payload);
			var rtcSessionDescriptionInit = {
				'type': payload.type,
				'sdp': payload.sdp
			};
			var sessionDescription = new RTCSessionDescription(rtcSessionDescriptionInit);
			pc.setLocalDescription(sessionDescription);
			console.log(payload);
		}



		this.onAddSuccess = function() {
			console.log('add success');
		}

		this.onAddFail = function() {
			console.log(arguments[0].message);
		}

		this.onSetRemoteSucess = function() {
			console.log('set remote sucess ' + id);
		}
		this.onSetRemoteFail = function() {
			console.log('set Remote fail' + arguments[0] + id);
		}

		function setupDataHandlers() {
			receiveChannel.onmessage = function(event) {
				var msg = "";
				try {
					msg = JSON.parse(event.data)
				} catch (err) {}
				var cb = document.getElementById("rec_message");
				if (msg.what == 'file') {
					progressDownload(msg.data);
				}
				if (msg.what == 'message') {
					cb.value += id.substr(0, 7) + "：" + msg.data + "\n";
					cb.scrollTop = cb.scrollHeight;
				}
				if (msg.what == 'file_info') {
					startDownload(msg.data);
				}
			}
			receiveChannel.onerror = function(event) {
				document.getElementById(id + 'dc').value = '错误'
			}

			receiveChannel.onopen = function() {
				document.getElementById(id + 'dc').value = '已连接'
			};

			receiveChannel.onclose = function() {
				document.getElementById(id + 'dc').value = '已关闭'
			};


		}


		var incomingFileInfo;
		var incomingFileData;
		var bytesReceived;
		var downloadInProgress = false;
		var count = 0;

		function startDownload(data) {
			console.log(data);
			incomingFileInfo = JSON.parse(data);
			console.log(incomingFileInfo.fileName);
			incomingFileData = [];
			bytesReceived = 0;
			downloadInProgress = true;
		}

		function progressDownload(data) {
			var bytes = _base64ToArrayBuffer(data);
			bytesReceived += bytes.byteLength;
			incomingFileData.push(bytes);
			var percent = (bytesReceived / incomingFileInfo.fileSize) * 100;
			var progressbar = document.getElementById('From:' + id);
			progressbar.style.cssText = "width: " + parseInt(percent) + "%;";
			if (bytesReceived >= incomingFileInfo.fileSize) {
				endDownload();
			}
		}


		function _base64ToArrayBuffer(base64) {
			var binary_string = window.atob(base64);
			var len = binary_string.length;
			var bytes = new Uint8Array(len);
			for (var i = 0; i < len; i++) {
				bytes[i] = binary_string.charCodeAt(i);
			}
			return bytes.buffer;
		}



		function endDownload() {
			downloadInProgress = false;
			var blob = new window.Blob(incomingFileData);
			var anchor = document.createElement('a');
			anchor.href = URL.createObjectURL(blob);
			anchor.download = incomingFileInfo.fileName;
			anchor.textContent = 'XXXXXXX';

			if (anchor.click) {
				anchor.click();
			} else {
				var evt = document.createEvent('MouseEvents');
				evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				anchor.dispatchEvent(evt);
			}
		}
	}
