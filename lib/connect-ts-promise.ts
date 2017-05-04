import {Connect, Message, SendCommand} from "connect-ts-api";

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
    private checkErrorCallback: (messageToCheck: Message) => boolean = () => false;
    private sendFormattedCommand(messageToSend: Message, guaranteed: boolean): Promise<Message> {
        return new Promise((resolve, reject) => {
            const commandToSend: SendCommand = {
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
    public sendPromiseCommand(messageToSend: Message): Promise<Message> {
        return this.sendFormattedCommand(messageToSend, false);
    }

    public sendPromiseGuaranteedCommand(messageToSend: Message): Promise<Message> {
        return this.sendFormattedCommand(messageToSend, true);
    }

    public setErrorChecker(checkCallback: (messageToCheck: Message) => boolean): void {
        this.checkErrorCallback = checkCallback;
    }
}
