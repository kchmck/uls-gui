export const VIS = {
    DEFAULT: 0b1011,
    UNCONFIRMED: 0b1000,
    IGNORED: 0b100,
    CONFIRMED: 0b10,
    ANNOTATED: 0b1,
};

export function createVisCalc({ignored, confirmed, notes}) {
    return lkey => {
        let vis = 0;

        if (ignored[lkey]) {
            vis |= VIS.IGNORED;
        }

        if (confirmed[lkey]) {
            vis |= VIS.CONFIRMED;
        }

        if (notes[lkey]) {
            vis |= VIS.ANNOTATED;
        }

        if (vis === 0) {
            vis |= VIS.UNCONFIRMED;
        }

        return vis;
    };
}
