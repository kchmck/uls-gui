export const VIS = {
    DEFAULT: 0b10111,
    REVIEWING: 0b10000,
    IGNORED: 0b1000,
    CONFIRMED: 0b100,
    UNCONFIRMED: 0b1,
};

export function createVisCalc(locCat) {
    return lkey => {
        let vis = locCat[lkey] || 0;

        if (vis === 0) {
            vis |= VIS.UNCONFIRMED;
        }

        return vis;
    };
}
