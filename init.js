/*!
 * Chocolat Mixin for LaTeX word counts using `texcount`
 * Copyright(c) 2012 Dan Palmer <dan.palmer@me.com>
 */

var child = require('child_process');
var async = require('async');
var storage = Storage.persistent();

var SETTINGS_KEY = 'latex-wordcount-settings';
if (!storage.get(SETTINGS_KEY)) {
	storage.set(SETTINGS_KEY, {
		texcountPath: '', include: true
	});
}

Hooks.addMenuItem('Actions/LaTeX/Wordcount Preferences\u2026', '', config);
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
	var userPref = storage.get(SETTINGS_KEY).texcountPath;
	child.exec('test -e ' + userPref, function(err, stdout, stderr) {
		if (err) {
			callback();
		} else {
			callback(userPref);
		}
	});
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
	var dir = document.path().replace(/[^\/]*$/, '');
	var command = 'cd ' + dir + '; ' + texcount + ' -inc -total ' + document.path();
	child.exec(command, function(err, stdout, stderr) {
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
	var window = new Window();
	
	window.setFrame({x:0, y:0, width:350, height:140});
	window.htmlPath = 'config.html';
	window.buttons = ['Save', 'Cancel'];
	window.title = 'LaTeX Wordcount Preferences';
	window.onButtonClick = function(button) {
		if (button == 'Save') {
			var settings = {
				'texcountPath': window.evalExpr('document.getElementById("texcountPath").value || ""'),
				'include': (window.evalExpr('document.getElementById("include").checked')) ? true : false
			}
			storage.set(SETTINGS_KEY, settings);
		}
		window.close();
	};
	window.onLoad = function() {
		window.applyFunction(function(settings) {
			document.getElementById('texcountPath').value = settings.texcountPath;
			if (settings.include) {
				document.getElementById('include').setAttribute("checked");
			} else {
				document.getElementById('include').removeAttribute("checked");
			}
		}, [storage.get(SETTINGS_KEY)]);
	}
	
	window.run();
}
