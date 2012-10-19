/*!
 * Chocolat Mixin for LaTeX word counts using `texcount`
 * Copyright(c) 2012 Dan Palmer <dan.palmer@me.com>
 */

// Hooks.onInsertText(function(editor) {
// 	if ('latex.tex.text'.indexOf(Document.current().rootScope())) {
// 		return;
// 	}
// 	count(Document.current());
// });

var child = require('child_process');
var async = require('async');

Hooks.addKeyboardShortcut('ctrl-alt-cmd-l', function() {
	var doc = Document.current();
	if ('latex.tex.text'.indexOf(doc.rootScope())) {
		return;
	}
	check(function(texcount) {
		count(texcount, doc, function(words) {
			Alert.show('Word Count', doc.displayName() + ' contains ' + words + ' words.');
		});
	});
});

Hooks.addMenuItem('Actions/LaTeX/Wordcount Preferences\u2026', '', config);

function check(callback) {
	async.series([
		checkUserSetting,
		checkTexbin,
		checkPath,
	], function(path) {
		
		if (path) {
			callback(path);
			return;
		}
		
		var error = 'TeXcount was not found. It can be downloaded from http://app.uio.no/ifi/texcount/\n\n';
		error += 'This mixin requires that it be on your path and have the name \'texcount\'\n\n';
		error += 'Checked:\n';
		error += '  \u2014 Configured Path\n';
		error += '  \u2014 TeXbin Directory (/usr/texbin)\n';
		error += '  \u2014 System $PATH';
		Alert.show('Error', error);
	});
}

function checkUserSetting(callback) {
	callback();
}

function checkTexbin(callback) {
	child.exec('test -e /usr/texbin/texcount', function(err, stdout, stderr) {
		if (err) {
			callback();
		} else {
			callback('/usr/texbin/texcount');
		}
	});
}

function checkPath(callback) {
	child.exec('which texcount', function(err, stdout, stderr) {
		if (err) {
			callback();
		} else {
			callback(stdout);
		}
	});
}

function count(texcount, document, callback) {
	child.execFile(texcount, [
		'-inc',
		'-total',
		document.path()
	], function(err, stdout, stderr) {
		if (err) {
			Alert.show('Error', err);
		} else {
			var lines = stdout.split('\n'), i = 0;
			while (lines[i].indexOf('Words in text:') !== 0) {
				i++;
			}
			var words = lines[i].split(': ', 2)[1];
			callback(words);
		}
	});
}

function config() {
	if (!Editor) {
		return;
	}
	
	var window = new Sheet(Editor.current().window());
	
	window.htmlPath = 'config.html';
	window.buttons = ['Save', 'Cancel'];
	window.onButtonClick = function(button) {
		if (button == 'Save') {
			saveConfig(window);
		}
	};
	
	window.run();
}

function saveConfig(window) {
	var settings = window.evalExpr('settings()');
	Alert.show('Debug', settings.toString());
}