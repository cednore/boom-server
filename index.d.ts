export interface INamespaceOption {
    // TODO: Options for namespace customizing, like middlewares and so on
}

export interface IServerOptions {
    devmode: boolean,
    host: null | string,
    port: number,
    secure: boolean,
    ssl: {
        certPath: string,
        keyPath: string,
        certChainPath: string,
        passphrase: string,
    },
    api: {
        auth: {
            token: string,
        },
        allowCors: boolean,
        allowOrigin: string,
        allowMethods: string,
        allowHeaders: string,
    },
    socketio: {
        namespaces: {
            '/': INamespaceOption,
            [key: string]: INamespaceOption,
        },
        options: {
            //
        },
    },
    app: {
        baseURL: string,
        auth: {
            token: string,
        },
    },
    database: {
        driver: string,
        tables: {
            [key: string]: string,
        },
        mysql: {
            host: string,
            port: number,
            user: string,
            password: string,
            database: string,
        },
        memcached: {
            //
        },
    },
}

export interface IErrorPacket {
    message: string,
    event: string,
    response?: {
        status: number,
        data: any,
    },
}

export interface ISocketRes {
    id: string,
    pure_id: string,
    nsp: string,
    handshake: object,
    decoded_token?: object,
}

export interface IEventRes {
    name: string,
    callback?: boolean,
    args?: any[],
    reason?: string,
    error?: any,
}

export interface IEventErrorRes {
    // TODO: Structure for event error object
}

export interface ISocketRecord {
    id: string,
    data: {
        rooms: string[],
        handshake: object,
        decoded_token?: object,
    },
    created_at: number,
    updated_at: number,
}

export interface ISocketRow {
    id: string,
    data: string,
    created_at?: number,
    updated_at: number,
}
