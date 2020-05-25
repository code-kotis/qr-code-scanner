import { snackbar } from '../snackbar.js';

var QRReader = {};

QRReader.active = false;
QRReader.webcam = null;
QRReader.canvas = null;
QRReader.ctx = null;
QRReader.decoder = null;

QRReader.setCanvas = () => {
  QRReader.canvas = document.createElement('canvas');
  QRReader.ctx = QRReader.canvas.getContext('2d');
};

function setPhotoSourceToScan(forSelectedPhotos) {
  if (!forSelectedPhotos && window.isMediaStreamAPISupported) {
    QRReader.webcam = document.querySelector('video');
  } else {
    QRReader.webcam = document.querySelector('img');
  }
}

QRReader.init = () => {
  var baseurl = '';
  var streaming = false;

  // Init Webcam + Canvas
  setPhotoSourceToScan();

  QRReader.setCanvas();
  QRReader.decoder = new Worker(baseurl + 'decoder.js');

  if (window.isMediaStreamAPISupported) {
    // Resize webcam according to input
    QRReader.webcam.addEventListener(
      'play',
      function(ev) {
        if (!streaming) {
          setCanvasProperties();
          streaming = true;
        }
      },
      false
    );
  } else {
    setCanvasProperties();
  }

  function setCanvasProperties() {
    QRReader.canvas.width = window.innerWidth;
    QRReader.canvas.height = window.innerHeight;
  }

  function startCapture(constraints) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(stream) {
        QRReader.webcam.srcObject = stream;
        QRReader.webcam.setAttribute('playsinline', true);
        QRReader.webcam.setAttribute('controls', true);
        setTimeout(() => {
          document.querySelector('video').removeAttribute('controls');
        });
      })
      .catch(function(err) {
        console.log('Error occurred ', err);
        showErrorMsg();
      });
  }

  if (window.isMediaStreamAPISupported) {
    navigator.mediaDevices
      .enumerateDevices()
      .then(function(devices) {
        var device = devices.filter(function(device) {
          var deviceLabel = device.label.split(',')[1];
          if (device.kind == 'videoinput') {
            return device;
          }
        });

        var constraints;
        if (device.length > 1) {
          constraints = {
            video: {
              mandatory: {
                sourceId: device[device.length - 1].deviceId ? device[device.length - 1].deviceId : null
              }
            },
            audio: false
          };

          if (window.iOS) {
            constraints.video.facingMode = 'environment';
          }
          startCapture(constraints);
        } else if (device.length) {
          constraints = {
            video: {
              mandatory: {
                sourceId: device[0].deviceId ? device[0].deviceId : null
              }
            },
            audio: false
          };

          if (window.iOS) {
            constraints.video.facingMode = 'environment';
          }

          if (!constraints.video.mandatory.sourceId && !window.iOS) {
            startCapture({ video: true });
          } else {
            startCapture(constraints);
          }
        } else {
          startCapture({ video: true });
        }
      })
      .catch(function(error) {
        showErrorMsg();
        console.error('Error occurred : ', error);
      });
  }

  function showErrorMsg() {
    window.noCameraPermission = true;
    document.querySelector('.custom-scanner').style.display = 'none';
    snackbar.show('Unable to access the camera', 10000);
  }
};

/**
 * \brief QRReader Scan Action
 * Call this to start scanning for QR codes.
 *
 * \param A function(scan_result)
 */
QRReader.scan = function(callback, forSelectedPhotos) {
  QRReader.active = true;
  QRReader.setCanvas();
  function onDecoderMessage(event) {
    if (event.data.length > 0) {
      var qrid = event.data[0][2];
      QRReader.active = false;
      callback(qrid);
    }
    setTimeout(newDecoderFrame, 0);
  }

  QRReader.decoder.onmessage = onDecoderMessage;

  setTimeout(() => {
    setPhotoSourceToScan(forSelectedPhotos);
  });

  // Start QR-decoder
  function newDecoderFrame() {
    if (!QRReader.active) return;
    try {
      QRReader.ctx.drawImage(QRReader.webcam, 0, 0, QRReader.canvas.width, QRReader.canvas.height);
      var imgData = QRReader.ctx.getImageData(0, 0, QRReader.canvas.width, QRReader.canvas.height);

      if (imgData.data) {
        QRReader.decoder.postMessage(imgData);
      }
    } catch (e) {
      // Try-Catch to circumvent Firefox Bug #879717
      if (e.name == 'NS_ERROR_NOT_AVAILABLE') setTimeout(newDecoderFrame, 0);
    }
  }
  newDecoderFrame();
};

export default QRReader;
