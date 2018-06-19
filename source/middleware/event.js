'use strict';

var utils = require("../common/utils");
var Enums = require("../middleware/enums");
var clc = require('cli-color');
var moment = require("moment");

var Event = function (params) {
	var _self = this;
	var _log = null;

	_self.title = [moment().format("hh:mm:ss a")];
	_self.message = null;
	_self.code = null;

	_self.type = null;
	_self.error = null;
	_self.color = null;

	if (typeof(params) === "string") {
		_self.message = utils.fillDateParameters(params);
	} else {
		_self.message = utils.fillDateParameters(params.message);
		_self.code = params.code;
		_self.type = params.type;
		_self.color = params.color || (_self.type === Enums.EventType.Debug ? 'green' : 'redBright');
		_self.style = params.style || 'strike';
		_log = params.log;

		if (_log.identifier) {
			_self.title = _self.title + " / " + _log.identifier;
		}
	}

	var _debug = _log.settings && _log.settings.debug;

	_self.include = function (meta) {
		_self.meta = meta;

		return _self;
	};

	_self.args = function () {
		var items = arguments.length > 0 && arguments[0].toString() === "[object Arguments]" ? arguments[0] : arguments;
		for (var i in items) {
			var value = items[i];

			if (value !== undefined && value !== null) {

				if (value && value.message) {
					_self.error = value;
					if (_self.error.message) {
						_self.message = _self.message.replace("[inner]", value.message);
					} else {
						_self.message = _self.message.replace("[inner]", '');
					}
				} else {
					if (value !== undefined && value !== null) {
						_self.message = _self.message.replace("[" + i + "]", value.toString());
						_self.message = _self.message.replace("[R" + i + "]", clc.redBright(value.toString()));
						_self.message = _self.message.replace("[Y" + i + "]", clc.yellowBright(value.toString()));
						_self.message = _self.message.replace("[B" + i + "]", clc.blueBright(value.toString()));
						_self.message = _self.message.replace("[W" + i + "]", clc.whiteBright(value.toString()));
						_self.message = _self.message.replace("[M" + i + "]", clc.cyanBright(value.toString()));
						_self.message = _self.message.replace("[X" + i + "]", value.toString(16).toUpperCase());
					}
				}
			}
		}

		for (var i = 0; i < 10; i++) {
			_self.message = _self.message.replace("[" + i + "]", "");
		}
		_self.message = _self.message.trim();
		return _self;
	};

	_self.print = function () {
		var logText = "";
		var clcText = "";

		var inner = _self.error && _self.error.event !== this ? _self.error : null;

		if (_self.type === Enums.EventType.Debug) {
			clcText += clc.whiteBright(_self.title) + " > " + clc[_self.color][_self.style](_self.message);
			logText += _self.title + " > " + _self.message + "\n";
		} else {
			if (!_self.stack) {
				try {
					throw _self.toError();
				} catch (x) {
					_self.stack = x.stack;
				}
			}

			var stack = _debug && _self.stack ? utils.getMainStack(_self.stack, "\n") + (inner ? "" : "\n") : "";

			var logHeader = clc.whiteBright(_self.title + " > ") + clc[_self.color][_self.style]("Error Code " + _self.code.toString().padStart(4, '0') + " / " + _self.message) + stack;
			clcText += logHeader;
			logText += logHeader + "\n";
		}

		var getErrorDetail = function (err, level) {
			var stack = _debug ? utils.getMainStack(err.stack, "\n  " + String("  ").repeat(level)) : "\n";

			var space = String("  ").repeat(level) + "\u2514\u2574";

			if (err.event) {
				return {
					clcText : clc.redBright(space + err.event.message + " Error code " + err.event.code + ".") + stack,
					logText : space + err.event.message + " Error code " + err.event.code + "." + (stack ? stack : '\n')
				}
			} else {
				return {
					clcText : space + clc.redBright(err.message) + stack,
					logText : space + err.message + (stack ? stack : '\n')
				}
			}
		};


		var breakPage = inner !== undefined && inner !== null;
		var level = 1;

		while (inner) {
			clcText += "\n";
			logText += "\n";
			var detail = getErrorDetail(inner, level);

			clcText += detail.clcText;
			logText += detail.logText;

			inner = inner.inner;
			level++;
		}

		if (breakPage) {
			clcText = "\n" + clcText + '\n';
			logText = "\n\n" + logText + '\n';
		}

		console.log(clcText);
		if (_log.settings && _log.settings.fileName) {
			utils.file.write(_log.settings.fileName, logText);
		}
		return _self;
	};

	this.throw = function (params) {
		var err = _self.toError(params);

		if (params && params.next) {
			params.next(err);
		} else {
			try {
				throw err;
			} catch (x) {
				_self.stack = x.stack;
				throw err;
			}
		}
	};

	this.exit = function () {
		var err = _self.toError({
			exit : true
		});
		throw err;
	};

	_self.toError = function (params) {
		var err = new Error(this.message);
		err.inner = _self.error;
		err.event = _self;
		err.exit = params !== undefined ? params.exit || false : false;
		err.meta = params !== undefined ? params.meta || _self.meta : null;
		return err;
	};

};

module.exports = Event;

