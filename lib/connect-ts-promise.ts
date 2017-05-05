import {Connect, IMessage, ISendCommand} from "connect-ts-api";

export * from 'connect-ts-api';

export interface IErrorMessage {
    errorCode: ConnectTsPromiseErrors;
    description: string;
}

export enum ConnectTsPromiseErrors {
    RESPONSE_ERROR = 1,
    CONNECT_LAYER_ERROR = 2
}

export function getDescriptionFromObject(res: Object): string {
    return Object.keys(res).reduce((prevRes, currKey) => {
        return prevRes + `|${currKey}: ${res[currKey]} |`;
    }, '');
}

export class ConnectPromise extends Connect {
    private checkErrorCallback: (messageToCheck: IMessage) => boolean = () => false;
    private sendFormattedCommand(messageToSend: IMessage, guaranteed: boolean): Promise<IMessage> {
        return new Promise((resolve, reject) => {
            const commandToSend: ISendCommand = {
                message: messageToSend,
                onResponse: (res) => {
                    if (this.checkErrorCallback(res)) {
                        const errorString = getDescriptionFromObject(res);
                        const errToReject: IErrorMessage = {
                            errorCode: ConnectTsPromiseErrors.RESPONSE_ERROR,
                            description: `Server response error: ${errorString}`
                        };
                        reject(errToReject);
                    } else {
                        resolve(res);
                    }
                },
                onError: (err) => {
                    const errToReject: IErrorMessage = {
                        errorCode: ConnectTsPromiseErrors.CONNECT_LAYER_ERROR,
                        description: `Connection Layer error: ${err}`
                    };
                    reject(errToReject);
                },
                guaranteed
            };
            this.sendCommand(commandToSend);
        });
    }
    public sendPromiseCommand(messageToSend: IMessage): Promise<IMessage> {
        return this.sendFormattedCommand(messageToSend, false);
    }

    public sendPromiseGuaranteedCommand(messageToSend: IMessage): Promise<IMessage> {
        return this.sendFormattedCommand(messageToSend, true);
    }

    public setErrorChecker(checkCallback: (messageToCheck: IMessage) => boolean): void {
        this.checkErrorCallback = checkCallback;
    }
}
