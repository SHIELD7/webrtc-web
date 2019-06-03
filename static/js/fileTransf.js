var file;
var currentChunk;
var BYTES_PER_CHUNK = 16384;

var fileInput;
var fileReader = new FileReader();

fileReader.onload = sendNextChunk;

function startUpload() {
	fileInput = document.getElementById("filein");
	file = fileInput.files[0];
	currentChunk = 0;
	sendDataMessageToAllPeer('file_info', JSON.stringify({
		fileName: file.name,
		fileSize: file.size,
		send_all: 1
	}));
	readNextChunk();
}

function readNextChunk() {
	console.log('read next');
	var start = BYTES_PER_CHUNK * currentChunk;
	var end = Math.min(file.size, start + BYTES_PER_CHUNK);
	fileReader.readAsArrayBuffer(file.slice(start, end));
}

function sendNextChunk() {
	var msg = _arrayBufferToBase64(fileReader.result)
	sendDataMessageToAllPeer('file',msg);
	currentChunk++;
	var progressbar = document.getElementById('sendBar');
	var start = BYTES_PER_CHUNK * currentChunk;
	var percent = (start / file.size) * 100;
	if (BYTES_PER_CHUNK * currentChunk < file.size) {
		setTimeout(readNextChunk(),1);
		progressbar.style.cssText = "width: " + parseInt(percent) + "%;";

	}
	progressbar.style.cssText = "width: " + parseInt(percent) + "%;";
}

function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}


