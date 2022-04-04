import * as mysql from 'mysql2/promise';

import { IServerOptions, ISocketRecord, ISocketRow } from '../..';
import { Log } from '../log';
import { DatabaseDriver } from './database-driver';


/**
 * MySQL database driver.
 */
export class MySQLDatabase implements DatabaseDriver {
    /**
     * MySQL connection.
     *
     * @type {any}
     */
    private _mysql: any;


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
        // Create connection
        this._mysql = await mysql.createConnection({
            host: this.options.database.mysql.host,
            port: this.options.database.mysql.port,
            user: this.options.database.mysql.user,
            password: this.options.database.mysql.password,
            database: this.options.database.mysql.database,
        });

        // Print log
        Log.notice(null, 'MySQL connection is ready.');

        // Reset sockets table
        await this._mysql.query(`DROP TABLE IF EXISTS ${this.options.database.tables.sockets}`);
        await this._mysql.query(`CREATE TABLE ${this.options.database.tables.sockets} (
            \`id\` varchar(128) not null,
            \`created_at\` timestamp null,
            \`updated_at\` timestamp null,
            \`data\` varchar(20000) not null,
            PRIMARY KEY (\`id\`)
        ) default character set utf8 collate 'utf8_unicode_ci' engine = MEMORY`);

        // Print log
        Log.notice(null, `Reset table "${this.options.database.tables.sockets.green}".`);
    }

    /**
     * Create a new socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async create_socket(socket): Promise<boolean> {
        // Prepare new record to insert
        const record: ISocketRow = {
            id: socket.id,
            data: JSON.stringify({
                rooms: socket.rooms,
                handshake: socket.handshake,
                decoded_token: socket.decoded_token,
            }),
            created_at: mysql.raw('NOW()'),
            updated_at: mysql.raw('NOW()'),
        };

        // Run insert query
        await this._mysql.query(
            `INSERT INTO ${this.options.database.tables.sockets} SET ?`,
            [ record ]
        );

        // Return
        return true;
    }

    /**
     * Read a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<ISocketRecord>}
     */
    async read_socket(sid: string): Promise<ISocketRecord> {
        // Run select query and fetch results
        const [ rows, fields ] = await this._mysql.query(
            `SELECT * FROM ${this.options.database.tables.sockets}  WHERE \`id\` = ?`,
            [ sid ]
        );

        // Return
        return {
            id: rows[0].id,
            data: JSON.parse(rows[0].data),
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at,
        };
    }

    /**
     * Update a socket record.
     *
     * @param {any} socket Socket object
     * @returns {Promise<boolean>}
     */
    async update_socket(socket): Promise<boolean> {
        // Prepare record to update
        const record: ISocketRow = {
            id: socket.id,
            data: JSON.stringify({
                rooms: socket.rooms,
                handshake: socket.handshake,
                decoded_token: socket.decoded_token,
            }),
            updated_at: mysql.raw('NOW()'),
        };

        // Run update query
        await this._mysql.query(
            `UPDATE ${this.options.database.tables.sockets} SET ? WHERE \`id\` = ?`,
            [ record, socket.id ]
        );

        // Return
        return true;
    }

    /**
     * Delete a socket record.
     *
     * @param {string} sid Socket id
     * @returns {Promise<boolean>}
     */
    async delete_socket(sid: string): Promise<boolean> {
        // Run delete query
        await this._mysql.query(
            `DELETE FROM ${this.options.database.tables.sockets} WHERE \`id\` = ?`,
            [ sid ]
        );

        // Return
        return true;
    }
}
