# boom-server

> Proxy server between Laravel API and socket.io clients

| :exclamation: IMPORTANT: This project is not actively maintained. |
| ----------------------------------------------------------------- |

`boom-server` is a simple microservice for [Laravel](https://laravel.com) applications to emit/listen events to/from
[`socket.io`](https://socket.io/) clients. To control `boom-server` from Laravel API, you should install
[`boom-controller`](https://packagist.org/packages/cednore/boom-controller).

See [`boom-demo`](https://github.com/cednore/boom-demo) for example usage of this project.

> Currently, this project supports only `socket.io:^2.2.0`, `laravel:^5.7|^6.0` and `php:^7|^8`.

## Installation

It is recommended to install `boom-server` as a global npm package.

```bash
npm install --global boom-server
```

## Usage

Syntax:

```bash
boom-server <command> [options]
```

### Command: `boom-server init`

Initialize a custom config file in current directory.

Options:

```
-h, --help  output usage information
```

Examples:

```bash
# Create a config file by running questionnaire (uses default config file at current working directory)
boom-server init

# Explicitly specify config filename before the questionnaire
boom-server init server.json
```

### Command: `boom-server start`

Starts the server.

Options:

```
-c, --config <file>  The config file to use.
-l, --dir <dir>      The working directory to use.
-f, --force          If a server is already running, stop it and restart.
-d, --dev            Run in development mode.
-h, --help           output usage information
```

Examples:

```bash
# Start the server (uses default config file at current working directory)
boom-server start

# Force start the server in DEV mode (uses default config file at current working directory)
boom-server start --dev

# Force restart the server with config loaded from `server.json`
boom-server start --config server.json --force

# Start the server in DEV mode, at working directory of `./config`, with config loaded from `boom.json`
boom-server start -c boom.json -l ./config -d
```

### Command: `boom-server stop`

Stops currently running server.

Options:

```
-c, --config <file>  The config file being used by running server.
-l, --dir <dir>      The working directory to use.
-h, --help           output usage information
```

Examples:

```bash
# Stop the server (uses default config file at current working directory)
boom-server stop

# Stop the server which is running with config at `server.json`
boom-server stop --config server.json

# Stop the server which is running at working directory of `./config`, with config loaded from `boom.json`
boom-server stop -c boom.json -l ./config
```

### Command: `boom-server nsp:register`

Register a namespace to serve.

Options:

```
-c, --config <file>  The config file to use.
-l, --dir <dir>      The working directory to use.
-h, --help           output usage information
```

Examples:

```bash
# Register a new namespace called `namespaceBlog` (uses default config file at current working directory)
boom-server nsp:register namespaceBlog

# Register a new namespace called `nsp12345` onto config at `server.json`
boom-server nsp:register nsp12345 --config server.json

# Register a new namespace called `new_nsp123456` onto config at `boom.json`, in `./config` folder
boom-server nsp:register new_nsp123456 -c boom.json -l ./config
```

### Command: `boom-server nsp:unregister`

Unregister a namespace.

Options:

```
-c, --config <file>  The config file to use.
-l, --dir <dir>      The working directory to use.
-h, --help           output usage information
```

Examples:

```bash
# Unregister namespace called `namespaceBlog` (uses default config file at current working directory)
boom-server nsp:unregister namespaceBlog

# Unregister namespace called `nsp12345` from config at `server.json`
boom-server nsp:unregister nsp12345 --config server.json

# Unregister namespace called `new_nsp123456` from config at `boom.json`, in `./config` folder
boom-server nsp:unregister new_nsp123456 -c boom.json -l ./config
```

## Cloning

These instructions will get you a copy of the project up and running on your local machine for development and testing
purposes. See [Installation](#installation) chapter for notes on how to use this project on a live system.

```bash
# Clone this repo
git clone git@github.com:cednore/boom-server.git
cd boom-server

# Install npm dependencies
npm install

# NPM scripts
npm run build    # tsc build
npm run dev      # tsc in watch mode
npm run start    # start the server
npm run stop     # stop the server
npm run restart  # restart the server
```

## Project roadmaps

1. Testing desperately needed ;-)
2. Resourceful documentation; Changelog, contribution guide, issue/PR templates, GitHub releases, dedicated
   documentation website
3. Version compatibility check between `boom-controller` and `boom-server`
4. CI/CD pipelines for building, testing and publishing
5. Support higher `socket.io` and `laravel` versions
6. More smooth controller syntax
7. Detailed error handling
8. Memcached driver
9. More stable db connection
10. Dockerization of microservice
11. Combine `boom-server` and `boom-controller` in a single monorepo

## License

This project is licensed under the MIT license. See full contents at [`LICENSE`](LICENSE) file.
