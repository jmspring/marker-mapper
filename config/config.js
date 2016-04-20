var config = {
    defaultLocation: "nevadacity",
    locations: {
        santacruz: { lat: 36.9741, lon: -122.0308 },
        nevadacity: { lat: 39.2616, lon: -121.0161 },
        redmond: { lat: 47.6740, lon: -122.1215 },
        dublin: { lat: 53.3498, lon: -6.2603 }
    },
    mapkey: process.env.MAPBASE_KEY,
    fetchsvc: process.env.FETCH_HOST,
    fetchport: process.env.FETCH_PORT
};

module.exports = config;
