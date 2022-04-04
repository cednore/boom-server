import { IServerOptions, ISocketRecord } from '../..';
import { Log } from './../log';
import { DatabaseDriver } from './database-driver';
import { MySQLDatabase } from './mysql';
import { MemcachedDatabase } from './memcached';


/**
 * Database capsule.
 */
export class Database implements DatabaseDriver {
    /**
     * Database driver.
     *
     * @type {DatabaseDriver}
     */
    private driver: DatabaseDriver;


    /**
     * Constructor.
     *
     * @param {IServerOptions} options Server options
     */
    constructor(private options: IServerOptions) { }


    /**
     * Initialize.
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        // Print log
        Log.info(null, 'Initializing database capsule...'.cyan);

        // Create driver by option
        if ('mysql' == this.options.database.driver) {
            this.driver = new MySQLDatabase(this.options);
        } else if ('memcached' == this.options.database.driver) {
            this.driver = new MemcachedDatabase(this.options);
        } else {
            Log.critical('DB::', 'Database driver is invalid.', {}, true);
            throw new Error('Database driver is invalid.');
        }

        // Initialize driver
        await this.driver.init();

        // Print log
        Log.info(null, 'Database capsule is ready.\n'.cyan);
    }

    /**
     * Create a new socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async create_socket(socket): Promise<boolean> {
        return this.driver.create_socket(socket);
    }

    /**
     * Read a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<ISocketRecord>}
     */
    async read_socket(sid: string): Promise<ISocketRecord> {
        return this.driver.read_socket(sid);
    }

    /**
     * Update a socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async update_socket(socket): Promise<boolean> {
        return this.driver.update_socket(socket);
    }

    /**
     * Delete a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<boolean>}
     */
    async delete_socket(sid: string): Promise<boolean> {
        return this.driver.delete_socket(sid);
    }
}
