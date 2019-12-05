(function(win) {
	window.onload = function() {
		var el = document.getElementById('webLogs');
		if (el) {
			init();
		};

		//简单标记a链接来源
		function init() {
			var items = document.getElementsByTagName('a');
			var spm = el.getAttribute('data-spm') || 'music';
			var key = el.getAttribute('data-key') || 'from';
			var path = win.location.pathname;
			if (path.length > 1) {
				path = path.replace(/\//g, '-');
			} else {
				path = '';
			};

			for (var i = 0; i < items.length; i++) {
				items[i].setAttribute('data-spm-anchor-id', `music${path}-item${i}`);
				items[i].onclick = function(e) {
					var ele = e.target.href;
					if (ele && ele != 'javascript:;' && ele != '') {
						if (ele.indexOf('?') < 0) {
							if (ele.indexOf('from') < 0) {
								ele += `?${key}=${spm}`;
							};
						} else {
							if (ele.indexOf('from') < 0) {
								ele += `&${key}=${spm}`;
							};
						};
					};
					e.target.href = ele;
				}
			};
		};
	}

})(window);