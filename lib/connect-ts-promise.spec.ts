import {IAdapter, IEncoderDecoder, IDataToSend} from "connect-ts-api";
import {ConnectPromise, IErrorMessage, ConnectTsPromiseErrors} from "./connect-ts-promise";

describe('Connect ts API test', function () {
    let adapter: IAdapter;

    const encodeDecode: IEncoderDecoder = {
        encode: (message) => {return message},
        decode: (message) => {return message}
    };

    let connection: ConnectPromise;
    beforeEach(function () {
        adapter = {
            onOpen: () => {},
            onData: (data?: any): any => {},
            onError: (err?: any): any => {},
            onEnd: (err?: any): any => {},
            connect: () => {},
            send: (message: any): any => {}
        };
        let connectionParams = {
            encodeDecode,
            adapter,
            instanceId: 'tests'
        };
        connection = new ConnectPromise(connectionParams);
    });

    it('sendCommand should encode message and use adapters send method', function(done) {
        adapter.connect = () => {adapter.onOpen()};
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        let receivedId;
        spyOn(encodeDecode, 'encode').and.callFake(({payloadType, payload, clientMsgId}: IDataToSend) => {
            receivedId = clientMsgId;
            expect(payloadType).toBe(testPayloadType);
            expect(payload).toEqual(testPayload);
            return {payloadTypeEncoded: payloadType, payloadEncoded: payload, clientMsgId}
        });

        spyOn(adapter, 'send');
        connection.start().then(() => {
            connection.sendCommand(testPayloadType, testPayload);
            expect(adapter.send).toHaveBeenCalledWith({payloadTypeEncoded: testPayloadType, payloadEncoded: testPayload, clientMsgId: receivedId});
            done();
        });
    });

    it('sends guaranteedCommand once the adapter reconnects', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });
        spyOn(encodeDecode, 'encode').and.callFake(({payloadType, payload, clientMsgId}: IDataToSend) => {
            expect(clientMsgId).toEqual(mockId);
            expect(payloadType).toBe(testPayloadType);
            expect(payload).toEqual(testPayload);
            return {payloadTypeEncoded: payloadType, payloadEncoded: payload, clientMsgId}
        });

        spyOn(adapter, 'send');
        let connectCounter = 0;
        connection.onConnect = () => {
            connectCounter += 1;
            if (connectCounter === 2) { //Call after first reconnection
                expect(adapter.send).toHaveBeenCalledWith({
                    payloadTypeEncoded: testPayloadType,
                    payloadEncoded: testPayload,
                    clientMsgId: mockId
                });
                done();
            }
        };
        connection.start().then(() => {
            adapter.onEnd('Test end');
            connection.sendGuaranteedCommand(testPayloadType, testPayload);
            connection.start(); // Reconnect after end
        });
    });

    it('Resolves Command with expected data', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        const responseMockData = {
            payloadType: testPayloadType,
            payload: 'Response Payload 12!',
            clientMsgId: mockId
        };

        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });

        connection.start().then(() => {
            connection.sendCommand(testPayloadType, testPayload).then(response => {
                expect(response).toBe(responseMockData.payload);
                done();
            }).catch(err => {
                throw('Error!' + err);
            });
            adapter.onData(responseMockData);
        });
    });

    it('Rejects Command if connection is closed', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        const responseMockData = {
            payloadType: testPayloadType,
            payload: 'Response Payload 12!',
            clientMsgId: mockId
        };

        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });

        connection.start().then(() => {
            adapter.onEnd('Test end');
            connection.sendCommand(testPayloadType, testPayload).then(response => {
                throw('Should not resolve sendCommand when adapter is disconnected')
            }).catch((err: IErrorMessage) => {
                expect(err.errorCode).toBe(ConnectTsPromiseErrors.CONNECT_LAYER_ERROR);
                done()
            });
            adapter.onData(responseMockData);
        });
    });

    it('Resolves guaranteedCommand after disconnect events with expected data', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        const responseMockData = {
            payloadType: testPayloadType,
            payload: 'Response Payload 12!',
            clientMsgId: mockId
        };

        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });

        connection.start().then(() => {
            adapter.onEnd('Test end');
            connection.sendGuaranteedCommand(testPayloadType, testPayload).then(response => {
                expect(response).toBe(responseMockData.payload);
                done();
            }).catch((err: IErrorMessage) => {
                throw('Should resolve')
            });
            adapter.onData(responseMockData);
        });
    });

    it('Rejects Command if answer is error', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        const responseMockErrorData = {
            payloadType: testPayloadType,
            payload: 'Error payload!',
            clientMsgId: mockId
        };

        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });

        connection.isError = () => {
            return true
        };

        connection.start().then(() => {
            connection.sendGuaranteedCommand(testPayloadType, testPayload).then(response => {
                throw('Should not resolve sendGuaranteedCommand if res is error')
            }).catch(err => {
                expect(err.errorCode).toBe(ConnectTsPromiseErrors.RESPONSE_ERROR);
                done();
            });
            adapter.onData(responseMockErrorData);
        });
    });

    it('Rejects guaranteedCommand if answer is error', function(done) {
        adapter.connect = () => {
            adapter.onOpen()
        };
        const testPayloadType = 12;
        const testPayload = {info: 'testInfo'};
        const mockId = '123asd';
        const responseMockErrorData = {
            payloadType: testPayloadType,
            payload: 'Error payload!',
            clientMsgId: mockId
        };

        spyOn((<any> connection), 'generateClientMsgId').and.callFake(() => {
            return mockId
        });

        connection.isError = () => {
            return true
        };

        connection.start().then(() => {
            adapter.onEnd('Test end');
            connection.sendGuaranteedCommand(testPayloadType, testPayload).then(response => {
                throw('Should not resolve sendGuaranteedCommand if res is error')
            }).catch(err => {
                expect(err.errorCode).toBe(ConnectTsPromiseErrors.RESPONSE_ERROR);
                done();
            });
            adapter.onData(responseMockErrorData);
        });
    });
});
