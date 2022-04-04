import { IServerOptions, ISocketRecord } from '../..';
import { Log } from '../log';
import { DatabaseDriver } from './database-driver';


/**
 * Memcached database driver.
 */
export class MemcachedDatabase implements DatabaseDriver {
    /**
     * Memcached connection.
     *
     * @type {any}
     */
    private _memcached: any;


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
        // TODO:

        // Print log
        Log.info(null, 'Memcached connection is ready.'.cyan);
    }

    /**
     * Create a new socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async create_socket(socket): Promise<boolean> {
        // TODO:
        return true;
    }

    /**
     * Read a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<ISocketRecord>}
     */
    async read_socket(sid: string): Promise<ISocketRecord> {
        // TODO:
        return {
            id: '',
            data: {
                rooms: [],
                handshake: {},
                decoded_token: {},
            },
            created_at: 0,
            updated_at: 0,
        };
    }

    /**
     * Update a socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async update_socket(socket): Promise<boolean> {
        // TODO:
        return true;
    }

    /**
     * Delete a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<boolean>}
     */
    async delete_socket(sid: string): Promise<boolean> {
        // TODO:
        return true;
    }
}
