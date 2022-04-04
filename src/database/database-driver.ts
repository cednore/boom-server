import { ISocketRecord } from '../..';


/**
 * Interface for database drivers.
 */
export interface DatabaseDriver {
    /**
     * Initialize.
     *
     * @returns {Promise<void>}
     */
    init(): Promise<void>;

    /**
     * Create a new socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    create_socket(socket): Promise<boolean>;

    /**
     * Read a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<ISocketRecord>}
     */
    read_socket(sid: string): Promise<ISocketRecord>;

    /**
     * Update a socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    update_socket(socket): Promise<boolean>;

    /**
     * Delete a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<boolean>}
     */
    delete_socket(sid: string): Promise<boolean>;
}
