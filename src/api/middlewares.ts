import { Log } from '../log';
import { isdm } from '../routines';
import { unauthorizedResponse, errorObjResponse } from './responses';


/**
 * Authorize incoming request by auth token.
 *
 * @param {string} token The token
 * @returns {function} The middleware
 */
export function authByToken(token: string) {
    return (req, res, next) => {
        if (('Bearer ' + token) !== req.headers['authorization']) {
            return unauthorizedResponse(req, res);
        }

        return next();
    };
}

/**
 * Handler for exceptions for Http API.
 *
 * @param {any} err Error
 * @param {any} req Http request
 * @param {any} res Http response
 * @param {function} next Next closure
 * @returns {any}
 */
export function apiExceptionHandler(err, req, res, next) {
    // Print log
    Log.error('API::', 'Error', {
        url: req.url,
        method: req.method,
    }, true);
    if (isdm()) {
        Log.error('API::', 'Error', { body: JSON.stringify(req.body) });
        console.error(err);
    }

    // Send error response
    return errorObjResponse(req, res, {
        message: `API:: Error; url=${req.url}, method=${req.method}`,
        error: err,
        //request: req.body,
    });
}
