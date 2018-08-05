window.onerror = log;

const ui = getUI(["images", "canvas", "info", "image", "vibrationInfo", "desktopWarning"]);

const ctx = ui.canvas.getContext('2d');
let imageData;

let lastVal = null;
const stride = ui.canvas.width * 4;
const duration = 100;
const period = 100;
const pattern = new Array(duration / period * 2)

function processPointer(x, y) {
  x = x - ui.canvas.offsetLeft;
  y = y - ui.canvas.offsetTop;
  const val = imageData[x * 4 + y * stride];
  if (lastVal == null) {
    lastVal = val;
    return;
  }
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

function loadImage() {
  on(ui.image, 'load', async () => {
    ctx.drawImage(ui.image, 0, 0, ui.canvas.width, ui.canvas.height);
    imageData = ctx.getImageData(0, 0, ui.canvas.width, ui.canvas.height).data;
  }, {once: true});
  ui.image.src=`images/${ui.images.value}`;
}
loadImage();

on(ui.images, 'change', loadImage);

on(ui.canvas, "touchmove", e => {
  const touch = e.touches[0];
  processPointer(touch.clientX, touch.clientY);
});

on(ui.canvas, "touchup", e => {
  lastVal = null;
});

const mobile = /like mac os x/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent);
if (mobile) {
  ui.vibrationInfo.style.display = 'block';
} else {
  ui.desktopWarning.style.display = 'block';
}

delegate('toast', 'click', document.body, target => {
  target.style.display = 'none';
});

function delegate(className, event, el, func) {
  const handler = e => {
    let currNode = e.target;
    while (currNode !== e.currentTarget) {
      if (currNode.className.includes(className)) {
        func(currNode);
      }
      currNode = currNode.parentNode;
    }
  };
  on(el, event, handler);
}

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
