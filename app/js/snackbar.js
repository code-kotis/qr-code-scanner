var snackbar = {};
var snackBarElement = document.querySelector('.app__snackbar');
var snackbarMsg = null;

//To show notification
snackbar.show = (msg, options = 4000) => {
  if (!msg) return;

  if (snackbarMsg) {
    snackbarMsg.remove();
  }

  snackbarMsg = document.createElement('div');
  snackbarMsg.className = 'app__snackbar-msg';
  snackbarMsg.textContent = msg;
  snackBarElement.appendChild(snackbarMsg);

  //Show toast for 3secs and hide it
  setTimeout(() => {
    snackbarMsg.remove();
  }, options);
};

exports.snackbar = snackbar;
