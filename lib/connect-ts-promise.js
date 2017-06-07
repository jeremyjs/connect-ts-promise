"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var connect_ts_api_1 = require("connect-ts-api");
__export(require("connect-ts-api"));
var ConnectTsPromiseErrors;
(function (ConnectTsPromiseErrors) {
    ConnectTsPromiseErrors[ConnectTsPromiseErrors["RESPONSE_ERROR"] = 1] = "RESPONSE_ERROR";
    ConnectTsPromiseErrors[ConnectTsPromiseErrors["CONNECT_LAYER_ERROR"] = 2] = "CONNECT_LAYER_ERROR";
})(ConnectTsPromiseErrors = exports.ConnectTsPromiseErrors || (exports.ConnectTsPromiseErrors = {}));
function getDescriptionFromObject(res) {
    return Object.keys(res).reduce(function (prevRes, currKey) {
        return prevRes + ("|" + currKey + ": " + res[currKey] + " |");
    }, '');
}
exports.getDescriptionFromObject = getDescriptionFromObject;
var ConnectPromise = (function (_super) {
    __extends(ConnectPromise, _super);
    function ConnectPromise() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.checkErrorCallback = function () { return false; };
        return _this;
    }
    ConnectPromise.prototype.sendFormattedCommand = function (messageToSend, guaranteed) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var commandToSend = {
                message: messageToSend,
                onResponse: function (res) {
                    if (_this.checkErrorCallback(res)) {
                        var errorString = getDescriptionFromObject(res);
                        var errToReject = {
                            errorCode: ConnectTsPromiseErrors.RESPONSE_ERROR,
                            description: "Server response error: " + errorString
                        };
                        reject(errToReject);
                    }
                    else {
                        resolve(res);
                    }
                },
                onError: function (err) {
                    var errToReject = {
                        errorCode: ConnectTsPromiseErrors.CONNECT_LAYER_ERROR,
                        description: "Connection Layer error: " + err
                    };
                    reject(errToReject);
                },
                guaranteed: guaranteed
            };
            _this.sendCommand(commandToSend);
        });
    };
    ConnectPromise.prototype.sendPromiseCommand = function (messageToSend) {
        return this.sendFormattedCommand(messageToSend, false);
    };
    ConnectPromise.prototype.sendPromiseGuaranteedCommand = function (messageToSend) {
        return this.sendFormattedCommand(messageToSend, true);
    };
    ConnectPromise.prototype.setErrorChecker = function (checkCallback) {
        this.checkErrorCallback = checkCallback;
    };
    return ConnectPromise;
}(connect_ts_api_1.Connect));
exports.ConnectPromise = ConnectPromise;
