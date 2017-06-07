import { Connect, IMessage } from "connect-ts-api";
export * from 'connect-ts-api';
export interface IErrorMessage {
    errorCode: ConnectTsPromiseErrors;
    description: string;
}
export declare enum ConnectTsPromiseErrors {
    RESPONSE_ERROR = 1,
    CONNECT_LAYER_ERROR = 2,
}
export declare function getDescriptionFromObject(res: Object): string;
export declare class ConnectPromise extends Connect {
    private checkErrorCallback;
    private sendFormattedCommand(messageToSend, guaranteed);
    sendPromiseCommand(messageToSend: IMessage): Promise<IMessage>;
    sendPromiseGuaranteedCommand(messageToSend: IMessage): Promise<IMessage>;
    setErrorChecker(checkCallback: (messageToCheck: IMessage) => boolean): void;
}
