var peers = new Map();
var mClientId;
var client = io.connect('http://47.101.204.122/');
var roomId = '';
var myVideoStream;
var yourVideoStream;

client.on("id", function() {
	console.log(arguments[0]);
	mClientId = arguments[0];
	document.getElementById('myId').value = mClientId;
});

client.on("message", function() {
	console.log('message')
	var type = arguments[0].type;
	var from = arguments[0].from;
	var payload = arguments[0].payload;
	switch (type) {
		case "init":
			onReceiveInit(from);
			break;
		case "offer":
			onReceiveOffer(from, payload);
			break;
		case "answer":
			onReceiveAnswer(from, payload);
			break;
		case "candidate":
			onReceiveCandidate(from, payload);
			break;
		default:
			break;
	}
});

function onReceiveInit(fromUid) {
	addElement(fromUid);
	var peer = getPeer(fromUid);
	peer.getPc().createOffer(peer.onCreateOfferSuccess, peer.onCreateOfferFail);
}

function onReceiveAnswer(fromUid, payload) {
	var peer = getPeer(fromUid);
	var rtcSessionDescriptionInit = {
		'type': payload.type,
		'sdp': payload.sdp
	};
	var sessionDescription = new RTCSessionDescription(rtcSessionDescriptionInit);
	peer.getPc().setRemoteDescription(sessionDescription, peer.onSetRemoteSucess, peer.onSetRemoteFail);
}

function onReceiveOffer(fromUid, payload) {
	addElement(fromUid);
	var peer = getPeer(fromUid);
	var rtcSessionDescriptionInit = {
		'type': payload.type,
		'sdp': payload.sdp
	};
	var sessionDescription = new RTCSessionDescription(rtcSessionDescriptionInit);
	peer.getPc().setRemoteDescription(sessionDescription, peer.onSetRemoteSucess, peer.onSetRemoteFail);
	peer.getPc().createAnswer(peer.onCreateAnswerSuccess, peer.onCreateAnswerFail);

}

function onReceiveCandidate(fromUid, payload) {
	var peer = peers.get(fromUid);
	if (peer.getPc() || peer.getPc().remoteDescription != null) {
		var rtcIceCandidateInit
		if (payload.mark != null) {
			rtcIceCandidateInit = {
				'candidate': payload.candidate,
				'sdpMid': payload.id,
				'sdpMLineIndex': payload.label
			};
		} else {
			rtcIceCandidateInit = {
				'candidate': payload.candidate.candidate,
				'sdpMid': payload.id,
				'sdpMLineIndex': payload.label
			};
		}

		var candidate = new RTCIceCandidate(rtcIceCandidateInit);
		console.log(candidate);
		peer.getPc().addIceCandidate(candidate, peer.onAddSuccess, peer.onAddFail);
	}
}

function sendRoomId() {
	roomId = document.getElementById('key').value;
	client.emit('join', roomId);
}

function sendInitMessage(roomId) {
	client.emit("init", roomId);
}

function sendMessage(to, type, payload) {
	var message = {}
	message.to = to;
	message.type = type;
	message.payload = payload;
	message.from = mClientId;
	client.emit("message", message);
}

function sendDataMessageToAllPeer(type,msg) {
	for (var peer of peers.values()) {
		peer.send(type,msg);
	}
}



function sendChat(msg) {
	var cb = document.getElementById("rec_message"),
		c = document.getElementById("send_message");
	msg = msg || c.value;
	cb.value += "我：" + msg + "\n";
	sendDataMessageToAllPeer('message',msg);
	c.value = '';
	cb.scrollTop = cb.scrollHeight;
}

function init() {
	client.emit('init', roomId);
}

function addElement(fromUid) {
	var father = document.getElementById('linkedPeer');
	var tr = document.createElement('tr');
	var td = document.createElement('td');
	var peerId = document.createElement('input');
	var dcStatus = document.createElement('input');
	var iceStatus = document.createElement('input');
	peerId.value = fromUid.substr(0, 7);
	peerId.setAttribute('type', 'button');
	peerId.className = 'btn btn-success';
	iceStatus.className = 'btn btn-success';
	iceStatus.setAttribute('type', 'button');
	iceStatus.setAttribute('id', fromUid + 'ice');
	iceStatus.value = '状态';
	dcStatus.className = 'btn btn-success';
	dcStatus.setAttribute('type', 'button');
	dcStatus.setAttribute('id', fromUid + 'dc');
	dcStatus.value = '通道状态';
	td.appendChild(peerId);
	td.appendChild(iceStatus);
	td.appendChild(dcStatus);
	tr.appendChild(td);
	father.appendChild(tr);
	createEle(fromUid);

}



function getPeer(from) {
	var peer;
	if (!peers.has(from)) {
		peer = addPeer(from);
	} else {
		peer = peers.get(from);
	}
	return peer;
}

function addPeer(id) {
	var peer = new Peer(id)
	peers.set(id, peer);
	return peer;
}

function removePeer(id) {
	var peer = peers.get(id);
	peers.delete(peer.id);
}

