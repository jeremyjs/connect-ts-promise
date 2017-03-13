#### High level API: Connect instances specific behavior
Spotware connect-ts-promise v1.x.x provides some methods that can be overwritten and that will handle 
the communication behavior in a promise-based pattern.

```
interface IMessageWOMsgId {
    payloadType: number;
    payload?: any;
}
```
##### payloadType
* The message ID that identifies the response recieved and matches the payloadType of the request sent.
Can be used to generate typed handlers for each response.
##### payload
* The response content that matches the request sent.

---
#### sendCommandWithPayloadtype
```
sendCommandWithPayloadtype(payloadType: number, payload: Object): Promise<IMessageWOMsgId>
```
Returns a promise that will be resolved as soon as one response is handled, and will be rejected if the response is of error type (handled by overwriting the Connect instance method isError). Is also rejected if a network error occurred and the request could not be sent

---
#### sendGuaranteedCommandWithPayloadtype
```
sendGuaranteedCommandWithPayloadtype(payloadType: number, payload: Object): Promise<IMessageWOMsgId>
```
The same as `sendCommandWithPayloadtype` but will be rejected only if the response is error type
or if the connection error is of type 1 or 2 (see `sendGuaranteedMultiresponseCommand`)
