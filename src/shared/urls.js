export function recUrl(rkey) {
    return `http://wireless2.fcc.gov/UlsApp/UlsSearch/license.jsp?licKey=${rkey}`;
}

export function locUrl(rkey, lkey) {
    return `http://wireless2.fcc.gov/UlsApp/UlsSearch/licenseLocDetail.jsp?licKey=${rkey}&keyLoc=${lkey}`;
}

export function freqUrl(rkey, fkey) {
    return `http://wireless2.fcc.gov/UlsApp/UlsSearch/licenseFreqDetail.jsp?licKey=${rkey}&keyFreq=${fkey}`;
}
