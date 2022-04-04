import * as _ from 'lodash';

import { IServerOptions } from '..';

import { Server } from './server';
import { HttpApi } from './api';
import { Database } from './database';
import { Log } from './log';
import { isdm } from './routines';


/**
 * The Boom Server.
 */
export class BoomServer {
    /**
     * Default server options.
     *
     * @type {IServerOptions}
     */
    static defaultOptions: IServerOptions = {
        devmode: false,
        host: null,
        port: 9001,
        secure: false,
        ssl: {
            certPath: '',
            keyPath: '',
            certChainPath: '',
            passphrase: '',
        },
        api: {
            auth: {
                token: '',
            },
            allowCors: false,
            allowOrigin: '',
            allowMethods: '',
            allowHeaders: '',
        },
        socketio: {
            namespaces: {
                '/': {
                },
            },
            options: {
                //
            },
        },
        app: {
            baseURL: 'http://localhost/boom',
            auth: {
                token: '',
            },
        },
        database: {
            driver: '',
            tables: {
                sockets: 'sockets',
            },
            mysql: {
                host: '127.0.0.1',
                port: 3306,
                user: 'root',
                password: '',
                database: 'boom',
            },
            memcached: {
                //
            },
        },
    };

    /**
     * Server options.
     *
     * @type {IServerOptions}
     */
    public options: IServerOptions;

    /**
     * io capsule instance.
     *
     * @type {Server}
     */
    private server: Server;

    /**
     * Http API capsule instance.
     *
     * @type {HttpApi}
     */
    private httpApi: HttpApi;

    /**
     * Database capsule instance.
     *
     * @type {Database}
     */
    private db: Database;


    /**
     * Start the boom-server.
     *
     * @param {object} options Customized server options
     * @returns {Promise<BoomServer>} Promise of this server instance
     */
    async run(options: object): Promise<BoomServer> {
        // Print banner
        this.printBanner();

        // Initialize
        await this.prepareOptions(options)
            .then(() => { this.printStartingUp(); })
            .then(() => this.initDatabase())
            .then(() => this.initServer())
            .then(io => this.initHttpApi(io))
            .catch(error => { // In case error catched while initializing
                // Print log
                if (isdm()) {
                    console.error(error);
                }
                Log.critical('SERVER::', 'Fatal error while starting server.', {}, true);

                // Exit process
                process.exit();
            });

        // Print log
        Log.notice(null, 'boom-server is ready to serve.\n'.cyan, {}, true);

        // Return this
        return this;
    }

    /**
     * Validate server options.
     *
     * @param {IServerOptions} options Server options
     * @returns {boolean} Whether options are valid or not
     */
    static validateOptions(options: IServerOptions): boolean {
        // TODO: Validate options object by pre-defined schema
        return true;
    }

    /**
     * Preapre server options.
     *
     * @param {object} options Customized server options
     * @returns {Promise<void>}
     */
    protected async prepareOptions(options: object): Promise<void> {
        // Prepare options
        this.options = _.merge(BoomServer.defaultOptions, options);

        // Validate options
        if (!BoomServer.validateOptions(this.options)) {
            Log.critical('SERVER::', 'Invalid server options supplied.', {}, true);
            throw new Error('Invalid server options supplied.');
        }

        // Set up devmode env
        process.env.DEVMODE = this.options.devmode ? 'true' : 'false';
    }

    /**
     * Initialize the database capsule.
     *
     * @returns {Promise<void>}
     */
    protected async initDatabase(): Promise<void> {
        this.db = new Database(this.options);
        return this.db.init();
    }

    /**
     * Initialize the io capsule.
     *
     * @returns {Promise<any>}
     */
    protected async initServer(): Promise<any> {
        this.server = new Server(this.db, this.options);
        return this.server.init();
    }

    /**
     * Initialize the Http API capsule.
     *
     * @param {any} io io instance
     * @returns {Promise<void>}
     */
    protected async initHttpApi(io): Promise<void> {
        this.httpApi = new HttpApi(this.server.express, io, this.options);
        return this.httpApi.init();
    }

    /**
     * Banner text.
     */
    protected printBanner(): void {
        console.log('BoomServer');
        console.log('==========');

        console.log(`version ${require('../package.json').version}\n`);
    }

    /**
     * Text shown at startup.
     */
    protected printStartingUp(): void {
        if (this.options.devmode) {
            Log.warning(null, 'Starting server in DEV mode...\n', {}, true);
        } else {
            Log.info(null, 'Starting server...'.cyan, {}, true)
        }
    }
}
