/**
 * Handle bad requests.
 *
 * @param {any} req Http request
 * @param {any} res Http response
 * @param {string} message Message to send
 * @returns {boolean}
 */
export function badResponse(req, res, message: string = 'Bad request'): boolean {
    res.status(400).json({ message }).end();
    return false;
}

/**
 * Handle unauthorized requests.
 *
 * @param {any} req Http request
 * @param {any} res Http response
 * @returns {boolean}
 */
export function unauthorizedResponse(req, res, message: string = 'Unauthorized'): boolean {
    res.status(403).json({ message }).end();
    return false;
}

/**
 * Response when validating request has been failed.
 *
 * @param {any} req Http request
 * @param {any} res Http response
 * @param {string} message Message to send
 * @returns {boolean}
 */
export function validationErrorResponse(req, res, message: string = 'Validation error'): boolean {
    res.status(422).json({ message }).end();
    return false;
}

/**
 * Internal server error response with text message.
 *
 * @param {any} req Http request
 * @param {any} res Http response
 * @param {string} message Message to send
 * @returns {boolean}
 */
export function errorMsgResponse(req, res, message: string = 'Internal server error'): boolean {
    res.status(500).json({ message }).end();
    return false;
}

/**
 * Internal server error response with error object.
 *
 * @param {any} req Http request
 * @param {any} res Http response
 * @param {object} error Error object to send
 * @returns {boolean}
 */
export function errorObjResponse(req, res, error: object): boolean {
    res.status(500).json(error).end();
    return false;
}
