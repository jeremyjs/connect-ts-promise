import {
    Connect, IMessageWOMsgId, ISendRequestError, IMessage,
    IMultiResponseParams
} from "connect-ts-api";

export interface IErrorMessage {
    errorCode: ConnectTsPromiseErrors;
    description: string;
}

export enum ConnectTsPromiseErrors {
    RESPONSE_ERROR = 1,
    CONNECT_LAYER_ERROR = 2
}

export class ConnectPromise extends Connect {
    /**
     * @deprecated Too consumer-specific. can be confusing. Just use sendGuaranteedCommandWithPayloadtype and handle the
     * response on consumer.
     */
    public sendGuaranteedCommand(payloadType: number, params) {
        return this.sendGuaranteedCommandWithPayloadtype(payloadType, params).then(msg => msg.payload);
    }

    /**
     * @deprecated Too consumer-specific. can be confusing. Just use sendCommandWithPayloadtype and handle the
     * response on consumer.
     */
    public sendCommand(payloadType: number, params) {
        return this.sendCommandWithPayloadtype(payloadType, params).then(msg => msg.payload);
    }

    private getMultiresponseCommand(payloadType: number, payload: Object, resolve, reject): IMultiResponseParams {
        return {
            payloadType,
            payload,
            onMessage: result => {
                if (this.isError(result)) {
                    const errToReject: IErrorMessage = {
                        errorCode: ConnectTsPromiseErrors.RESPONSE_ERROR,
                        description: 'Message is error type'
                    };
                    reject(errToReject);
                } else {
                    resolve(result);
                }
                return true;
            },
            onError: (err: ISendRequestError) => {
                const errToReject: IErrorMessage = {
                    errorCode: ConnectTsPromiseErrors.CONNECT_LAYER_ERROR,
                    description: err.description
                };
                reject(errToReject);
            }
        }
    }

    public sendCommandWithPayloadtype(payloadType: number, payload: Object): Promise<IMessageWOMsgId> {
        return new Promise((resolve, reject) => {
            const multiresponseCommand = this.getMultiresponseCommand(payloadType, payload, resolve, reject);
            this.sendMultiresponseCommand(multiresponseCommand);
        });
    }

    public sendGuaranteedCommandWithPayloadtype(payloadType: number, payload: Object): Promise<IMessageWOMsgId> {
        return new Promise((resolve, reject) => {
            const multiresponseCommand = this.getMultiresponseCommand(payloadType, payload, resolve, reject);
            this.sendGuaranteedMultiresponseCommand(multiresponseCommand);
        });
    }

    public isError(messageToCheck: IMessage): boolean {
        //Overwrite this method by your buisness logic
        return false;
    }
}
