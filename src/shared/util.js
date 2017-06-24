import shallowEquals from "shallow-equals";

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

export function createDebounce(delay) {
    let handle = null;

    return fn => {
        clearTimeout(handle);
        handle = setTimeout(fn, delay);
    };
}

export function subscribeState(store, getSubstate, fn) {
    let prevState = null;

    store.subscribe(() => {
        let nextState = getSubstate(store.getState());

        if (!shallowEquals(prevState, nextState)) {
            fn(nextState);
        }

        prevState = nextState;
    });
}

if (process.env.NODE_ENV === "test") {
    let {assert} = require("chai");

    test("parseBandwidth", () => {
        assert.equal(parseBandwidth("12KS"), null);
        assert.equal(parseBandwidth("12X5"), null);
        assert.equal(parseBandwidth("12k5"), null);
        assert.equal(parseBandwidth(""), null);
        assert.equal(parseBandwidth("AAAA"), null);
        assert.equal(parseBandwidth("12K55"), null);

        assert.equal(parseBandwidth("H002"), 0.002);
        assert.equal(parseBandwidth("H100"), 0.1);
        assert.equal(parseBandwidth("25H3"), 25.3);
        assert.equal(parseBandwidth("400H"), 400.0);
        assert.equal(parseBandwidth("2K40"), 2400.0);
        assert.equal(parseBandwidth("6K00"), 6000.0);
        assert.equal(parseBandwidth("12K5"), 12500.0);
        assert.equal(parseBandwidth("180K"), 180000.0);
        assert.equal(parseBandwidth("1M25"), 1250000.0);
        assert.equal(parseBandwidth("2M00"), 2000000.0);
        assert.equal(parseBandwidth("10M0"), 10000000.0);
        assert.equal(parseBandwidth("202M"), 202000000.0);
        assert.equal(parseBandwidth("5G65"), 5650000000.0);
    });

    test("parseEmission", () => {
        assert.deepEqual(parseEmission("12K5"), null);
        assert.deepEqual(parseEmission("12K5F8EE"), null);

        assert.deepEqual(parseEmission("12K54Z2"), {
            bandwidth: 12500.0,
            modulation: null,
            signal: null,
            info: null,
        });

        assert.deepEqual(parseEmission("12K5F8E"), {
            bandwidth: 12500.0,
            modulation: "FM",
            signal: "analog/multi-channel",
            info: "telephony",
        });
    });

    test("calcDist", () => {
        let x = {lat: 40.0, lng: -81.0};
        assert.equal(calcDist(x, x), 0.0);
    });

    test("calcSReading", () => {
        assert.equal(calcSReading(-53), "S9+20");
        assert.equal(calcSReading(-57), "S9+16");
        assert.equal(calcSReading(-62), "S9+11");
        assert.equal(calcSReading(-63), "S9+10");
        assert.equal(calcSReading(-67), "S9+6");
        assert.equal(calcSReading(-70), "S9");
        assert.equal(calcSReading(-73), "S9");
        assert.equal(calcSReading(-76), "S8");
        assert.equal(calcSReading(-79), "S8");
        assert.equal(calcSReading(-80), "S7");
        assert.equal(calcSReading(-85), "S7");
        assert.equal(calcSReading(-91), "S6");
        assert.equal(calcSReading(-97), "S5");
        assert.equal(calcSReading(-103), "S4");
        assert.equal(calcSReading(-109), "S3");
        assert.equal(calcSReading(-115), "S2");
        assert.equal(calcSReading(-118), "S1");
        assert.equal(calcSReading(-121), "S1");
        assert.equal(calcSReading(-122), "S0");
        assert.equal(calcSReading(-127), "S0");
        assert.equal(calcSReading(-1000), "S0");
    });

    test("calcPathLoss", () => {
        let calcPathLoss = createPathLossCalc(2.0);
        assert.closeTo(calcPathLoss(100.0e6, 5), 90.55, 0.1);
        assert.closeTo(calcPathLoss(200.0e6, 5), 96.57, 0.1);
        assert.closeTo(calcPathLoss(100.0e6, 10), 96.57, 0.1);
        assert.closeTo(calcPathLoss(450.0e6, 5), 103.6, 0.1);
        assert.closeTo(calcPathLoss(450.0e6, 10), 109.6, 0.1);
    });

    test("milliWattToDbm", () => {
        assert.closeTo(milliWattToDbm(1), 0, 0.1);
        assert.closeTo(milliWattToDbm(10), 10, 0.1);
        assert.closeTo(milliWattToDbm(100), 20, 0.1);
        assert.closeTo(milliWattToDbm(1000), 30, 0.1);
        assert.closeTo(milliWattToDbm(10000), 40, 0.1);
        assert.closeTo(milliWattToDbm(42), 16.23, 0.1);
    });

    test("calcRxPower", () => {
        let calcPathLoss = createPathLossCalc(2.0);
        assert.closeTo(calcRxPower(milliWattToDbm(100), calcPathLoss(100.0e6, 10)),
                -76.58, 0.1);
        assert.closeTo(calcRxPower(milliWattToDbm(142), calcPathLoss(400.0e6, 12)),
                -88.68, 0.1);
    });
}
