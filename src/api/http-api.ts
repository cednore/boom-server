import * as _ from 'lodash';

import { IServerOptions } from '../..';
import { Log } from '../log';
import { authByToken, apiExceptionHandler } from './middlewares';
import {
    validateEmitRequest,
    validateJoinRequest,
    validateLeaveRequest,
} from './validators';
import { validationErrorResponse } from './responses';


/**
 * Http API capsule.
 */
export class HttpApi {
    /**
     * Constructor.
     *
     * @param {any} express Express instance
     * @param {any} io Socket.io instance
     * @param {IServerOptions} options Server options
     */
    constructor(private express, private io, private options: IServerOptions) { }


    /**
     * Initialize.
     */
    init(): void {
        // Print log
        Log.info(null, 'Initializing Http API capusule...'.cyan);

        // Set up middlewares
        this.setupMiddlewares();

        // Set up routes
        this.setupRoutes();

        // Set up error handlers
        this.setupErrorHandlers();

        // Print log
        Log.info(null, 'Http API capsule is ready.\n'.cyan);
    }

    /**
     * Set up middlewares.
     */
    protected setupMiddlewares(): void {
        // Parse application/x-www-form-urlencoded
        this.express.use(require('body-parser').urlencoded({ extended: true }));

        // Parse application/json
        this.express.use(require('body-parser').json());

        // Check authorization token
        if (this.options.api.auth.token) {
            this.express.use(authByToken(this.options.api.auth.token));
        }

        // Apply CORS options
        if (this.options.api.allowCors) {
            this.express.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', this.options.api.allowOrigin);
                res.header('Access-Control-Allow-Methods', this.options.api.allowMethods);
                res.header('Access-Control-Allow-Headers', this.options.api.allowHeaders);
                next();
            });
        }

        // Print log
        Log.notice(null, 'Middlewares for Http API are set up.');
    }

    /**
     * Set up API routes.
     */
    protected setupRoutes(): void {
        // Root
        this.express.get(
            '/',
            (req, res) => this.index(req, res)
        );

        // Get status
        this.express.get(
            '/status',
            (req, res) => this.status(req, res)
        );

        // Emit
        this.express.post(
            '/emit',
            (req, res) => this.emit(req, res)
        );

        // Join
        this.express.post(
            '/join',
            (req, res) => this.join(req, res)
        );

        // Leave
        this.express.delete(
            '/leave',
            (req, res) => this.leave(req, res)
        );

        // Print log
        Log.notice(null, 'API routes are set up.');
    }

    /**
     * Set up error handlers.
     */
    protected setupErrorHandlers(): void {
        this.express.use(apiExceptionHandler);
    }


    /**
     * Outputs a simple message to show that the server is running.
     *
     * @param {any} req Http request
     * @param {any} res Http response
     * @returns {any}
     */
    protected index(req, res) {
        // Print log
        Log.info('API::', 'index', { body: JSON.stringify(req.body) });

        // TODO: Add response body
        res.end();
    }

    /**
     * Get the status of the server.
     *
     * @param {any} req Http request
     * @param {any} res Http response
     * @returns {any}
     */
    protected status(req, res) {
        // Print log
        Log.info('API::', 'status', { body: JSON.stringify(req.body) });

        res.json({
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            io: {
                subscription_count: this.io.engine.clientsCount,
                namespaces: _.keys(this.io.nsps),
            },
        }).end();
    }

    /**
     * Emit an event.
     *
     * @param {any} req Http request
     * @param {any} res Http response
     * @returns {any}
     */
    protected emit(req, res) {
        // Print log
        Log.info('API::', 'emit', { body: JSON.stringify(req.body) });

        // TODO: Add processing callback feature

        // Validate requested data or return error
        if (!validateEmitRequest(req.body)) {
            return validationErrorResponse(req, res);
        }

        // Extract parameters
        const { nsp, source, flags, rooms, event, args } = req.body;

        // Process
        if (source) { // If source is present
            // Get source socket
            let socket = this.io.of(nsp).sockets[source];

            // Return error if specified socket is not exisiting or invalid
            if (undefined === socket) {
                return validationErrorResponse(req, res, 'Non-existing socket id.');
            }

            // Apply flags
            if (true == flags.volatile) {
                socket = socket.volatile;
            }
            if (true == flags.broadcast) {
                socket = socket.broadcast;
            }
            if (undefined !== flags.compress) {
                socket = socket.compress(flags.compress);
            }
            if (undefined !== flags.binary) {
                socket = socket.binary(flags.binary);
            }

            // Apply destination rooms
            rooms.forEach(room => { socket = socket.to(room); });

            // Emit event
            socket.emit(event, ...args);
        } else { // If source is not present
            // Get namespace
            let namespace = this.io.of(nsp);

            // Apply flags
            if (true == flags.volatile) {
                namespace = namespace.volatile;
            }
            if (undefined !== flags.binary) {
                namespace = namespace.binary(flags.binary);
            }

            // Apply destination rooms
            rooms.forEach(room => { namespace = namespace.to(room); });

            // Emit event
            namespace.emit(event, ...args);
        }

        // Send success status response
        res.status(200).json(true).end();
    }

    /**
     * Join a socket into a room.
     *
     * @param {any} req Http request
     * @param {any} res Http response
     * @returns {any}
     */
    protected join(req, res) {
        // Print log
        Log.info('API::', 'join', { body: JSON.stringify(req.body) });

        // Validate requested data or return error
        if (!validateJoinRequest(req.body)) {
            return validationErrorResponse(req, res);
        }

        // Extract parameters
        const { nsp, socket: sid, rooms } = req.body;

        // Get socket
        let socket = this.io.of(nsp).sockets[sid];

        // Return error if specified socket is not exisiting or invalid
        if (undefined === socket) {
            return validationErrorResponse(req, res, 'Non-existing socket id.');
        }

        // Join socket into requested rooms
        socket.join(rooms, error => { throw error; });

        // Send success status response
        res.status(200).json(true).end();
    }

    /**
     * Let a socket leave a room.
     *
     * @param {any} req Http request
     * @param {any} res Http response
     * @returns {any}
     */
    protected leave(req, res) {
        // Print log
        Log.info('API::', 'leave', { body: JSON.stringify(req.body) });

        // Validate requested data or return error
        if (!validateLeaveRequest(req.body)) {
            return validationErrorResponse(req, res);
        }

        // Extract parameters
        const { nsp, socket: sid, room } = req.body;

        // Get socket
        let socket = this.io.of(nsp).sockets[sid];

        // Return error if specified socket is not exisiting or invalid
        if (undefined === socket) {
            return validationErrorResponse(req, res, 'Non-existing socket id.');
        }

        // Leave socket from requested room
        socket.leave(room, error => { throw error; });

        // Send success status response
        res.status(200).json(true).end();
    }
}
