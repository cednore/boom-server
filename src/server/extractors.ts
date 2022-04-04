import * as _ from 'lodash';

import { ISocketRes, IEventRes, IEventErrorRes } from '../..';


/**
 * Resource extractor for socket object.
 *
 * @param {any} socket Socket object
 * @returns {ISocketRes} Socket resource
 */
export function resSocket(socket): ISocketRes {
    return {
        nsp: socket.nsp.name,
        id: socket.id,
        pure_id: socket.id.replace(socket.nsp.name + '#', ''),
        handshake: socket.handshake,
        decoded_token: socket.decoded_token,
    };
}

/**
 * Resource extractor for event object.
 *
 * @param {string?} event Event name
 * @param {array} args Rest args
 * @returns {IEventRes} Event resource
 */
export function resEvent(event?: string, ...args): IEventRes {
    if ('connect' == event) {
        return {
            name: event,
        };
    } else if ('disconnect' == event) {
        return {
            name: event,
            reason: args[0],
        };
    } else if ('error' == event) {
        return {
            name: event,
            error: resEventError(args[0]),
        };
    } else {
        // Determine if this event requires callback
        let callback: boolean = 'function' == (typeof _.last(args));

        return {
            name: event,
            callback,
            args: args.slice(0, args.length - (callback ? 1 : 0)),
        };
    }
}

/**
 * Translating error object for your web app.
 *
 * @param {object} error Error object
 * @returns {IEventErrorRes} Event error resource
 */
export function resEventError(error: object): IEventErrorRes {
    // TODO: Generalize error object for better parsing from your web app.
    return error;
}
