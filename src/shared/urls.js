const REC_BASE = "http://wireless2.fcc.gov/UlsApp/UlsSearch/license.jsp";
const LOC_BASE = "http://wireless2.fcc.gov/UlsApp/UlsSearch/licenseLocDetail.jsp";
const FREQ_BASE = "http://wireless2.fcc.gov/UlsApp/UlsSearch/licenseFreqDetail.jsp";

export function recUrl(rkey) {
    return `${REC_BASE}?licKey=${rkey}`;
}

export function locUrl(rkey, lkey) {
    return `${LOC_BASE}?licKey=${rkey}&keyLoc=${lkey}`;
}

export function freqUrl(rkey, fkey) {
    return `${FREQ_BASE}?licKey=${rkey}&keyFreq=${fkey}`;
}
