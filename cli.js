// Import libs
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const program = require('commander');
const inquirer = require('inquirer');
const _ = require('lodash');
const slug = require('slug');

const { Log } = require('./lib/log');

// Load boom-server instance
const server = require('./lib');

// TODO: Prints ascii-art banner

// Set dev mode as true to print error logs
process.env.DEVMODE = 'true';

// Initialize version and usage
program.version(require('./package.json').version)
    .usage('<command> [options]');

// Add start command
program.command('start')
    .description('Starts the server.')
    .option('-c, --config <file>', 'The config file to use.')
    .option('-l, --dir <dir>', 'The working directory to use.')
    .option('-f, --force', 'If a server is already running, stop it and restart.')
    .option('-d, --dev', 'Run in development mode.')
    .action(start)
    .on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('  $ boom-server start');
        console.log('  $ boom-server start --dev');
        console.log('  $ boom-server start --config server.json --force');
        console.log('  $ boom-server start -c boom.json -l ./config -d');
    });

// Add stop command
program.command('stop')
    .description('Stops currently running server.')
    .option('-c, --config <file>', 'The config file being used by running server.')
    .option('-l, --dir <dir>', 'The working directory to use.')
    .action(stop)
    .on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('  $ boom-server stop');
        console.log('  $ boom-server stop --config server.json');
        console.log('  $ boom-server stop -c boom.json -l ./config');
    });

// Add init command
program.command('init [file]')
    .description('Initialize a custom config file in current directory.')
    .action(init)
    .on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('  $ boom-server init');
        console.log('  $ boom-server init server.json');
        console.log('  $ boom-server init server.json');
    });

// Add nsp:register command
program.command('nsp:register <name>')
    .description('Register a namespace to serve.')
    .option('-c, --config <file>', 'The config file to use.')
    .option('-l, --dir <dir>', 'The working directory to use.')
    .action(register)
    .on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('  $ boom-server nsp:register namespaceBlog');
        console.log('  $ boom-server nsp:register nsp12345 --config server.json');
        console.log('  $ boom-server nsp:register new_nsp123456 -c boom.json -l ./config');
    });

// Add nsp:unregister command
program.command('nsp:unregister <name>')
    .description('Unregister a namespace.')
    .option('-c, --config <file>', 'The config file to use.')
    .option('-l, --dir <dir>', 'The working directory to use.')
    .action(unregister)
    .on('--help', function() {
        console.log('');
        console.log('Examples:');
        console.log('  $ boom-server nsp:unregister namespaceBlog');
        console.log('  $ boom-server nsp:unregister nsp12345 --config server.json');
        console.log('  $ boom-server nsp:unregister new_nsp123456 -c boom.json -l ./config');
    });

// Error handler for unknown commands
program.on('command:*', function() {
    console.error('Invalid command: %s\nSee --help for a list of available commands.',
        program.args.join(' ')
    );
    process.exit(1);
});

// Start parsing
program.parse(process.argv);


/**
 * `start` command handler.
 *
 * @param {array} args Arguments passed from commander
 * @returns {void}
 */
function start(...args) {
    // Check if additional parameter supplied
    if (1 != args.length) {
        Log.critical('CLI::', 'Error on command! '
            + `Run ${"boom-server start --help".green} to check out correct cli syntax.`
        );
        return;
    }

    // Prepare config file path and lock file path
    const configfile = getConfigPath(args[0].config, args[0].dir);
    const lockfile = path.join(
        path.dirname(configfile),
        path.basename(configfile, '.json') + '.lock'
    );

    // Try accessing config file
    fs.access(configfile, fs.constants.F_OK, error => {
        // If access failed
        if (error) {
            Log.critical('CLI::', 'The config file cound not be found.');
            return false;
        }

        // Read options
        var options = loadJsonFile(configfile);

        // Set dev mode
        options.devmode = args[0].dev || options.devmode || false;

        // Check if lock file exists
        if (fs.existsSync(lockfile)) {
            // Load lock process id
            const lockprocess = parseInt(loadJsonFile(lockfile).process);

            // If there is valid lock process in lock file
            if (lockprocess) { try {
                // Check if process id in the lock file is existing now
                if (process.kill(lockprocess, 0)) {
                    if (args[0].force) { // If --force flag supplied
                        // Prints warning
                        Log.warning('CLI::', `Closing process ${lockprocess.toString().green} `
                            + `as you used the ${'--force'.yellow} option.`
                        );

                        // Kill lock process
                        process.kill(lockprocess);
                    } else {
                        Log.critical('CLI::', 'There is already a server running! '
                            + `Use the option ${'--force'.yellow} to stop it and start another one.`
                        );
                        return false;
                    }
                }
            } catch { /* The process in the lock file doesn't exist, so continue */ } }
        }

        // Write lock file
        fs.writeFile(lockfile, JSON.stringify({ process: process.pid }, null, '\t'), error => {
            if (error) { // If error occured while writing
                Log.critical('CLI::', 'Cannot write lock file.');
                return false;
            }

            // Set process event handlers to unlink
            process.on('exit', () => { try {
                Log.debug('');
                Log.info(null, 'Server is shut down.'.cyan);
                fs.unlinkSync(lockfile);
            } catch { } });
            process.on('SIGINT', process.exit);
            process.on('SIGHUP', process.exit);
            process.on('SIGTERM', process.exit);

            // Run
            server.run(options);
        });
    });
}

/**
 * `stop` command handler.
 *
 * @param {array} args Arguments passed from commander
 * @returns {void}
 */
function stop(...args) {
    // Check if additional parameter supplied
    if (1 != args.length) {
        Log.critical('CLI::', 'Error on command! '
            + `Run ${"boom-server stop --help".green} to check out correct cli syntax.`
        );
        return;
    }

    // Prepare config file path and lock file path
    const configfile = getConfigPath(args[0].config, args[0].dir);
    const lockfile = path.join(
        path.dirname(configfile),
        path.basename(configfile, '.json') + '.lock'
    );

    // Check if lock file exists
    if (fs.existsSync(lockfile)) {
        // Load lock process id
        const lockprocess = parseInt(loadJsonFile(lockfile).process);

        // If there is valid lock process in lock file
        if (lockprocess) {
            try {
                // Kill lock process
                process.kill(lockprocess);

                // Unlink lock file
                fs.unlinkSync(lockfile);

                // Print log
                Log.notice(null, 'Closed the running server.');
            } catch (err) {
                console.error(err);
                Log.critical('CLI::', 'No running servers to close.');
            }
        }
    } else {
        Log.critical('CLI::', 'Could not find any lock file.');
    }
}

/**
 * `init` command handler.
 *
 * @param {string} file Requested file name
 * @param {Command} cmd Commander extra
 * @returns {void}
 */
function init(file, cmd) {
    // Prepare file name
    file = file ? file : 'boom-server.config.json';

    // Prompt questions by inquirer
    inquirer.prompt([
        {
            name: 'devmode',
            message: 'Do you want to run this server in development mode?',
            type: 'confirm',
            default: false,
        }, {
            name: 'port',
            message: 'Which port would you like to serve from?',
            default: 9001,
        }, {
            name: 'protocol',
            message: 'Will you be serving on http or https?',
            type: 'list',
            choices: ['http', 'https'],
        }, {
            name: 'ssl_certPath',
            message: 'Enter the path to your SSL cert file:',
            when: options => 'https' == options.protocol,
        }, {
            name: 'ssl_keyPath',
            message: 'Enter the path to your SSL key file:',
            when: options => 'https' == options.protocol,
        }, {
            name: 'api_auth_token',
            message: 'Enter the token to authorize requests from your web app:',
            default: '',
        }, {
            name: 'api_corsAllow',
            message: 'Do you want to setup cross domain access to the API?',
            type: 'confirm',
            default: false,
        }, {
            name: 'api_allowOrigin',
            message: 'Specify the URI that may access the API:',
            default: 'http://localhost:80',
            when: options => true == options.api_corsAllow,
        }, {
            name: 'api_allowMethods',
            message: 'Enter the HTTP methods that are allowed for CORS:',
            default: 'GET, POST',
            when: options => true == options.api_corsAllow,
        }, {
            name: 'api_allowHeaders',
            message: 'Enter the HTTP headers that are allowed for CORS:',
            default: 'Origin, Content-Type, X-Auth-Token, X-Requested-With, Accept, Authorization, X-CSRF-TOKEN, X-Socket-Id',
            when: options => true == options.api_corsAllow,
        }, {
            name: 'app_baseUrl',
            message: 'Enter the base url to the boom route on your web app:',
            default: 'http://localhost/boom',
        }, {
            name: 'app_auth_token',
            message: 'Enter the token for your web app to authorize requests from this boom-server:',
            default: '',
        }, {
            name: 'db_driver',
            message: 'Which database driver you want to use?',
            type: 'list',
            choices: ['mysql', 'memcached'],
        }, {
            name: 'db_mysql_host',
            message: 'Enter the host address to the mysql server:',
            default: '127.0.0.1',
            when: options => 'mysql' == options.db_driver,
        }, {
            name: 'db_mysql_port',
            message: 'Enter the port number to the mysql server:',
            default: '3306',
            when: options => 'mysql' == options.db_driver,
        }, {
            name: 'db_mysql_user',
            message: 'Enter the user name to connect the mysql server:',
            default: 'root',
            when: options => 'mysql' == options.db_driver,
        }, {
            name: 'db_mysql_password',
            type: 'password',
            mask: null,
            message: 'Enter the user password to connect the mysql server:',
            when: options => 'mysql' == options.db_driver,
        }, {
            name: 'db_mysql_database',
            message: 'Enter the db schema name on the mysql server:',
            when: options => 'mysql' == options.db_driver,
        }, {
            name: 'file',
            message: 'Enter the file name of your config file:',
            default: file,
        }
    ]).then(data => {
        // Prepare options to save
        var options = {
            devmode: data.devmode || false,
            host: null,
            port: parseInt(data.port) || 9001,
            secure: 'https' == data.protocol,
            ssl: {
                certPath: data.ssl_certPath || '',
                keyPath: data.ssl_keyPath || '',
                certChainPath: '',
                passphrase: '',
            },
            socketio: {
                namespaces: {
                    '/': {
                        //
                    },
                },
                options: {
                    //
                },
            },
            api: {
                auth: {
                    token: data.api_auth_token || '',
                },
                allowCors: data.corsAllow || false,
                allowOrigin: data.allowOrigin || '',
                allowMethods: data.allowMethods || '',
                allowHeaders: data.allowHeaders || '',
            },
            app: {
                baseURL: data.app_baseUrl || 'http://localhost/boom',
                auth: {
                    token: data.app_auth_token || '',
                },
            },
            database: {
                driver: data.db_driver || '',
                tables: {
                    sockets: 'sockets',
                    //
                },
                mysql: {
                    host: data.db_mysql_host || '127.0.0.1',
                    port: parseInt(data.db_mysql_port) || 3306,
                    user: data.db_mysql_user || 'root',
                    password: data.db_mysql_password || '',
                    database: data.db_mysql_database || 'boom',
                },
                memcached: {
                    //
                },
            },
        };

        // Prepare path
        const path = getConfigPath(data.file);

        // Check existence of config file and write json according to user's choice
        if (fs.existsSync(path)) {
            inquirer.prompt({
                name: 'overwrite',
                type: 'confirm',
                default: false,
                message: `${path} already exists. Do you want overwrite?`
            }).then(data => {
                if (data.overwrite) {
                    // Save options
                    if (writeJsonFile(path, options)) {
                        Log.notice(null, `Sucessfully saved your config at ${path.green}.`);
                    }
                }
            });
        } else {
            // Save options
            if (writeJsonFile(path, options)) {
                Log.notice(null, `Sucessfully created your config file at ${path.green}.`);
            }
        }
    }).catch(error => console.error(error));
}

/**
 * `nsp:register` command handler.
 *
 * @param {string} name Namespace to register
 * @param {Command} cmd Commander extra
 * @returns {void}
 */
function register(name, cmd) {
    // Prepare name
    name = '/' + slug(name);

    // Prepare config file path
    const configfile = getConfigPath(cmd.config, cmd.dir);

    // Read options
    var options = loadJsonFile(configfile);
    if (undefined === options) {
        return;
    }

    // Check if namespaces listing is valid
    if (!options.socketio || !_.isPlainObject(options.socketio.namespaces)) {
        Log.critical('CLI::', 'Invalid config file', { file: configfile });
        return;
    }

    // Add requested namespace if does not exist
    var idx = _.keys(options.socketio.namespaces).findIndex(nsp => nsp === name);
    if (-1 === idx) {
        options.socketio.namespaces[name] = {
            //
        };
    } else {
        Log.warning('CLI::', `Namespace ${name}.green already exists.`);
        // TODO: To overwrite nsp options or to exit
        return;
    }

    // Save options
    if (writeJsonFile(configfile, options)) {
        Log.notice(null, `Sucessfully registered ${name.green}. Check out ${configfile.yellow}.`);
    }
}

/**
 * `nsp:unregister` command handler.
 *
 * @param {string} name Namespace to unregister
 * @param {Command} cmd Commander extra
 * @returns {void}
 */
function unregister(name, cmd) {
    // Prepare name
    name = '/' + slug(name);

    // Check if requested namespace is root nsp
    if ('/' === name) {
        Log.critical('CLI::', `Can't remove root namespace: ${"/".green}.`);
        return;
    }

    // Prepare config file path
    const configfile = getConfigPath(cmd.config, cmd.dir);

    // Read options
    var options = loadJsonFile(configfile);
    if (undefined === options) {
        return;
    }

    // Check if namespaces listing is valid
    if (!options.socketio || !_.isPlainObject(options.socketio.namespaces)) {
        Log.critical('CLI::', 'Invalid config file', { file: configfile });
        return;
    }

    // Delete requested namespace if exists
    var idx = _.keys(options.socketio.namespaces).findIndex(nsp => nsp === name);
    if (-1 === idx) {
        Log.warning('CLI::', `Can't find namespace ${name.grey} in ${configfile.yellow}.`);
        return;
    } else {
        delete options.socketio.namespaces[name];
    }

    // Save options
    if (writeJsonFile(configfile, options)) {
        Log.notice(null, `Sucessfully unregistered ${name.green}. Check out ${configfile.yellow}.`);
    }
}


/**
 * Get absolute path to config file by the provided args.
 *
 * @param {string} file File name
 * @param {string} dir Dir path
 * @returns {string} Absolute path to config file
 */
function getConfigPath(file = null, dir = null) {
    const filepath = path.join(dir || '', file || 'boom-server.config.json');
    return path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath);
}

/**
 * Load json object from file.
 *
 * @param {string} filepath Absolute path to file
 * @returns {object|undefined}
 */
function loadJsonFile(filepath) {
    var data = { };

    try {
        data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch {
        Log.critical('CLI::', 'There was a problem reading file', { file: filepath });
        return undefined;
    }

    return data;
}

/**
 * Write json object into file.
 *
 * @param {string} filepath Absolute path to file
 * @param {any} data
 * @returns {boolean} Whether writing completed successfully or not
 */
function writeJsonFile(filepath, data) {
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, '  '));
        return true;
    } catch {
        Log.critical('CLI::', 'There was a problem reading file', { file: filepath });
        return false;
    }
}
