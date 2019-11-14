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