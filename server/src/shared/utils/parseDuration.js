const unitsInMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
};

function parseDuration(duration) {

    const match = /^(\d+)(s|m|h|d)$/.exec(duration);

    if (!match) {
        throw new Error(
            `Invalid duration format: "${duration}". Use formats like "15m", "7d", "1h"`
        );
    }

    const [ , value, unit ] = match;

    return Number(value) * unitsInMs[ unit ];

}

module.exports = parseDuration;