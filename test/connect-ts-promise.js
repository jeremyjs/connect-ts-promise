"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var connect_ts_promise_1 = require("../lib/connect-ts-promise");
var connection_adapter_1 = require("connection-adapter");
var rxjs_1 = require("rxjs");
var MESSAGE_TO_SEND = {
    payload: 'Test payload text',
    payloadType: 1
};
var MOCK_CLIENT_MSG_ID = '123asd';
ava_1.default.beforeEach(function (t) {
    var adapterDataEmitter = new rxjs_1.ReplaySubject(1);
    var adapterState = new rxjs_1.ReplaySubject(1);
    t.context.adapterDataEmitter = adapterDataEmitter;
    t.context.adapterState = adapterState;
    var mockAdapter = {
        send: function (data) { },
        data$: adapterDataEmitter,
        state$: adapterState,
        connect: function (url) { }
    };
    var connectPromise = new connect_ts_promise_1.ConnectPromise({ adapter: mockAdapter, instanceId: 'connect-promise-test' });
    connectPromise.setErrorChecker(function (msg) {
        return msg.payloadType === 50;
    });
    connectPromise.generateClientMsgId = function () {
        return MOCK_CLIENT_MSG_ID;
    };
    t.context.connect = connectPromise;
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTED);
});
ava_1.default('should resolve sendCommand', function (t) {
    var connect = t.context.connect;
    t.plan(1);
    var dataEmitter = t.context.adapterDataEmitter;
    var sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then(function (res) {
        t.deepEqual(res, MESSAGE_TO_SEND);
    }, function (err) {
        t.fail("Promise should be resolved. Err:" + err.errorCode + " - " + err.description);
    });
    dataEmitter.next({
        payload: MESSAGE_TO_SEND.payload,
        payloadType: MESSAGE_TO_SEND.payloadType,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendPromise;
});
ava_1.default('should reject sendCommand if Message type error', function (t) {
    var connect = t.context.connect;
    t.plan(1);
    var dataEmitter = t.context.adapterDataEmitter;
    var sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then(function (res) {
        t.fail("Promise should be rejected, but got response:" + connect_ts_promise_1.getDescriptionFromObject(res));
    }, function (err) {
        t.is(err.errorCode, connect_ts_promise_1.ConnectTsPromiseErrors.RESPONSE_ERROR);
    });
    dataEmitter.next({
        payload: 'Error message response',
        payloadType: 50,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendPromise;
});
ava_1.default('should reject sendCommand if Connection is disrupted', function (t) {
    var connect = t.context.connect;
    var adapterState = t.context.adapterState;
    adapterState.next(connection_adapter_1.AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    var sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then(function (res) {
        t.fail("Promise should be rejected, but got response:" + connect_ts_promise_1.getDescriptionFromObject(res));
    }, function (err) {
        t.is(err.errorCode, connect_ts_promise_1.ConnectTsPromiseErrors.CONNECT_LAYER_ERROR);
    });
    return sendPromise;
});
ava_1.default('should resolve sendGuaranteedCommand after connection issues', function (t) {
    var connect = t.context.connect;
    var adapterState = t.context.adapterState;
    adapterState.next(connection_adapter_1.AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    var dataEmitter = t.context.adapterDataEmitter;
    var sendGuaranteedPromise = connect.sendPromiseGuaranteedCommand(MESSAGE_TO_SEND).then(function (res) {
        t.deepEqual(res, MESSAGE_TO_SEND);
    }, function (err) {
        t.fail("Promise should be resolved. Err:" + err.errorCode + " - " + err.description);
    });
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTING);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.DISCONNECTED);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTING);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTED);
    dataEmitter.next({
        payload: MESSAGE_TO_SEND.payload,
        payloadType: MESSAGE_TO_SEND.payloadType,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendGuaranteedPromise;
});
ava_1.default('should reject sendGuaranteedCommand if Message type error', function (t) {
    var connect = t.context.connect;
    var adapterState = t.context.adapterState;
    adapterState.next(connection_adapter_1.AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    var dataEmitter = t.context.adapterDataEmitter;
    var sendGuaranteedPromise = connect.sendPromiseGuaranteedCommand(MESSAGE_TO_SEND).then(function (res) {
        t.fail("Promise should be rejected, but got response:" + connect_ts_promise_1.getDescriptionFromObject(res));
    }, function (err) {
        t.is(err.errorCode, connect_ts_promise_1.ConnectTsPromiseErrors.RESPONSE_ERROR);
    });
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTING);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.DISCONNECTED);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTING);
    adapterState.next(connection_adapter_1.AdapterConnectionStates.CONNECTED);
    dataEmitter.next({
        payload: 'Error message response',
        payloadType: 50,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendGuaranteedPromise;
});
