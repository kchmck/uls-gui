export function parseBandwidth(s) {
    if (s.length !== 4) {
        return null;
    }

    let groups = /(\d*)([HKMG])(\d*)/.exec(s);

    if (groups === null || groups[0].length !== 4) {
        return null;
    }

    return parseFloat([groups[1], groups[3]].join(".")) * UNIT[groups[2]];
}

export function parseEmission(em) {
    if (em.length !== 7) {
        return null;
    }

    return {
        bandwidth: parseBandwidth(em.slice(0, 4)),
        modulation: MODULATIONS[em[4]] || null,
        signal: SIGNALS[em[5]] || null,
        info: INFO[em[6]] || null,
    };
}

const UNIT = {
    "H": 1.0,
    "K": 1.0e3,
    "M": 1.0e6,
    "G": 1.0e9,
};

const MODULATIONS = {
    "N": "CW",
    "A": "AM",
    "H": "SSB-FC",
    "R": "SSB-RC",
    "J": "SSB",
    "B": "ISB",
    "C": "VSB",
    "F": "FM",
    "G": "PM",
    "D": "AM+FM/PM",
    "P": "pulse",
    "K": "PAM",
    "L": "PWM",
    "M": "PPM",
    "Q": "pulse+FM/PM",
    "V": "mixed pulse",
    "W": "mixed",
    "X": "other",
};

const SIGNALS = {
    "0": "none",
    "1": "digital",
    "2": "digital/sub-carrier",
    "3": "analog",
    "7": "digital/multi-channel",
    "8": "analog/multi-channel",
    "9": "mixed",
    "X": "other",
};

const INFO = {
    "N": "none",
    "A": "aural telegraphy",
    "B": "electronic telegraphy",
    "C": "image",
    "D": "data",
    "E": "telephony",
    "F": "video",
    "W": "mixed",
    "X": "other",
};

function degToRad(deg) { return deg * (Math.PI / 180.0); }
function sin(x) { return Math.sin(degToRad(x)); }
function cos(x) { return Math.cos(degToRad(x)); }
function sqr(x) { return x * x; }

// Mean radius of the Earth in miles.
const EARTH_RADIUS = 3959.0;

export function calcDist(a, b) {
    return 2.0 * EARTH_RADIUS * Math.asin(Math.sqrt(
        sqr(sin((a.lat - b.lat) / 2.0)) +
        sqr(sin((a.lng - b.lng) / 2.0)) * cos(a.lat) * cos(b.lat)
    ));
}

export function calcSReading(dbm) {
    if (dbm < -121.0) {
        return "S0";
    }

    if (dbm >= -67.0) {
        return `S9+${Math.floor(dbm - -73.0)}`;
    }

    return `S${Math.floor((dbm - -127.0) / 6.0)}`;
}

export function milliWattToDbm(mw) {
    return 10.0 * Math.log10(mw);
}

// Calculate received power in dBm.
export function calcRxPower(txPower, channelLoss=0.0, txGain=0.0, txLoss=0.0,
                            rxGain=0.0, rxLoss=0.0)
{
    return txPower + txGain - txLoss - channelLoss + rxGain - rxLoss;
}

// Calculate loss in dB from frequency in Hz and distance in miles.
export function createPathLossCalc(exp) {
    const FACTOR = 10.0 * exp;
    const OFFSET = FACTOR * Math.log10(1609.34 * 4.0 * Math.PI / 2.99792458e8);

    return (freq, dist) => FACTOR * Math.log10(freq * dist) + OFFSET;
}

export function hsvToRgb(h, s, v) {
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    let [r, g, b] = (function() {
        switch (i % 6) {
        case 0: return [v, t, p];
        case 1: return [q, v, p];
        case 2: return [p, v, t];
        case 3: return [p, q, v];
        case 4: return [t, p, v];
        case 5: return [v, p, q];
        }
    })();

    return Math.round(r * 255) << 16 |
           Math.round(g * 255) << 8 |
           Math.round(b * 255);
}
