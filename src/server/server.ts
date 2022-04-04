import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { SecureContextOptions } from 'tls';
import * as express from 'express';
import * as io from 'socket.io';
import * as _ from 'lodash';

import { IServerOptions } from '../..';
import { Database } from '../database';
import { Log } from '../log';
import {
    reportConnect,
    reportEvent,
    reportDisconnect,
    reportDisconnecting,
    reportError,
} from './reporters';


/**
 * socket.io capsule.
 */
export class Server {
    /**
     * The http server instance.
     *
     * @type {http.Server | https.Server}
     */
    public http: http.Server | https.Server;

    /**
     * The express server app instance.
     *
     * @type {any}
     */
    public express: any;

    /**
     * The socket.io server instance.
     *
     * @type {any}
     */
    public io: any;

    /**
     * The axios request client instance.
     *
     * @type {any}
     */
    public axios: any;

    /**
     * SSL options.
     *
     * @type {SecureContextOptions}
     */
    protected sslOptions: SecureContextOptions;


    /**
     * Constructor.
     *
     * @param {Database} db Database capsule
     * @param {IServerOptions} options Server options
     */
    constructor(private db: Database, private options: IServerOptions) { }


    /**
     * Initialize.
     *
     * @returns {any} io server instance
     */
    init(): any {
        // Print log
        Log.info(null, 'Initializing io capsule...'.cyan);

        // Init axios instance
        this.initAxios();

        // Init servers
        if (this.options.secure) {
            this.loadSSL();
            this.initServers(true);
        } else {
            this.initServers(false);
        }

        // Print log
        Log.info(null, 'io capsule is ready.\n'.cyan);

        // Return io server instance
        return this.io;
    }

    /**
     * Initialize axios client instance.
     */
    protected initAxios(): void {
        // Import axios
        this.axios = require('axios');

        // Set global parameters
        this.axios.defaults.baseURL = this.options.app.baseURL;
        this.axios.defaults.headers.common['Accept'] = 'application/json';
        this.axios.defaults.responseType = 'json';

        // Set authorization header only if auth token is not null or empty string
        if (this.options.app.auth.token) {
            this.axios.defaults.headers.common['Authorization'] =
                'Bearer ' + this.options.app.auth.token;
        }

        // Print log
        Log.notice(null, 'axios client is ready.');
    }

    /**
     * Load SSL 'key' & 'cert' files if https is enabled.
     */
    protected loadSSL(): void {
        // Reject if ssl options are invalid
        if (!this.options.ssl.certPath || !this.options.ssl.keyPath) {
            Log.critical('IO::', 'SSL paths are missing in server config.', {}, true);
            throw new Error('SSL paths are missing in server config.');
        }

        // Prepare ssl options
        this.sslOptions = {
            cert: fs.readFileSync(this.options.ssl.certPath),
            key: fs.readFileSync(this.options.ssl.keyPath),
            ca: (this.options.ssl.certChainPath)
                ? fs.readFileSync(this.options.ssl.certChainPath)
                : '',
            passphrase: this.options.ssl.passphrase,
        };

        // Print log
        Log.notice(null, 'SSL options are loaded.');
    }

    /**
     * Initialize servers for socket.io.
     *
     * @param {boolean} secure Whether use SSL or not
     */
    protected initServers(secure: boolean): void {
        // Create express server app instance
        this.express = express();
        Log.notice(null, 'express app is ready.');

        // Create http server
        if (secure) {
            this.http = https.createServer(this.sslOptions, this.express);
            Log.notice(null, 'https server is ready.');
        } else {
            this.http = http.createServer(this.express);
            Log.notice(null, 'http server is ready.');
        }

        // Create a new socket.io server
        this.io = io(this.http, this.options.socketio.options);
        Log.notice(null, 'socket.io server is ready.');

        // Set up namespace settings
        this.setupNamespaces();

        // Start listening
        this.http.listen(this.getPort(), this.options.host, () => {
            let host = this.options.host || 'localhost';
            Log.notice(null,
                `Started listening at ${host.green} on port ${this.getPort().toString().green}\n`,
            {}, true);
        });
    }

    /**
     * Sanitize the port number from any extra characters.
     *
     * @returns {number}
     */
    protected getPort(): number {
        let portRegex = /([0-9]{2,5})[\/]?$/;
        let portToUse = String(this.options.port).match(portRegex);
        return Number(portToUse[1]);
    }

    /**
     * Set up namespace settings.
     */
    protected setupNamespaces(): void {
        // Set up event reporters
        _.keys(this.options.socketio.namespaces).forEach(nsp => {
            // Apply connect reporter
            this.io.of(nsp).use(reportConnect(this.axios, this.db));

            // Events
            this.io.of(nsp).on('connect', socket => {
                // Apply event reporter
                socket.use(reportEvent(socket, this.axios, this.db));

                // Apply disconnect reporter
                socket.on('disconnect',
                    reason => reportDisconnect(socket, reason, this.axios, this.db)
                );

                // Apply disconnecting reporter
                socket.on('disconnecting',
                    reason => reportDisconnecting(socket, reason, this.axios, this.db)
                );

                // Apply error reporter
                socket.on('error',
                    error => reportError(socket, error, this.axios, this.db)
                );
            });

            // Print log
            Log.notice(null, `Namespace ${nsp.green} is set up.`);
        });
    }
}
