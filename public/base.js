function pjax(options) {
  var self = this;
  return new Promise(function(resolve, reject) {
    $.ajax({
      url: options.url ? options.url : '',
      type: options.method ? options.method : 'get',
      data: options.data ? options.data : '',
      beforeSend: function(diss) {
        //禁用提交按钮

      },
      success: function(res) {
        if (resolve) {
          resolve(stringToObject(res))
        }
      },
      error: function(error) {
        reject(stringToObject(error))
      }
    })
  })
}

function stringToObject(data) {
  var results = null,
    index = 0;
  if (data && data != '' && data != '""') {
    results = data;
  } else {
    return;
  }
  while (typeof results === 'string') {
    index++;
    if (results.indexOf('{') > -1 && results.lastIndexOf('}') > -1) {
      results = JSON.parse(results);
    } else {
      break;
    }
  };
  return results;
}

function debounce(fn, delay, immediate) {
  let timer;
  return function() {
    let self = this;
    let args = arguments;
    if (timer) {
      clearTimeout(timer)
    };
    if (immediate) {
      var callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (callNow) {
        fn.apply(self, args);
      }
    } else {
      timer = setTimeout(function() {
        fn.apply(self, args)
      }, delay);
    }
  }
}

function getUrlParam(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.href);
  return results == null ? "" : decodeURIComponent(results[1]);
}

function replaceParam(paramName, replaceWith) {
  var oUrl = this.location.href.toString();
  var re = eval('/(' + paramName + '=)([^&]*)/gi');
  var nUrl = oUrl.replace(re, paramName + '=' + replaceWith);
  this.location = nUrl;　　
  window.location.href = nUrl
}

var audioContext = null,
  audioSrc = null,
  analyser = null;

function notes(audio) {

  if (!audioContext) {
    audioContext = new AudioContext();
  }
  audio.crossOrigin = 'all';
  if (!analyser) {
    analyser = audioContext.createAnalyser();
  }
  if (!audioSrc) {
    audioSrc = audioContext.createMediaElementSource(audio);
  }
  audioSrc.connect(analyser);
  analyser.connect(audioContext.destination);
  var frequencyData = new Uint8Array(analyser.frequencyBinCount);
  var canvas = document.getElementById('canvas');
  canvas.width = $('.canvas').width();
  canvas.height = $('.canvas').height();
  var cwidth = canvas.width,
    cheight = canvas.height,
    meterWidth = 15, //柱宽
    gap = 10, //柱间距
    capHeight = 1, //顶子的高度
    capStyle = '#fff',
    meterNum = 40, //count of the meters
    capYPositionArray = []; //store the vertical position of hte caps for the preivous frame
  ctx = canvas.getContext('2d');

  function renderFrame() {
    var array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var step = Math.round(array.length / 60);
    ctx.clearRect(0, 0, cwidth, cheight);
    // for (var i = 0; i < meterNum; i++) {
    //     var value = array[i * step];
    //     if (capYPositionArray.length < Math.round(meterNum)) {
    //         capYPositionArray.push(value);
    //     };
    //     ctx.fillStyle = capStyle;
    //     //draw the cap, with transition effect
    //     if (value < capYPositionArray[i]) {
    //         ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
    //     } else {
    //         ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
    //         capYPositionArray[i] = value;
    //     };
    //     ctx.fillStyle = '#90c400'; //set the filllStyle to gradient for a better look
    //     ctx.fillRect(i * (meterWidth + gap), cheight - value + capHeight, meterWidth, cheight); //the meter
    // }

    for (var i = 0; i < 40; i++) {
      var energy = (array[step * i] / 256.0) * 50;
      for (var j = 0; j < energy; j++) {
        // ctx.beginPath();
        // ctx.moveTo(20 * i + 2, 200 + 4 * j);
        // ctx.lineTo(20 * (i + 1) - 2, 200 + 4 * j);
        // ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20 * i + 2, 200 - 4 * j);
        ctx.lineTo(20 * (i + 1) - 2, 200 - 4 * j);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(20 * i + 2, 200);
      ctx.lineTo(20 * (i + 1) - 2, 200);
      ctx.stroke();
    }
    window.requestAnimationFrame(renderFrame)
  }
  renderFrame();
}