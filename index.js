window.onerror = log;

const ui = getUI(["canvas", "info", "image"]);

const ctx = ui.canvas.getContext('2d');
let imageData;

let lastVal = 0;
const stride = ui.canvas.width * 4;
const duration = 100;
const period = 50;
const pattern = new Array(duration / period * 2)

function processPointer(x, y) {
  x = x - ui.canvas.offsetLeft;
  y = y - ui.canvas.offsetTop;
  const val = imageData[x * 4 + y * stride];
  if (lastVal === val) return;

  const diff = (lastVal - val) / 255;
  lastVal = val;

  // Vibrate with more intensity when going from dark to bright
  const duty = Math.abs(diff > 0 ?  diff * 0.2 : diff)
  const inactive = 1 - duty;

  for (let i = 0; i < pattern.length; i += 2) {
    pattern[i] = period * duty;
    pattern[i + 1] = period * inactive;
  }

  navigator.vibrate(pattern);
}

let resolveSocket;
const socketPromise = new Promise(resolve => {
  resolveSocket = resolve
});

on(document.body, 'paste', e => {
  if (!e.clipboardData.files.length) return;
  on(ui.image, 'load', async () => {
    ctx.drawImage(ui.image, 0, 0, ui.canvas.width, ui.canvas.height);
    const data = ctx.getImageData(0, 0, ui.canvas.width, ui.canvas.height).data;
    const socket = await socketPromise;
    socket.emit('scroll', Array.from(data));
  }, {once: true});
  ui.image.src=URL.createObjectURL(e.clipboardData.files[0])
});

on(ui.canvas, "touchmove", e => {
  const touch = e.touches[0];
  processPointer(touch.clientX, touch.clientY);
});

const socketIntervalId = setInterval(() => {
  if (!window.___browserSync___) return;
  clearInterval(socketIntervalId);
  const socket = window.___browserSync___.socket;
  resolveSocket(socket);
  // Hijack browser-sync's websocket
  socket.on('scroll', data => {
    imageData = data;
    ctx.putImageData(new ImageData(Uint8ClampedArray.from(data), 300, 300), 0, 0);
  });
  log('connected');
}, 1000);

function on(el, event, func, options) {
  el.addEventListener(event, func, options);
}

function getUI(ids) {
  return ids.reduce((ui, id) => {
    ui[id] = document.getElementById(id);
    return ui;
  }, {});
}

function log(...msgs) {
  if (!window.logEl) {
    window.logEl = document.createElement('ol');
    document.body.appendChild(window.logEl);
  }
  const logEl = window.logEl;
  const logItem = document.createElement('li');
  logItem.textContent = msgs.join(' ');
  logEl.insertBefore(logItem, logEl.childNodes[0]);
  if (logEl.childNodes.length > 10) {
    logEl.childNodes[logEl.childNodes.length - 1].remove();
  }
}
