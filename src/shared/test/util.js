import {assert} from "chai";
import {
    parseBandwidth,
    parseEmission,
    calcDist,
    calcSReading,
    createPathLossCalc,
    milliWattToDbm,
    calcRxPower,
} from "../util";

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
