import test from 'ava';
import {
    ConnectPromise, ConnectTsPromiseErrors, getDescriptionFromObject,
    IErrorMessage
} from "../lib/connect-ts-promise";
import {AdapterConnectionStates, IConnectionAdapter, IMessageWithId} from "connection-adapter";
import {ReplaySubject} from "rxjs";
import {IMessage} from "connect-ts-api";

const MESSAGE_TO_SEND: IMessage = {
    payload: 'Test payload text',
    payloadType: 1
};

const MOCK_CLIENT_MSG_ID = '123asd';

test.beforeEach(t => {
    const adapterDataEmitter = new ReplaySubject<IMessageWithId>(1);
    const adapterState = new ReplaySubject<AdapterConnectionStates>(1);
    t.context.adapterDataEmitter = adapterDataEmitter;
    t.context.adapterState = adapterState;
    const mockAdapter: IConnectionAdapter = {
        send: (data: IMessageWithId) => {},
        data: adapterDataEmitter,
        state: adapterState,
        connect: (url: string) => {}
    };
    const connectPromise = new ConnectPromise({adapter: mockAdapter, instanceId: 'connect-promise-test'});
    connectPromise.setErrorChecker((msg: IMessage) => {
        return msg.payloadType === 50; //50 is Error type
    });
    (<any> connectPromise).generateClientMsgId = () => {
        return MOCK_CLIENT_MSG_ID
    };
    t.context.connect = connectPromise;
    adapterState.next(AdapterConnectionStates.CONNECTED);
});

test('should resolve sendCommand', (t) => {
    const connect: ConnectPromise = t.context.connect;
    t.plan(1);
    const dataEmitter: ReplaySubject<IMessageWithId> = t.context.adapterDataEmitter;
    const sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then((res) => {
        t.deepEqual(res, MESSAGE_TO_SEND)
    }, (err: IErrorMessage) => {
        t.fail(`Promise should be resolved. Err:${err.errorCode} - ${err.description}`);
    });
    dataEmitter.next({
        payload: MESSAGE_TO_SEND.payload,
        payloadType: MESSAGE_TO_SEND.payloadType,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendPromise
});

test('should reject sendCommand if Message type error', (t) => {
    const connect: ConnectPromise = t.context.connect;
    t.plan(1);
    const dataEmitter: ReplaySubject<IMessageWithId> = t.context.adapterDataEmitter;
    const sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then((res) => {
        t.fail(`Promise should be rejected, but got response:${getDescriptionFromObject(res)}`);
    }, (err: IErrorMessage) => {
        t.is(err.errorCode, ConnectTsPromiseErrors.RESPONSE_ERROR);
    });
    dataEmitter.next({
        payload: 'Error message response',
        payloadType: 50,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendPromise
});

test('should reject sendCommand if Connection is disrupted', (t) => {
    const connect: ConnectPromise = t.context.connect;
    const adapterState: ReplaySubject<AdapterConnectionStates> = t.context.adapterState;
    adapterState.next(AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    const sendPromise = connect.sendPromiseCommand(MESSAGE_TO_SEND).then((res) => {
        t.fail(`Promise should be rejected, but got response:${getDescriptionFromObject(res)}`);
    }, (err: IErrorMessage) => {
        t.is(err.errorCode, ConnectTsPromiseErrors.CONNECT_LAYER_ERROR);
    });
    return sendPromise
});

test('should resolve sendGuaranteedCommand after connection issues', (t) => {
    const connect: ConnectPromise = t.context.connect;
    const adapterState: ReplaySubject<AdapterConnectionStates> = t.context.adapterState;
    adapterState.next(AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    const dataEmitter: ReplaySubject<IMessageWithId> = t.context.adapterDataEmitter;
    const sendGuaranteedPromise = connect.sendPromiseGuaranteedCommand(MESSAGE_TO_SEND).then((res) => {
        t.deepEqual(res, MESSAGE_TO_SEND)
    }, (err: IErrorMessage) => {
        t.fail(`Promise should be resolved. Err:${err.errorCode} - ${err.description}`);
    });
    adapterState.next(AdapterConnectionStates.CONNECTING);
    adapterState.next(AdapterConnectionStates.DISCONNECTED);
    adapterState.next(AdapterConnectionStates.CONNECTING);
    adapterState.next(AdapterConnectionStates.CONNECTED);
    dataEmitter.next({
        payload: MESSAGE_TO_SEND.payload,
        payloadType: MESSAGE_TO_SEND.payloadType,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendGuaranteedPromise
});

test('should reject sendGuaranteedCommand if Message type error', (t) => {
    const connect: ConnectPromise = t.context.connect;
    const adapterState: ReplaySubject<AdapterConnectionStates> = t.context.adapterState;
    adapterState.next(AdapterConnectionStates.DISCONNECTED);
    t.plan(1);
    const dataEmitter: ReplaySubject<IMessageWithId> = t.context.adapterDataEmitter;
    const sendGuaranteedPromise = connect.sendPromiseGuaranteedCommand(MESSAGE_TO_SEND).then((res) => {
        t.fail(`Promise should be rejected, but got response:${getDescriptionFromObject(res)}`);
    }, (err: IErrorMessage) => {
        t.is(err.errorCode, ConnectTsPromiseErrors.RESPONSE_ERROR);
    });
    adapterState.next(AdapterConnectionStates.CONNECTING);
    adapterState.next(AdapterConnectionStates.DISCONNECTED);
    adapterState.next(AdapterConnectionStates.CONNECTING);
    adapterState.next(AdapterConnectionStates.CONNECTED);
    dataEmitter.next({
        payload: 'Error message response',
        payloadType: 50,
        clientMsgId: MOCK_CLIENT_MSG_ID
    });
    return sendGuaranteedPromise
});
