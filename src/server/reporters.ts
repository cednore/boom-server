import * as _ from 'lodash';

import { IErrorPacket, ISocketRes, IEventRes } from '../..';
import { Log } from '../log';
import { ioevn, ionsp, isdm } from '../routines';
import { Database } from '../database';
import { resSocket, resEvent } from './extractors';


/**
 * Middleware to report every new socket connection to web app.
 *
 * @param {any} axios axios client instance
 * @param {Database} db Database capsule
 * @returns {function} The middleware
 */
export function reportConnect(axios, db: Database) {
    return (socket, next) => {
        // Print log
        Log.info('IO::', 'Connected', { sid: socket.id.green });

        // Report to db
        db.create_socket(socket).catch(error => dbExceptionHandler(socket, error))
            .finally(() => {
                // Prepare request body
                let body = { socket: resSocket(socket), event: resEvent('connect') };

                // Report to web app
                axios.post(ionsp(socket.nsp.name) + '/connect', body)
                    .catch(error => appExceptionHandler(body.socket, body.event, error));
            });

        // Run next closure
        next();
    };
}

/**
 * Event handler to report socket disconnect to web app.
 *
 * @param {any} socket Socket object
 * @param {string} reason Reason of disconnection
 * @param {any} axios axios client instance
 * @param {Database} db Database capsule
 * @returns {void}
 */
export function reportDisconnect(socket, reason: string, axios, db: Database): void {
    // Print log
    Log.info('IO::', 'Disconnected', { sid: socket.id.green });

    // Report to db
    db.delete_socket(socket.id).catch(error => dbExceptionHandler(socket, error))
        .finally(() => {
            // Prepare request body
            let body = { socket: resSocket(socket), event: resEvent('disconnect', reason) };

            // Report to web app
            axios.post(ionsp(socket.nsp.name) + '/disconnect', body)
                .catch(error => appExceptionHandler(body.socket, body.event, error));
        });
}

/**
 * Event handler to report socket disconnecting to web app.
 *
 * @param {any} socket Socket object
 * @param {string} reason Reason of disconnection
 * @param {any} axios axios client instance
 * @param {Database} db Database capsule
 * @returns {void}
 */
export function reportDisconnecting(socket, reason: string, axios, db: Database): void {
    // Print log
    //Log.info('IO::', 'Disconnecting', { sid: socket.id.green });

    // Report to db
    db.update_socket(socket).catch(error => dbExceptionHandler(socket, error))
        .finally(() => {
            // Prepare request body
            let body = { socket: resSocket(socket), event: resEvent('disconnecting', reason) };

            // Report to web app
            axios.post(ionsp(socket.nsp.name) + '/disconnecting', body)
                .catch(error => appExceptionHandler(body.socket, body.event, error));
        });
}

/**
 * Event handler to report socket error to web app.
 *
 * @param {any} socket Socket object
 * @param {any} error Error object
 * @param {any} axios axios client instance
 * @param {Database} db Database capsule
 * @returns {void}
 */
export function reportError(socket, error, axios, db: Database): void {
    // Print log
    Log.info('IO::', 'Error', { sid: socket.id.green }, true);
    if (isdm()) {
        console.error(error);
    }

    // Report to db
    db.update_socket(socket).catch(error => dbExceptionHandler(socket, error))
        .finally(() => {
            // Prepare request body
            let body = { socket: resSocket(socket), event: resEvent('error', error) };

            // Report to web app
            axios.post(ionsp(socket.nsp.name) + '/error', body)
                .catch(error => appExceptionHandler(body.socket, body.event, error));
        });
}

/**
 * Middleware to report all socket events to web app.
 *
 * @param {any} socket Socket object
 * @param {any} axios axios client instance
 * @param {Database} db Database capsule
 * @returns {function} The middleware
 */
export function reportEvent(socket, axios, db: Database) {
    return (packet, next) => {
        // Print log
        Log.info('IO::', 'Event', { sid: socket.id.green, evt: packet[0].cyan });

        // Report to db
        db.update_socket(socket).catch(error => dbExceptionHandler(socket, error))
            .finally(() => {
                // Determine if this event requires callback
                let is_callback: boolean = 'function' == (typeof _.last(packet));

                // Prepare request body
                let body = { socket: resSocket(socket), event: resEvent(...packet) };

                // Report to web app and send back ack data if callback is available
                axios.post(ionsp(socket.nsp.name) + '/' + ioevn(packet[0]), body)
                    .then(({ data }) => (is_callback ? (_.last(packet))(data) : null))
                    .catch(error => next(new Error(JSON.stringify(
                        appExceptionHandler(body.socket, body.event, error)
                    ))));
            });

        // Run next closure
        //next();
    };
}

/**
 * Handler for exceptions from database.
 *
 * @param {any} socket Socket object
 * @param {any} error Reason of error
 * @returns {void}
 */
export function dbExceptionHandler(socket, error): void {
    // Extract error details
    let { errno, code, sqlState } = error;

    if (sqlState && errno) { // If mysql error
        // Print log
        Log.info('DB::', 'Error', {
            sid: socket.id.green,
            errno: errno.cyan,
            code: code.cyan,
            sqlState: sqlState.grey,
        }, true);
        if (isdm()) {
            console.error(error);
        }
    }
}

/**
 * Handler for exceptions from web app.
 *
 * @param {ISocketRes} socket Socket resource
 * @param {IEventRes} event Event resource
 * @param {any} error Reason of error
 * @returns {IErrorPacket} Error object to send on error packet
 */
export function appExceptionHandler(socket: ISocketRes, event: IEventRes, error): IErrorPacket {
    // Extract response object
    let { response, errno } = error;

    if (response) {
        if (404 == response.status) {
            Log.warning('APP::', 'Error', {
                status: "404".cyan,
                sid: socket.id.green,
                url: response.config.url.red,
            });

            if (-1 === undefined_routes.findIndex(elem => response.config.url === elem)) {

                Log.warning('APP::', 'Event listener route is not defined on your web app', {
                    url: response.config.url.red
                });

                undefined_routes.push(response.config.url);
            }

            return {
                message: 'ERR_APP_NO_LISTENER',
                event: event.name,
            };
        } else {
            Log.warning('APP::', 'Error', {
                url: response.config.url.red,
                status: response.status.cyan,
                body: JSON.stringify(response.data).grey,
            });

            return {
                message: 'ERR_APP_UNSUCCESSFUL',
                event: event.name,
                response: {
                    status: response.status,
                    data: response.data,
                },
            };
        }
    } else if (errno) {
        if ('ECONNREFUSED' == errno) {
            Log.error('APP::', 'ECONNREFUSED', { url: error.config.url.yellow });

            return {
                message: 'ERR_APP_CONN_REFUSED',
                event: event.name,
            };
        }
    } else {
        Log.error('APP::', 'Unrecognized exception', {}, true);
        if (isdm()) {
            console.error(error);
        }

        return {
            message: 'ERR_APP_UNKNOWN',
            event: event.name,
        };
    }
}

/**
 * History of undefined routes.
 *
 * @type {array<string>}
 */
export let undefined_routes: string[] = [
    //
];
