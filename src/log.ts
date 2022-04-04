import * as colors from 'colors';
import * as _ from 'lodash';

import { isdm } from './routines';


/**
 * Log support class powered by `colors`.
 */
export class Log {
    /**
     * Console log debug.
     *
     * @param {any[]} args
     * @returns {void}
     */
    static debug(...args: any[]): void {
        console.log(...args);
    }

    /**
     * Console log info.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static info(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.cyan('ℹ  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log notice.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static notice(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.green('✔  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log warning.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static warning(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.yellow('⚠  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log error.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static error(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.red('⛒  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log critical.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static critical(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.bgRed.yellow('⛝  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log alert.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static alert(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.bgRed.white('✖  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }

    /**
     * Console log emergency.
     *
     * @param {string} scope
     * @param {string} message
     * @param {object?} extra
     * @param {boolean?} print
     * @returns {void}
     */
    static emergency(
        scope: string,
        message: string,
        extra: {[key: string]: string} = {},
        print: boolean = isdm()
    ): void {
        if (print) {
            console.log(colors.bgWhite.bold.red('⊗  ' + trailSpace(scope, 8))
                + ' ' + (message + (_.keys(extra).length ? '; ' : ''))
                + extraToStr(extra)
            );
        }
    }
}

/**
 * Fill trailing space.
 *
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function trailSpace(str: string, width: number): string {
    if (str) {
        width = Math.floor(width);

        if (width <= str.length) {
            return str;
        } else {
            return str + (' '.repeat(width - str.length));
        }
    } else {
        return '';
    }
}

/**
 * Convert extra object to string.
 *
 * @param {object?} extra
 * @returns {string}
 */
function extraToStr(extra: {[key: string]: string} = {}): string {
    let extra_str = '';
    let keys = _.keys(extra);

    if (keys.length) {
        keys.forEach(key =>
            extra_str += `${key.grey}=${extra[key]}, `
        );
        extra_str = extra_str.slice(0, extra_str.length - 2);
    }

    return extra_str;
}
