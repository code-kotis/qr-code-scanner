const QRReader = {
	active: false,
	canvas: null,
	ctx: null,
	decoder: null,

	init: (webcamSelector, baseurl = "") => {
		let streaming = false;
	
		// Init Webcam + Canvas
		QRReader.webcam = document.querySelector(webcamSelector);
		QRReader.setCanvas();
		QRReader.decoder = new Worker(baseurl + "decoder.min.js");
	
		// Resize webcam according to input
		QRReader.webcam.addEventListener("play", ev => {
			if (!streaming) {
				setCanvasProperties();
				streaming = true;
			}
		}, false);
	
		function setCanvasProperties() {
			QRReader.canvas.width = window.innerWidth;
			QRReader.canvas.height = window.innerHeight;
		}
	
		function startCapture(constraints) {
			navigator.mediaDevices.getUserMedia(constraints).then(stream => {
				QRReader.webcam.srcObject = stream;
			}).catch(err => {
				showErrorMsg();
			});
		}
	
		navigator.mediaDevices.enumerateDevices().then(devices => {
      devices = devices.filter(device => device.kind === 'videoinput');
	
			if (devices.length > 1) {
				const constraints = {
					video: {
						facingMode: 'environment'
					},
					audio: false
				};
				startCapture(constraints);
			} else {
				startCapture({ video: true, audio: false });
			}
		}).catch(error => {
			showErrorMsg();
		});
	
		function showErrorMsg() {
			window.alert('Camera permission not granted, unable to access video stream!');
		}
	},
	scan: callback => {
		QRReader.active = true;
		QRReader.setCanvas();
		function onDecoderMessage(event) {
			if (event.data.length > 0) {
				const qrid = event.data[0][2];
				QRReader.active = false;
				callback(qrid);
			}
			setTimeout(newDecoderFrame, 0);
		}
		QRReader.decoder.onmessage = onDecoderMessage;
	
		// Start QR-decoder
		function newDecoderFrame() {
			if (!QRReader.active) return;
			try {
				QRReader.ctx.drawImage(QRReader.webcam, 0, 0, QRReader.canvas.width, QRReader.canvas.height);
				const imgData = QRReader.ctx.getImageData(0, 0, QRReader.canvas.width, QRReader.canvas.height);
				if (imgData.data) {
					QRReader.decoder.postMessage(imgData);
				}
			} catch (e) {
				// Try-Catch to circumvent Firefox Bug #879717
				if (e.name == "NS_ERROR_NOT_AVAILABLE") setTimeout(newDecoderFrame, 0);
			}
		}
		newDecoderFrame();
	},
	setCanvas: () => {
		QRReader.canvas = document.createElement("canvas");
		QRReader.ctx = QRReader.canvas.getContext("2d");
	}
};

module.exports = QRReader;
