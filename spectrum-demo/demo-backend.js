var process = globalThis.process || (globalThis.process = { env: { ADMIN_TOKEN: 'demo', PAYMENT_PROVIDER: 'mock', ORG_NAME: 'Spectrum CPR + First Aid' }, argv: [], exit(){}, on(){}, cwd(){ return '/'; }, platform: 'browser', versions: {} });
var __dirname = '/src', __filename = '/src/x.js';
"use strict";
var SpectrumBackend = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // ../vlottiz/spectrumcpr_web/src/address.js
  var require_address = __commonJS({
    "../vlottiz/spectrumcpr_web/src/address.js"(exports, module) {
      "use strict";
      var PROVIDER = (process.env.ADDRESS_PROVIDER || (process.env.GOOGLE_PLACES_KEY ? "google" : "photon")).toLowerCase();
      var CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
      var CENSUS_BENCHMARK = process.env.CENSUS_BENCHMARK || "Public_AR_Current";
      var GOOGLE_AUTOCOMPLETE = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
      var GOOGLE_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
      var PHOTON_URL = "https://photon.komoot.io/api/";
      var ZIP_URL = "https://api.zippopotam.us/us/";
      var BIAS_LAT = Number(process.env.ADDRESS_BIAS_LAT || 45.5229);
      var BIAS_LON = Number(process.env.ADDRESS_BIAS_LON || -122.9898);
      var TIMEOUT_MS = Number(process.env.ADDRESS_TIMEOUT_MS || 4e3);
      async function fetchJson(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error(`lookup failed (${res.status})`);
          return await res.json();
        } finally {
          clearTimeout(timer);
        }
      }
      function fromCensus(match) {
        const c = match.addressComponents || {};
        const street = [
          c.fromAddress,
          c.preQualifier,
          c.preDirection,
          c.preType,
          c.streetName,
          c.suffixType,
          c.suffixDirection,
          c.suffixQualifier
        ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
        return {
          label: match.matchedAddress,
          street,
          city: c.city || "",
          state: c.state || "",
          zip: c.zip || ""
        };
      }
      function fromPhoton(feature) {
        const p = feature.properties || {};
        const street = [p.housenumber, p.street || p.name].filter(Boolean).join(" ").trim();
        const city = p.city || p.town || p.village || p.district || "";
        return {
          label: [street || p.name, city, [p.state, p.postcode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
          street,
          city,
          state: US_STATE_ABBR[p.state] || (p.state && p.state.length === 2 ? p.state : ""),
          zip: p.postcode || ""
        };
      }
      async function photonSuggest(query) {
        const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=8&lang=en&lat=${BIAS_LAT}&lon=${BIAS_LON}`;
        const data = await fetchJson(url);
        return (data.features || []).filter((f) => (f.properties || {}).countrycode === "US").filter((f) => (f.properties || {}).street || (f.properties || {}).housenumber).slice(0, 5).map(fromPhoton);
      }
      async function censusSuggest(query) {
        const url = `${CENSUS_URL}?address=${encodeURIComponent(query)}&benchmark=${encodeURIComponent(CENSUS_BENCHMARK)}&format=json`;
        const data = await fetchJson(url);
        const matches = data?.result?.addressMatches || [];
        return matches.slice(0, 5).map(fromCensus);
      }
      async function googleSuggest(query) {
        const key = process.env.GOOGLE_PLACES_KEY;
        const url = `${GOOGLE_AUTOCOMPLETE}?input=${encodeURIComponent(query)}&types=address&components=country:us&key=${key}`;
        const data = await fetchJson(url);
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          throw new Error(`Places: ${data.status}`);
        }
        return (data.predictions || []).slice(0, 5).map((p) => ({
          label: p.description,
          placeId: p.place_id,
          street: "",
          city: "",
          state: "",
          zip: ""
        }));
      }
      async function googleDetails(placeId) {
        const key = process.env.GOOGLE_PLACES_KEY;
        const url = `${GOOGLE_DETAILS}?place_id=${encodeURIComponent(placeId)}&fields=address_component,formatted_address&key=${key}`;
        const data = await fetchJson(url);
        if (data.status !== "OK") throw new Error(`Places details: ${data.status}`);
        const parts = data.result.address_components || [];
        const get = (type, short = false) => {
          const hit = parts.find((p) => p.types.includes(type));
          return hit ? short ? hit.short_name : hit.long_name : "";
        };
        const street = [get("street_number"), get("route")].filter(Boolean).join(" ");
        return {
          label: data.result.formatted_address,
          street,
          city: get("locality") || get("sublocality") || get("postal_town"),
          state: get("administrative_area_level_1", true),
          zip: get("postal_code")
        };
      }
      var US_STATE_ABBR = {
        Alabama: "AL",
        Alaska: "AK",
        Arizona: "AZ",
        Arkansas: "AR",
        California: "CA",
        Colorado: "CO",
        Connecticut: "CT",
        Delaware: "DE",
        Florida: "FL",
        Georgia: "GA",
        Hawaii: "HI",
        Idaho: "ID",
        Illinois: "IL",
        Indiana: "IN",
        Iowa: "IA",
        Kansas: "KS",
        Kentucky: "KY",
        Louisiana: "LA",
        Maine: "ME",
        Maryland: "MD",
        Massachusetts: "MA",
        Michigan: "MI",
        Minnesota: "MN",
        Mississippi: "MS",
        Missouri: "MO",
        Montana: "MT",
        Nebraska: "NE",
        Nevada: "NV",
        "New Hampshire": "NH",
        "New Jersey": "NJ",
        "New Mexico": "NM",
        "New York": "NY",
        "North Carolina": "NC",
        "North Dakota": "ND",
        Ohio: "OH",
        Oklahoma: "OK",
        Oregon: "OR",
        Pennsylvania: "PA",
        "Rhode Island": "RI",
        "South Carolina": "SC",
        "South Dakota": "SD",
        Tennessee: "TN",
        Texas: "TX",
        Utah: "UT",
        Vermont: "VT",
        Virginia: "VA",
        Washington: "WA",
        "West Virginia": "WV",
        Wisconsin: "WI",
        Wyoming: "WY",
        "District of Columbia": "DC"
      };
      async function lookupZip(zip) {
        const clean = String(zip || "").trim().slice(0, 5);
        if (!/^\d{5}$/.test(clean)) return null;
        try {
          const data = await fetchJson(ZIP_URL + clean);
          const place = (data.places || [])[0];
          if (!place) return null;
          return {
            city: place["place name"] || "",
            state: place["state abbreviation"] || "",
            zip: clean
          };
        } catch (err) {
          console.warn("[address] ZIP lookup failed:", err.message);
          return null;
        }
      }
      async function suggest(query) {
        const q = String(query || "").trim();
        const minimum = PROVIDER === "census" ? 5 : 3;
        if (q.length < minimum) return { provider: PROVIDER, suggestions: [] };
        try {
          const suggestions = PROVIDER === "google" ? await googleSuggest(q) : PROVIDER === "census" ? await censusSuggest(q) : await photonSuggest(q);
          return { provider: PROVIDER, suggestions };
        } catch (err) {
          console.warn("[address] lookup failed:", err.message);
          return { provider: PROVIDER, suggestions: [], error: "lookup_unavailable" };
        }
      }
      async function details(placeId) {
        if (PROVIDER !== "google") return null;
        try {
          return await googleDetails(placeId);
        } catch (err) {
          console.warn("[address] details failed:", err.message);
          return null;
        }
      }
      module.exports = { suggest, details, lookupZip, PROVIDER, fromCensus, fromPhoton };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/zip-centroids.json
  var require_zip_centroids = __commonJS({
    "../vlottiz/spectrumcpr_web/src/zip-centroids.json"(exports, module) {
      module.exports = { "97002": [45.2284, -122.8039, "Aurora", "OR"], "97003": [45.5201, -122.8604, "Beaverton", "OR"], "97004": [45.2597, -122.4751, "Beavercreek", "OR"], "97005": [45.4963, -122.8001, "Beaverton", "OR"], "97006": [45.5201, -122.8604, "Beaverton", "OR"], "97007": [45.4505, -122.8652, "Beaverton", "OR"], "97008": [45.456, -122.7996, "Beaverton", "OR"], "97009": [45.4297, -122.3807, "Boring", "OR"], "97010": [45.583, -122.1011, "Bridal Veil", "OR"], "97011": [45.3652, -122.0036, "Brightwood", "OR"], "97013": [45.2514, -122.6832, "Canby", "OR"], "97014": [45.671, -121.8686, "Cascade Locks", "OR"], "97015": [45.415, -122.52, "Clackamas", "OR"], "97016": [46.0665, -123.2059, "Clatskanie", "OR"], "97017": [45.1573, -122.4248, "Colton", "OR"], "97018": [45.8925, -122.8122, "Columbia City", "OR"], "97019": [45.5221, -122.2417, "Corbett", "OR"], "97020": [45.2199, -122.8405, "Donald", "OR"], "97021": [45.3913, -121.1432, "Dufur", "OR"], "97022": [45.3582, -122.3381, "Eagle Creek", "OR"], "97023": [45.2872, -122.3259, "Estacada", "OR"], "97024": [45.5473, -122.4414, "Fairview", "OR"], "97026": [45.1086, -122.8962, "Gervais", "OR"], "97027": [45.3899, -122.5902, "Gladstone", "OR"], "97028": [45.2972, -121.739, "Government Camp", "OR"], "97030": [45.5154, -122.4203, "Gresham", "OR"], "97031": [45.6711, -121.5391, "Hood River", "OR"], "97032": [45.1823, -122.8079, "Hubbard", "OR"], "97034": [45.4093, -122.6847, "Lake Oswego", "OR"], "97035": [45.4147, -122.7227, "Lake Oswego", "OR"], "97036": [45.4012, -122.6512, "Marylhurst", "OR"], "97038": [45.1223, -122.5756, "Molalla", "OR"], "97040": [45.6508, -121.379, "Mosier", "OR"], "97041": [45.4929, -121.5983, "Mount Hood Parkdale", "OR"], "97042": [45.213, -122.5351, "Mulino", "OR"], "97044": [45.6437, -121.5367, "Odell", "OR"], "97045": [45.3377, -122.57, "Oregon City", "OR"], "97048": [46.0646, -122.9671, "Rainier", "OR"], "97049": [45.3465, -121.9151, "Rhododendron", "OR"], "97051": [45.8608, -122.8282, "Saint Helens", "OR"], "97053": [45.826, -122.8634, "Warren", "OR"], "97054": [45.9356, -122.8985, "Deer Island", "OR"], "97055": [45.379, -122.223, "Sandy", "OR"], "97056": [45.7655, -122.8928, "Scappoose", "OR"], "97058": [45.5995, -121.1905, "The Dalles", "OR"], "97060": [45.5254, -122.3739, "Troutdale", "OR"], "97062": [45.3727, -122.7631, "Tualatin", "OR"], "97063": [45.2229, -121.2927, "Tygh Valley", "OR"], "97064": [45.8573, -123.1967, "Vernonia", "OR"], "97067": [45.3399, -121.9598, "Welches", "OR"], "97068": [45.3669, -122.648, "West Linn", "OR"], "97070": [45.2986, -122.7699, "Wilsonville", "OR"], "97071": [45.1446, -122.8583, "Woodburn", "OR"], "97075": [45.4871, -122.8037, "Beaverton", "OR"], "97076": [45.4871, -122.8037, "Beaverton", "OR"], "97077": [45.4871, -122.8037, "Beaverton", "OR"], "97078": [45.452, -122.7893, "First Consumers Nat Bank", "OR"], "97080": [45.4817, -122.4156, "Gresham", "OR"], "97086": [45.4446, -122.5372, "Happy Valley", "OR"], "97089": [45.4176, -122.459, "Damascus", "OR"], "97101": [45.1157, -123.1744, "Amity", "OR"], "97102": [45.8109, -123.963, "Arch Cape", "OR"], "97103": [46.1558, -123.798, "Astoria", "OR"], "97106": [45.6535, -123.121, "Banks", "OR"], "97107": [45.5197, -123.8761, "Bay City", "OR"], "97108": [45.2767, -123.8234, "Beaver", "OR"], "97109": [45.737, -123.2146, "Buxton", "OR"], "97110": [45.8918, -123.9615, "Cannon Beach", "OR"], "97111": [45.2859, -123.1523, "Carlton", "OR"], "97112": [45.2858, -123.8356, "Cloverdale", "OR"], "97113": [45.529, -123.0415, "Cornelius", "OR"], "97114": [45.1977, -123.0753, "Dayton", "OR"], "97115": [45.2776, -123.0152, "Dundee", "OR"], "97116": [45.5981, -123.1818, "Forest Grove", "OR"], "97117": [45.5957, -123.234, "Gales Creek", "OR"], "97118": [45.5626, -123.9001, "Garibaldi", "OR"], "97119": [45.4427, -123.1666, "Gaston", "OR"], "97121": [46.198, -123.9527, "Hammond", "OR"], "97122": [45.1768, -123.846, "Hebo", "OR"], "97123": [45.4984, -122.957, "Hillsboro", "OR"], "97124": [45.5387, -122.9636, "Hillsboro", "OR"], "97125": [45.6648, -123.1637, "Manning", "OR"], "97127": [45.2466, -123.1114, "Lafayette", "OR"], "97128": [45.2097, -123.2043, "Mcminnville", "OR"], "97130": [45.7184, -123.9351, "Manzanita", "OR"], "97131": [45.7216, -123.9049, "Nehalem", "OR"], "97132": [45.3099, -122.9685, "Newberg", "OR"], "97133": [45.6686, -123.0281, "North Plains", "OR"], "97134": [45.4549, -123.965, "Oceanside", "OR"], "97135": [45.205, -123.959, "Pacific City", "OR"], "97136": [45.6134, -123.9429, "Rockaway Beach", "OR"], "97137": [45.196, -122.9674, "Saint Paul", "OR"], "97138": [45.9932, -123.9226, "Seaside", "OR"], "97140": [45.3514, -122.8567, "Sherwood", "OR"], "97141": [45.4492, -123.8189, "Tillamook", "OR"], "97143": [45.434, -123.9458, "Netarts", "OR"], "97144": [45.727, -123.3119, "Timber", "OR"], "97145": [45.8663, -123.9595, "Tolovana Park", "OR"], "97146": [46.145, -123.9254, "Warrenton", "OR"], "97147": [45.6888, -123.8816, "Wheeler", "OR"], "97148": [45.335, -123.2036, "Yamhill", "OR"], "97149": [45.097, -123.9434, "Neskowin", "OR"], "97201": [45.5078, -122.6897, "Portland", "OR"], "97202": [45.484, -122.6365, "Portland", "OR"], "97203": [45.5889, -122.7347, "Portland", "OR"], "97204": [45.5181, -122.6745, "Portland", "OR"], "97205": [45.5207, -122.6888, "Portland", "OR"], "97206": [45.484, -122.5973, "Portland", "OR"], "97207": [45.5235, -122.6762, "Portland", "OR"], "97208": [45.5235, -122.6762, "Portland", "OR"], "97209": [45.527, -122.6854, "Portland", "OR"], "97210": [45.5303, -122.7033, "Portland", "OR"], "97211": [45.5653, -122.6448, "Portland", "OR"], "97212": [45.5441, -122.6423, "Portland", "OR"], "97213": [45.5373, -122.5987, "Portland", "OR"], "97214": [45.5142, -122.6364, "Portland", "OR"], "97215": [45.5143, -122.599, "Portland", "OR"], "97216": [45.5137, -122.5569, "Portland", "OR"], "97217": [45.5742, -122.6842, "Portland", "OR"], "97218": [45.56, -122.6001, "Portland", "OR"], "97219": [45.458, -122.7074, "Portland", "OR"], "97220": [45.5411, -122.5566, "Portland", "OR"], "97221": [45.4918, -122.7267, "Portland", "OR"], "97222": [45.4373, -122.6147, "Portland", "OR"], "97223": [45.4403, -122.7793, "Portland", "OR"], "97224": [45.4094, -122.8014, "Portland", "OR"], "97225": [45.4985, -122.7787, "Portland", "OR"], "97227": [45.5496, -122.6743, "Portland", "OR"], "97228": [45.5235, -122.6762, "Portland", "OR"], "97229": [45.5483, -122.8276, "Portland", "OR"], "97230": [45.5472, -122.5001, "Portland", "OR"], "97231": [45.6401, -122.838, "Portland", "OR"], "97232": [45.5287, -122.6363, "Portland", "OR"], "97233": [45.5142, -122.4985, "Portland", "OR"], "97236": [45.4887, -122.5091, "Portland", "OR"], "97238": [45.5235, -122.6762, "Portland", "OR"], "97239": [45.4983, -122.6913, "Portland", "OR"], "97240": [45.5235, -122.6762, "Portland", "OR"], "97242": [45.5235, -122.6762, "Portland", "OR"], "97250": [45.5235, -122.6762, "Portland", "OR"], "97251": [45.52, -122.67, "Us West", "OR"], "97252": [45.5235, -122.6762, "Portland", "OR"], "97253": [45.5235, -122.6762, "Us Bank", "OR"], "97254": [45.5967, -122.5942, "Gen Electric", "OR"], "97255": [45.52, -122.67, "Nw Natural", "OR"], "97256": [45.5235, -122.6762, "Portland", "OR"], "97258": [45.5235, -122.6762, "Portland", "OR"], "97259": [45.52, -122.67, "At&t", "OR"], "97266": [45.4762, -122.5596, "Portland", "OR"], "97267": [45.4021, -122.6144, "Portland", "OR"], "97268": [45.5235, -122.6762, "Portland", "OR"], "97269": [45.5235, -122.6762, "Portland", "OR"], "97271": [45.52, -122.67, "Abmps", "OR"], "97272": [45.52, -122.67, "Portland", "OR"], "97280": [45.5235, -122.6762, "Portland", "OR"], "97281": [45.5235, -122.6762, "Portland", "OR"], "97282": [45.5235, -122.6762, "Portland", "OR"], "97283": [45.5235, -122.6762, "Portland", "OR"], "97286": [45.5235, -122.6762, "Portland", "OR"], "97290": [45.5235, -122.6762, "Portland", "OR"], "97291": [45.5235, -122.6762, "Portland", "OR"], "97292": [45.5235, -122.6762, "Portland", "OR"], "97293": [45.5235, -122.6762, "Portland", "OR"], "97294": [45.5235, -122.6762, "Portland", "OR"], "97296": [45.5235, -122.6762, "Portland", "OR"], "97298": [45.5235, -122.6762, "Portland", "OR"], "97299": [45.54, -122.61, "Portland", "OR"], "97301": [44.949, -123.004, "Salem", "OR"], "97302": [44.9039, -123.0445, "Salem", "OR"], "97303": [44.9927, -123.0167, "Salem", "OR"], "97304": [44.9588, -123.0753, "Salem", "OR"], "97305": [44.9961, -122.9124, "Salem", "OR"], "97306": [44.8685, -123.0438, "Salem", "OR"], "97307": [44.9901, -123.0262, "Keizer", "OR"], "97308": [44.9429, -123.0351, "Salem", "OR"], "97309": [44.9429, -123.0351, "Salem", "OR"], "97310": [44.9271, -122.9861, "Salem", "OR"], "97311": [44.9438, -123.0286, "Salem", "OR"], "97312": [44.9364, -123.0381, "Salem", "OR"], "97313": [44.9849, -122.9988, "State Farm Ins", "OR"], "97314": [44.9655, -123.0066, "Salem", "OR"], "97317": [44.9026, -122.9074, "Salem", "OR"], "97321": [44.652, -123.1333, "Albany", "OR"], "97322": [44.626, -123.057, "Albany", "OR"], "97324": [44.3691, -123.6089, "Alsea", "OR"], "97325": [44.8313, -122.8517, "Aumsville", "OR"], "97326": [44.6281, -123.6067, "Blodgett", "OR"], "97327": [44.377, -122.9485, "Brownsville", "OR"], "97329": [44.3973, -122.4817, "Cascadia", "OR"], "97330": [44.5904, -123.2722, "Corvallis", "OR"], "97331": [44.5638, -123.2779, "Corvallis", "OR"], "97333": [44.5393, -123.2799, "Corvallis", "OR"], "97335": [44.6344, -122.8933, "Crabtree", "OR"], "97336": [44.3593, -122.8508, "Crawfordsville", "OR"], "97338": [44.9225, -123.32, "Dallas", "OR"], "97339": [44.5646, -123.262, "Corvallis", "OR"], "97341": [44.8322, -124.0503, "Depoe Bay", "OR"], "97342": [44.734, -122.1498, "Detroit", "OR"], "97343": [44.6371, -123.7531, "Eddyville", "OR"], "97344": [44.8706, -123.4461, "Falls City", "OR"], "97345": [44.3836, -122.5449, "Foster", "OR"], "97346": [44.7527, -122.3995, "Gates", "OR"], "97347": [45.075, -123.6335, "Grand Ronde", "OR"], "97348": [44.3862, -123.1251, "Halsey", "OR"], "97350": [44.7001, -122.074, "Idanha", "OR"], "97351": [44.8481, -123.1879, "Independence", "OR"], "97352": [44.7495, -123.006, "Jefferson", "OR"], "97355": [44.5316, -122.8821, "Lebanon", "OR"], "97357": [44.7432, -123.7943, "Logsden", "OR"], "97358": [44.7499, -122.595, "Lyons", "OR"], "97360": [44.7516, -122.4768, "Mill City", "OR"], "97361": [44.8377, -123.2512, "Monmouth", "OR"], "97362": [45.0737, -122.7856, "Mount Angel", "OR"], "97364": [44.9988, -123.9843, "Neotsu", "OR"], "97365": [44.6487, -124.0509, "Newport", "OR"], "97366": [44.5712, -124.06, "South Beach", "OR"], "97367": [44.9089, -123.9888, "Lincoln City", "OR"], "97368": [45.0138, -123.9332, "Otis", "OR"], "97369": [44.7588, -124.0633, "Otter Rock", "OR"], "97370": [44.5488, -123.3923, "Philomath", "OR"], "97371": [45.02, -123.2064, "Rickreall", "OR"], "97372": [45.01, -123.87, "Lincoln City", "OR"], "97373": [44.9845, -122.457, "Saint Benedict", "OR"], "97374": [44.7168, -122.7684, "Scio", "OR"], "97375": [44.9897, -122.6187, "Scotts Mills", "OR"], "97376": [44.4874, -123.9567, "Seal Rock", "OR"], "97377": [44.453, -123.1065, "Shedd", "OR"], "97378": [45.0897, -123.4003, "Sheridan", "OR"], "97380": [44.7313, -123.9062, "Siletz", "OR"], "97381": [44.991, -122.7627, "Silverton", "OR"], "97383": [44.8021, -122.7624, "Stayton", "OR"], "97384": [44.7903, -122.6187, "Mehama", "OR"], "97385": [44.8425, -122.8007, "Sublimity", "OR"], "97386": [44.3981, -122.7286, "Sweet Home", "OR"], "97388": [44.8812, -124.0343, "Gleneden Beach", "OR"], "97389": [44.5497, -123.1108, "Tangent", "OR"], "97390": [44.4055, -123.9149, "Tidewater", "OR"], "97391": [44.6271, -123.9301, "Toledo", "OR"], "97392": [44.8476, -122.9501, "Turner", "OR"], "97394": [44.4085, -124.0351, "Waldport", "OR"], "97396": [45.0826, -123.5047, "Willamina", "OR"], "97412": [44.1966, -123.5348, "Blachly", "OR"], "97419": [44.1782, -123.3715, "Cheshire", "OR"], "97446": [44.2717, -123.1432, "Harrisburg", "OR"], "97448": [44.1988, -123.23, "Junction City", "OR"], "97454": [44.2064, -122.8246, "Marcola", "OR"], "97456": [44.3245, -123.3203, "Monroe", "OR"], "97498": [44.3256, -124.0863, "Yachats", "OR"], "98304": [46.7531, -121.9898, "Ashford", "WA"], "98328": [46.8708, -122.2696, "Eatonville", "WA"], "98330": [46.7777, -122.2023, "Elbe", "WA"], "98336": [46.5283, -122.099, "Glenoma", "WA"], "98348": [46.8343, -122.3187, "La Grande", "WA"], "98355": [46.7096, -122.1861, "Mineral", "WA"], "98356": [46.5581, -122.2496, "Morton", "WA"], "98377": [46.5492, -121.8555, "Randle", "WA"], "98501": [47.0129, -122.8763, "Olympia", "WA"], "98509": [46.9781, -122.7024, "Lacey", "WA"], "98511": [46.9616, -123.0283, "Tumwater", "WA"], "98512": [46.9498, -123.0212, "Olympia", "WA"], "98513": [46.9939, -122.743, "Olympia", "WA"], "98522": [46.629, -123.0612, "Adna", "WA"], "98527": [46.6315, -123.9549, "Bay Center", "WA"], "98530": [46.7982, -122.8718, "Bucoda", "WA"], "98531": [46.7246, -122.9671, "Centralia", "WA"], "98532": [46.6382, -122.9658, "Chehalis", "WA"], "98533": [46.5793, -122.5687, "Cinebar", "WA"], "98537": [46.9538, -123.7739, "Cosmopolis", "WA"], "98538": [46.4956, -123.1468, "Curtis", "WA"], "98539": [46.6378, -123.2804, "Doty", "WA"], "98540": [46.9781, -122.7024, "East Olympia", "WA"], "98541": [47.0058, -123.3997, "Elma", "WA"], "98542": [46.5321, -122.7404, "Ethel", "WA"], "98544": [46.7423, -123.0271, "Galvin", "WA"], "98547": [46.8264, -124.094, "Grayland", "WA"], "98554": [46.5614, -123.5479, "Lebam", "WA"], "98556": [46.9024, -123.017, "Littlerock", "WA"], "98557": [47.0297, -123.273, "Mccleary", "WA"], "98558": [46.9348, -122.5565, "Mckenna", "WA"], "98559": [46.9589, -123.3268, "Malone", "WA"], "98561": [46.6215, -123.6471, "Menlo", "WA"], "98564": [46.5131, -122.4789, "Mossyrock", "WA"], "98565": [46.5745, -122.9082, "Napavine", "WA"], "98568": [46.8434, -123.2493, "Oakville", "WA"], "98570": [46.573, -122.7075, "Onalaska", "WA"], "98572": [46.5829, -123.3147, "Pe Ell", "WA"], "98576": [46.8829, -122.6795, "Rainier", "WA"], "98577": [46.671, -123.6929, "Raymond", "WA"], "98579": [46.8193, -123.0406, "Rochester", "WA"], "98581": [46.3752, -123.0431, "Ryderwood", "WA"], "98582": [46.5321, -122.6259, "Salkum", "WA"], "98583": [47.0022, -123.4836, "Satsop", "WA"], "98585": [46.5491, -122.4757, "Silver Creek", "WA"], "98586": [46.6544, -123.8203, "South Bend", "WA"], "98589": [46.8641, -122.8493, "Tenino", "WA"], "98590": [46.7065, -123.9818, "Tokeland", "WA"], "98591": [46.4396, -122.8266, "Toledo", "WA"], "98593": [46.3985, -122.9585, "Vader", "WA"], "98595": [46.8836, -124.1061, "Westport", "WA"], "98596": [46.494, -122.9158, "Winlock", "WA"], "98597": [46.9206, -122.588, "Yelm", "WA"], "98601": [45.9195, -122.4574, "Amboy", "WA"], "98602": [45.8504, -121.3129, "Appleton", "WA"], "98603": [45.9952, -122.4677, "Ariel", "WA"], "98604": [45.7907, -122.5318, "Battle Ground", "WA"], "98605": [45.7751, -121.6328, "Bingen", "WA"], "98606": [45.7304, -122.4843, "Brush Prairie", "WA"], "98607": [45.6058, -122.4142, "Camas", "WA"], "98609": [46.0715, -122.8648, "Carrolls", "WA"], "98610": [45.7493, -121.8351, "Carson", "WA"], "98611": [46.2783, -122.9139, "Castle Rock", "WA"], "98612": [46.1954, -123.3627, "Cathlamet", "WA"], "98614": [46.2729, -123.9454, "Chinook", "WA"], "98616": [46.0515, -122.2995, "Cougar", "WA"], "98617": [45.6327, -121.1717, "Dallesport", "WA"], "98619": [46.0071, -121.2885, "Glenwood", "WA"], "98621": [46.3535, -123.5888, "Grays River", "WA"], "98622": [45.8248, -122.4912, "Heisson", "WA"], "98623": [45.8076, -121.4877, "Husum", "WA"], "98624": [46.3142, -124.0282, "Ilwaco", "WA"], "98625": [46.0112, -122.8166, "Kalama", "WA"], "98626": [46.1485, -122.887, "Kelso", "WA"], "98628": [45.8171, -121.1526, "Klickitat", "WA"], "98629": [45.8806, -122.624, "La Center", "WA"], "98631": [46.3774, -124.047, "Long Beach", "WA"], "98632": [46.1514, -122.9634, "Longview", "WA"], "98635": [45.745, -121.2501, "Lyle", "WA"], "98637": [46.4984, -124.0335, "Nahcotta", "WA"], "98638": [46.3528, -123.8044, "Naselle", "WA"], "98639": [45.6373, -121.9712, "North Bonneville", "WA"], "98640": [46.5029, -124.0436, "Ocean Park", "WA"], "98641": [46.549, -124.0282, "Oysterville", "WA"], "98642": [45.7846, -122.6934, "Ridgefield", "WA"], "98643": [46.3071, -123.6571, "Rosburg", "WA"], "98644": [46.3308, -124.0455, "Seaview", "WA"], "98645": [46.3163, -122.7649, "Silverlake", "WA"], "98647": [46.2952, -123.4332, "Skamokawa", "WA"], "98648": [45.6882, -121.9093, "Stevenson", "WA"], "98649": [46.2956, -122.6477, "Toutle", "WA"], "98650": [45.9828, -121.5163, "Trout Lake", "WA"], "98651": [45.7409, -121.5974, "Underwood", "WA"], "98660": [45.6418, -122.6801, "Vancouver", "WA"], "98661": [45.6418, -122.6251, "Vancouver", "WA"], "98662": [45.6914, -122.5805, "Vancouver", "WA"], "98663": [45.6514, -122.6604, "Vancouver", "WA"], "98664": [45.6231, -122.5767, "Vancouver", "WA"], "98665": [45.6892, -122.6616, "Vancouver", "WA"], "98666": [45.6387, -122.6615, "Vancouver", "WA"], "98667": [45.63, -122.66, "Abmps", "WA"], "98668": [45.6387, -122.6615, "Vancouver", "WA"], "98671": [45.5959, -122.3104, "Washougal", "WA"], "98672": [45.7551, -121.4795, "White Salmon", "WA"], "98674": [45.9219, -122.7126, "Woodland", "WA"], "98675": [45.8622, -122.4275, "Yacolt", "WA"], "98682": [45.6644, -122.5212, "Vancouver", "WA"], "98683": [45.6032, -122.5133, "Vancouver", "WA"], "98684": [45.6359, -122.5155, "Vancouver", "WA"], "98685": [45.7162, -122.6899, "Vancouver", "WA"], "98686": [45.712, -122.6322, "Vancouver", "WA"], "98687": [45.6387, -122.6615, "Vancouver", "WA"] };
    }
  });

  // shims/path.js
  var require_path = __commonJS({
    "shims/path.js"(exports, module) {
      "use strict";
      var norm = (p) => {
        const out = [];
        for (const s of p.split("/")) {
          if (!s || s === ".") continue;
          if (s === "..") out.pop();
          else out.push(s);
        }
        return (p.startsWith("/") ? "/" : "") + out.join("/");
      };
      module.exports = { join: (...a) => norm(a.join("/")), resolve: (...a) => norm("/" + a.join("/")), dirname: (p) => p.replace(/\/[^/]*$/, "") || "/", basename: (p, ext) => {
        const b = p.split("/").pop();
        return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b;
      }, extname: (p) => (p.match(/\.[^./]*$/) || [""])[0], sep: "/" };
    }
  });

  // shims/express.js
  var require_express = __commonJS({
    "shims/express.js"(exports, module) {
      "use strict";
      function compile(path) {
        const keys = [];
        const re = new RegExp("^" + path.replace(/[.+*?^${}()|[\]\\]/g, "\\$&").replace(/\\?:(\w+)/g, (_, k) => {
          keys.push(k);
          return "([^/]+)";
        }) + "/?$");
        return { re, keys };
      }
      function express() {
        const stack = [];
        const app = {};
        app.use = (...a) => {
          const path = typeof a[0] === "string" ? a.shift() : null;
          for (const fn of a.flat()) stack.push({ method: null, path, fn });
          return app;
        };
        for (const m of ["get", "post", "put", "patch", "delete", "all"]) {
          app[m] = (path, ...fns) => {
            const c = compile(path);
            for (const fn of fns.flat()) stack.push({ method: m === "all" ? null : m.toUpperCase(), route: c, fn });
            return app;
          };
        }
        app.listen = () => {
        };
        app.set = () => app;
        app.disable = () => app;
        app.handle = ({ method, url, body, headers }) => new Promise((resolve) => {
          const u = new URL(url, "https://demo.local");
          const hdrs = {};
          for (const [k, v] of Object.entries(headers || {})) hdrs[k.toLowerCase()] = v;
          const query = {};
          for (const [k, v] of u.searchParams) query[k] = k in query ? [].concat(query[k], v) : v;
          let parsed = {};
          if (typeof body === "string" && body) {
            try {
              parsed = JSON.parse(body);
            } catch {
              parsed = Object.fromEntries(new URLSearchParams(body));
            }
          }
          const req = {
            method,
            url: u.pathname + u.search,
            originalUrl: u.pathname + u.search,
            path: u.pathname,
            query,
            params: {},
            body: parsed,
            rawBody: body || "",
            headers: hdrs,
            protocol: "https",
            ip: "127.0.0.1",
            hostname: "demo.local",
            get: (k) => hdrs[String(k).toLowerCase()] ?? (k.toLowerCase() === "host" ? "demo.local" : void 0)
          };
          req.header = req.get;
          const out = { status: 200, headers: {}, body: "" };
          let done = false;
          const finish = () => {
            if (!done) {
              done = true;
              resolve(out);
            }
          };
          const res = {
            statusCode: 200,
            headersSent: false,
            status(c) {
              out.status = c;
              this.statusCode = c;
              return res;
            },
            set(k, v) {
              if (typeof k === "object") Object.assign(out.headers, k);
              else out.headers[k.toLowerCase()] = v;
              return res;
            },
            get(k) {
              return out.headers[k.toLowerCase()];
            },
            type(t) {
              out.headers["content-type"] = t === "html" ? "text/html" : t === "json" ? "application/json" : t;
              return res;
            },
            json(o) {
              out.headers["content-type"] = "application/json";
              out.body = JSON.stringify(o);
              finish();
              return res;
            },
            send(x) {
              if (x && typeof x === "object") return res.json(x);
              out.body = x == null ? "" : String(x);
              finish();
              return res;
            },
            sendStatus(c) {
              out.status = c;
              out.body = "";
              finish();
              return res;
            },
            end(x) {
              if (x) out.body = String(x);
              finish();
              return res;
            },
            redirect(a, b) {
              out.status = typeof a === "number" ? a : 302;
              out.headers.location = b || a;
              finish();
              return res;
            }
          };
          res.header = res.set;
          res.setHeader = res.set;
          let i = 0;
          const next = (err) => {
            if (done) return;
            while (i < stack.length) {
              const l = stack[i++];
              if (l.method && l.method !== method) continue;
              if (l.route) {
                const m = l.route.re.exec(u.pathname);
                if (!m) continue;
                req.params = {};
                l.route.keys.forEach((k, j) => {
                  req.params[k] = decodeURIComponent(m[j + 1]);
                });
              } else if (l.path && !u.pathname.startsWith(l.path)) continue;
              const isErr = l.fn.length === 4;
              if (err ? !isErr : isErr) continue;
              try {
                const r = err ? l.fn(err, req, res, next) : l.fn(req, res, next);
                if (r && typeof r.catch === "function") r.catch(next);
              } catch (e) {
                next(e);
              }
              return;
            }
            if (err) {
              console.error(err);
              res.status(500).json({ ok: false, reason: "server_error" });
            } else res.status(404).json({ ok: false, reason: "not_found" });
          };
          next();
        });
        return app;
      }
      var passthrough = () => (req, res, next) => next();
      express.json = passthrough;
      express.urlencoded = passthrough;
      express.static = passthrough;
      express.Router = express;
      module.exports = express;
    }
  });

  // shims/crypto.js
  var require_crypto = __commonJS({
    "shims/crypto.js"(exports, module) {
      "use strict";
      function wrapBytes(u8) {
        u8.toString = function(enc) {
          const arr = Array.from(this);
          if (enc === "hex") return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
          const b64 = btoa(String.fromCharCode(...arr));
          if (enc === "base64url") return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          return b64;
        };
        return u8;
      }
      function randomBytes(n) {
        const u = new Uint8Array(n);
        globalThis.crypto.getRandomValues(u);
        return wrapBytes(u);
      }
      function sha256(bytes) {
        const K = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
        let H = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
        const l = bytes.length, withPad = new Uint8Array(l + 9 + 63 >> 6 << 6);
        withPad.set(bytes);
        withPad[l] = 128;
        const dv = new DataView(withPad.buffer);
        dv.setUint32(withPad.length - 4, l * 8);
        dv.setUint32(withPad.length - 8, Math.floor(l / 2 ** 29));
        const W = new Uint32Array(64), r = (x, n) => x >>> n | x << 32 - n;
        for (let i = 0; i < withPad.length; i += 64) {
          for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
          for (let t = 16; t < 64; t++) {
            const s0 = r(W[t - 15], 7) ^ r(W[t - 15], 18) ^ W[t - 15] >>> 3, s1 = r(W[t - 2], 17) ^ r(W[t - 2], 19) ^ W[t - 2] >>> 10;
            W[t] = W[t - 16] + s0 + W[t - 7] + s1 | 0;
          }
          let [a, b, c, d, e, f, g, h] = H;
          for (let t = 0; t < 64; t++) {
            const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = e & f ^ ~e & g, t1 = h + S1 + ch + K[t] + W[t] | 0, S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), mj = a & b ^ a & c ^ b & c, t2 = S0 + mj | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          H = H.map((v, k) => v + [a, b, c, d, e, f, g, h][k] | 0);
        }
        return wrapBytes(new Uint8Array(H.flatMap((v) => [v >>> 24, v >>> 16 & 255, v >>> 8 & 255, v & 255])));
      }
      function createHash() {
        const parts = [];
        const h = {
          update(d) {
            parts.push(typeof d === "string" ? new TextEncoder().encode(d) : d);
            return h;
          },
          digest(enc) {
            const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
            let o = 0;
            for (const p of parts) {
              all.set(p, o);
              o += p.length;
            }
            const out = sha256(all);
            return enc ? out.toString(enc) : out;
          }
        };
        return h;
      }
      function timingSafeEqual(a, b) {
        if (a.length !== b.length) return false;
        let x = 0;
        for (let i = 0; i < a.length; i++) x |= a[i] ^ b[i];
        return x === 0;
      }
      var randomUUID = () => globalThis.crypto.randomUUID();
      module.exports = { randomBytes, createHash, timingSafeEqual, randomUUID };
    }
  });

  // shims/sqlite.js
  var require_sqlite = __commonJS({
    "shims/sqlite.js"(exports, module) {
      "use strict";
      var conv = (v) => v === void 0 ? null : typeof v === "boolean" ? v ? 1 : 0 : typeof v === "bigint" ? Number(v) : v;
      function bindArgs(st, args) {
        if (!args.length) return;
        const a0 = args[0];
        if (args.length === 1 && a0 && typeof a0 === "object" && !Array.isArray(a0) && !(a0 instanceof Uint8Array)) {
          const o = {};
          for (const [k, v] of Object.entries(a0)) {
            const val = conv(v);
            if (/^[@$:]/.test(k)) o[k] = val;
            else {
              o["@" + k] = val;
              o["$" + k] = val;
              o[":" + k] = val;
            }
          }
          st.bind(o);
        } else st.bind(args.map(conv));
      }
      var StatementSync = class {
        constructor(owner, sql) {
          this.owner = owner;
          this.sql = sql;
        }
        _st(args) {
          const st = this.owner.raw.prepare(this.sql);
          bindArgs(st, args);
          return st;
        }
        all(...args) {
          const st = this._st(args);
          try {
            const out = [];
            while (st.step()) out.push(st.getAsObject());
            return out;
          } finally {
            st.free();
          }
        }
        get(...args) {
          const st = this._st(args);
          try {
            return st.step() ? st.getAsObject() : void 0;
          } finally {
            st.free();
          }
        }
        run(...args) {
          const st = this._st(args);
          try {
            st.step();
          } finally {
            st.free();
          }
          const changes = this.owner.raw.getRowsModified();
          const r = this.owner.raw.exec("SELECT last_insert_rowid() AS id");
          return { changes, lastInsertRowid: r.length ? r[0].values[0][0] : 0 };
        }
        iterate(...args) {
          return this.all(...args)[Symbol.iterator]();
        }
      };
      var DatabaseSync = class {
        constructor() {
          const SQL = globalThis.__SQL;
          if (!SQL) throw new Error("sql.js not initialised");
          this.raw = globalThis.__SQL_BYTES ? new SQL.Database(globalThis.__SQL_BYTES) : new SQL.Database();
          globalThis.__SQL_DB = this;
        }
        prepare(sql) {
          return new StatementSync(this, sql);
        }
        exec(sql) {
          this.raw.exec(sql);
        }
        close() {
          this.raw.close();
        }
        exportBytes() {
          const b = this.raw.export();
          this.raw.exec("PRAGMA foreign_keys = ON");
          return b;
        }
      };
      module.exports = { DatabaseSync, StatementSync };
    }
  });

  // shims/fs.js
  var require_fs = __commonJS({
    "shims/fs.js"(exports, module) {
      "use strict";
      module.exports = { mkdirSync() {
      }, existsSync() {
        return false;
      }, readFileSync() {
        throw new Error("no filesystem in the demo");
      }, writeFileSync() {
      } };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/db.js
  var require_db = __commonJS({
    "../vlottiz/spectrumcpr_web/src/db.js"(exports, module) {
      "use strict";
      var path = require_path();
      var { DatabaseSync } = require_sqlite();
      var DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "booking.db");
      var SCHEMA = `
-- A row here is a TRAINING DAY, not a single class.
--
-- The business travels to the customer, so the instructor publishes a day they
-- are available along with the hours they will work. Customers book a session
-- inside that window at their own address. starts_at / ends_at are therefore
-- the open and close times of the day, not one class's start and finish.
--
-- capacity is how many people the instructor is willing to train that day in
-- total, across every visit \u2014 limited by manikins, cards and stamina.
CREATE TABLE IF NOT EXISTS classes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code     TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  starts_at       TEXT    NOT NULL,           -- day opens (ISO 8601 UTC)
  ends_at         TEXT    NOT NULL,           -- day closes
  location        TEXT    NOT NULL DEFAULT '',
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),

  -- Group pricing, as JSON. A small booking costs the same to drive to and
  -- set up as a full one, so party size moves the per-person price. NULL means
  -- the defaults in seats.js apply.
  pricing_tiers   TEXT,

  -- Legacy: ZIP codes a day would travel to. Replaced by travel zones and no
  -- longer read; kept so older databases don't need the column dropped.
  service_zips    TEXT,

  -- How many trips into each travel zone this day allows, as JSON:
  -- {"1": null, "2": 3, "3": 1}. null or missing means no limit; 0 means the
  -- zone is closed that day. Counted per calendar date, so two days sharing a
  -- date share the limit \u2014 see zoneTripsLeft() in seats.js.
  zone_limits     TEXT,

  -- The repeating schedule that created this day, if any. NULL for days
  -- added by hand.
  schedule_id     INTEGER,

  -- Hidden from the admin list but kept, because bookings on it are records:
  -- a cancelled day whose customers have all been removed. A day nobody ever
  -- booked is deleted outright instead.
  archived        INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','cancelled')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_classes_starts_at ON classes (starts_at);

CREATE TABLE IF NOT EXISTS registrations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref        TEXT    NOT NULL UNIQUE,  -- shown to the student, e.g. SPC-8F3K2Q
  class_id          INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status            TEXT    NOT NULL
                            CHECK (status IN ('held','confirmed','expired','cancelled','waitlist','offered')),

  student_name      TEXT    NOT NULL,
  student_email     TEXT    NOT NULL,
  student_phone     TEXT    NOT NULL DEFAULT '',
  notes             TEXT    NOT NULL DEFAULT '',

  amount_cents      INTEGER NOT NULL,         -- per-seat price, copied at hold time

  -- Where the instructor is going, and when. Every seat in one booking shares
  -- both: it's one visit to one address.
  slot_start        TEXT,                     -- session start (ISO 8601 UTC)
  address           TEXT    NOT NULL DEFAULT '',
  address_notes     TEXT    NOT NULL DEFAULT '',  -- gate codes, parking, suite

  -- Travel zone of the address and what the trip costs. Every seat in a
  -- booking carries the zone and distance; only the organiser's seat
  -- (seat_index 0) carries the charge, since it's one trip.
  travel_zone       INTEGER,
  travel_miles      REAL,
  travel_cents      INTEGER NOT NULL DEFAULT 0,

  -- Records. consent_at: when the customer agreed to their details being kept
  -- (up to 2 years) and to a card-renewal email. cancelled_at: when they were
  -- removed \u2014 the row stays, crossed out, for billing. reminder_sent_at: the
  -- renewal email was queued. anonymized_at: personal details cleared once
  -- the 2 years were up.
  consent_at        TEXT,
  cancelled_at      TEXT,
  reminder_sent_at  TEXT,
  anonymized_at     TEXT,

  -- Group bookings: one organiser reserves several seats in one payment.
  -- Every seat is still its own row (each attendee needs their own name on
  -- the roster and their own certification card), tied together by group_ref.
  group_ref         TEXT,                     -- NULL for a solo booking
  seat_index        INTEGER NOT NULL DEFAULT 0,  -- 0 = organiser's own seat
  organiser_name    TEXT,                     -- who booked, when not attending


  hold_expires_at   TEXT,                     -- set while status='held'
  offer_expires_at  TEXT,                     -- set while status='offered'

  payment_provider  TEXT,                     -- 'mock' | 'converge'
  payment_ref       TEXT,                     -- Converge ssl_txn_id / order id
  payment_raw       TEXT,                     -- JSON blob of the gateway response

  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  confirmed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_reg_class_status ON registrations (class_id, status);
-- idx_reg_group is created in migrate(), after the column is guaranteed to
-- exist. Putting it here breaks upgrades: on a database made before group
-- bookings, SCHEMA runs first and the column isn't there yet.
CREATE INDEX IF NOT EXISTS idx_reg_holds        ON registrations (status, hold_expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_payment_ref
  ON registrations (payment_provider, payment_ref)
  WHERE payment_ref IS NOT NULL;

-- Append-only audit trail. Useful when a student swears they paid.
CREATE TABLE IF NOT EXISTS events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
  class_id        INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  kind            TEXT    NOT NULL,
  detail          TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Repeating weekly schedules. Each keeps weeks_ahead weeks of days open,
-- adding new ones as time moves on, so the calendar never runs dry.
--
--   courses  JSON [{ "code": "CPR", "title": "CPR / AED", "priceCents": 8500 }]
--   week     JSON, 7 entries Sunday first: { "on": true, "open": "09:00", "close": "17:00" }
--            times are wall-clock in BUSINESS_TZ
--   filled_through  the last date (YYYY-MM-DD) days have been created up to
CREATE TABLE IF NOT EXISTS schedules (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  courses         TEXT    NOT NULL,
  week            TEXT    NOT NULL,
  weeks_ahead     INTEGER NOT NULL DEFAULT 8,
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  pricing_tiers   TEXT,
  zone_limits     TEXT,
  starts_on       TEXT    NOT NULL,
  filled_through  TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Dates a schedule must not recreate: a day from it that was cancelled and
-- cleared. Without this, the next fill would put it straight back.
CREATE TABLE IF NOT EXISTS schedule_skips (
  schedule_id     INTEGER NOT NULL,
  day             TEXT    NOT NULL,           -- YYYY-MM-DD
  course_code     TEXT    NOT NULL,
  PRIMARY KEY (schedule_id, day, course_code)
);

-- Time off: dates the instructor isn't working. Inclusive, YYYY-MM-DD.
CREATE TABLE IF NOT EXISTS time_off (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  starts_on       TEXT    NOT NULL,
  ends_on         TEXT    NOT NULL,
  note            TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- How many trainers are working on a date, where it differs from the usual
-- number (settings.default_trainers). Each trainer can run one visit at a
-- time, so two trainers means two overlapping bookings are fine. 0 means
-- nobody is available that date.
CREATE TABLE IF NOT EXISTS trainer_days (
  day             TEXT    PRIMARY KEY,        -- YYYY-MM-DD
  trainers        INTEGER NOT NULL CHECK (trainers >= 0)
);

-- Small site-wide settings, e.g. min_notice_hours.
CREATE TABLE IF NOT EXISTS settings (
  key             TEXT    PRIMARY KEY,
  value           TEXT    NOT NULL
);

-- Outbound email queue. Nothing sends yet; the client's mail provider
-- plugs in here later. Keeps a record of what *should* have gone out.
CREATE TABLE IF NOT EXISTS outbox (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
  to_email        TEXT    NOT NULL,
  subject         TEXT    NOT NULL,
  body            TEXT    NOT NULL,
  sent_at         TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;
      var _db = null;
      var _raw = null;
      var _txDepth = 0;
      var _statements = /* @__PURE__ */ new Map();
      function transaction(fn, ...args) {
        const raw = _raw || (getDb(), _raw);
        if (_txDepth > 0) {
          _txDepth++;
          try {
            return fn(...args);
          } finally {
            _txDepth--;
          }
        }
        raw.exec("BEGIN IMMEDIATE");
        _txDepth = 1;
        try {
          const result = fn(...args);
          raw.exec("COMMIT");
          return result;
        } catch (err) {
          try {
            raw.exec("ROLLBACK");
          } catch {
          }
          throw err;
        } finally {
          _txDepth = 0;
        }
      }
      function wrap(raw) {
        return {
          prepare: (sql) => {
            let st = _statements.get(sql);
            if (!st) {
              st = raw.prepare(sql);
              _statements.set(sql, st);
            }
            return st;
          },
          exec: (sql) => raw.exec(sql),
          close: () => raw.close(),
          pragma: (stmt) => raw.exec(`PRAGMA ${stmt}`),
          /**
           * better-sqlite3 shape: db.transaction(fn) returns a callable, and that
           * callable also carries .immediate() / .deferred() / .exclusive().
           * Every mode here uses BEGIN IMMEDIATE, which is the strictest of the
           * three and the one this project relies on.
           */
          transaction: (fn) => {
            const wrapped = (...args) => transaction(fn, ...args);
            wrapped.immediate = wrapped;
            wrapped.deferred = wrapped;
            wrapped.exclusive = wrapped;
            return wrapped;
          }
        };
      }
      function getDb() {
        if (_db) return _db;
        const fs = require_fs();
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        _raw = new DatabaseSync(DB_PATH);
        _raw.exec("PRAGMA journal_mode = WAL");
        _raw.exec("PRAGMA foreign_keys = ON");
        _raw.exec("PRAGMA busy_timeout = 5000");
        _raw.exec(SCHEMA);
        migrate(_raw);
        _db = wrap(_raw);
        return _db;
      }
      function migrate(raw) {
        const columns = raw.prepare("PRAGMA table_info(registrations)").all().map((c) => c.name);
        const additions = [
          ["group_ref", "ALTER TABLE registrations ADD COLUMN group_ref TEXT"],
          ["seat_index", "ALTER TABLE registrations ADD COLUMN seat_index INTEGER NOT NULL DEFAULT 0"],
          ["organiser_name", "ALTER TABLE registrations ADD COLUMN organiser_name TEXT"],
          ["slot_start", "ALTER TABLE registrations ADD COLUMN slot_start TEXT"],
          ["address", "ALTER TABLE registrations ADD COLUMN address TEXT NOT NULL DEFAULT ''"],
          ["address_notes", "ALTER TABLE registrations ADD COLUMN address_notes TEXT NOT NULL DEFAULT ''"],
          ["travel_zone", "ALTER TABLE registrations ADD COLUMN travel_zone INTEGER"],
          ["travel_miles", "ALTER TABLE registrations ADD COLUMN travel_miles REAL"],
          ["travel_cents", "ALTER TABLE registrations ADD COLUMN travel_cents INTEGER NOT NULL DEFAULT 0"],
          ["consent_at", "ALTER TABLE registrations ADD COLUMN consent_at TEXT"],
          ["cancelled_at", "ALTER TABLE registrations ADD COLUMN cancelled_at TEXT"],
          ["reminder_sent_at", "ALTER TABLE registrations ADD COLUMN reminder_sent_at TEXT"],
          ["anonymized_at", "ALTER TABLE registrations ADD COLUMN anonymized_at TEXT"]
        ];
        const classColumns = raw.prepare("PRAGMA table_info(classes)").all().map((c) => c.name);
        if (!classColumns.includes("pricing_tiers")) {
          raw.exec("ALTER TABLE classes ADD COLUMN pricing_tiers TEXT");
          console.log("[db] added classes.pricing_tiers");
        }
        if (!classColumns.includes("service_zips")) {
          raw.exec("ALTER TABLE classes ADD COLUMN service_zips TEXT");
          console.log("[db] added classes.service_zips");
        }
        if (!classColumns.includes("archived")) {
          raw.exec("ALTER TABLE classes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
          console.log("[db] added classes.archived");
        }
        if (!classColumns.includes("schedule_id")) {
          raw.exec("ALTER TABLE classes ADD COLUMN schedule_id INTEGER");
          console.log("[db] added classes.schedule_id");
        }
        if (!classColumns.includes("zone_limits")) {
          raw.exec("ALTER TABLE classes ADD COLUMN zone_limits TEXT");
          console.log("[db] added classes.zone_limits");
        }
        for (const [name, sql] of additions) {
          if (!columns.includes(name)) {
            raw.exec(sql);
            console.log(`[db] added registrations.${name}`);
          }
        }
        raw.exec("CREATE INDEX IF NOT EXISTS idx_reg_group ON registrations (group_ref)");
        raw.exec("CREATE INDEX IF NOT EXISTS idx_reg_slot ON registrations (class_id, slot_start)");
        raw.exec(`UPDATE registrations
               SET slot_start = (SELECT starts_at FROM classes WHERE classes.id = registrations.class_id)
             WHERE slot_start IS NULL
               AND status IN ('held','confirmed','offered')`);
      }
      function closeDb() {
        if (_raw) {
          _raw.close();
          _raw = null;
          _db = null;
          _txDepth = 0;
          _statements = /* @__PURE__ */ new Map();
        }
      }
      module.exports = { getDb, closeDb, transaction, DB_PATH };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/zones.js
  var require_zones = __commonJS({
    "../vlottiz/spectrumcpr_web/src/zones.js"(exports, module) {
      "use strict";
      var HOME_ZIP = process.env.HOME_ZIP || "97116";
      var ZONES = [
        { zone: 1, minMiles: 0, maxMiles: 25, feeCents: 0 },
        { zone: 2, minMiles: 25.01, maxMiles: 50, feeCents: 5e3 },
        { zone: 3, minMiles: 50.01, maxMiles: 90, feeCents: 1e4 }
      ];
      var MAX_MILES = ZONES[ZONES.length - 1].maxMiles;
      var table = null;
      function centroids() {
        if (!table) {
          try {
            table = require_zip_centroids();
          } catch {
            console.error("[zones] src/zip-centroids.json is missing \u2014 run scripts/build-zip-table.js");
            table = {};
          }
        }
        return table;
      }
      var EARTH_RADIUS_MILES = 3958.8;
      function milesBetween(lat1, lon1, lat2, lon2) {
        const rad = (d) => d * Math.PI / 180;
        const dLat = rad(lat2 - lat1);
        const dLon = rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
      }
      var cleanZip = (zip) => String(zip ?? "").trim().slice(0, 5);
      function zoneForMiles(miles) {
        const m = Math.round(miles * 100) / 100;
        return ZONES.find((z) => m <= z.maxMiles) || null;
      }
      function zoneForZip(zip) {
        const z = cleanZip(zip);
        if (!/^\d{5}$/.test(z)) return { ok: false, reason: "zip_invalid", zip: z || null };
        const data = centroids();
        const home = data[HOME_ZIP];
        const here = data[z];
        if (!home) return { ok: false, reason: "outside_area", zip: z };
        if (!here) return { ok: false, reason: "outside_area", zip: z, miles: null };
        const miles = Math.round(milesBetween(home[0], home[1], here[0], here[1]) * 10) / 10;
        const band = zoneForMiles(miles);
        if (!band) {
          return { ok: false, reason: "outside_area", zip: z, miles, city: here[2], state: here[3] };
        }
        return {
          ok: true,
          zip: z,
          zone: band.zone,
          miles,
          feeCents: band.feeCents,
          city: here[2] || "",
          state: here[3] || ""
        };
      }
      function describeZones() {
        return ZONES.map((z) => ({ ...z }));
      }
      function feeForZone(zone) {
        const band = ZONES.find((z) => z.zone === Number(zone));
        return band ? band.feeCents : null;
      }
      module.exports = {
        HOME_ZIP,
        ZONES,
        MAX_MILES,
        milesBetween,
        zoneForMiles,
        zoneForZip,
        describeZones,
        feeForZone
      };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/seats.js
  var require_seats = __commonJS({
    "../vlottiz/spectrumcpr_web/src/seats.js"(exports, module) {
      "use strict";
      var crypto = require_crypto();
      var { getDb } = require_db();
      var zones = require_zones();
      var HOLD_MINUTES = Number(process.env.HOLD_MINUTES || 20);
      var OFFER_HOURS = Number(process.env.OFFER_HOURS || 24);
      var MAX_GROUP_SEATS = Number(process.env.MAX_GROUP_SEATS || 100);
      var SESSION_MINUTES = Number(process.env.SESSION_MINUTES || 240);
      var BUFFER_MINUTES = Number(process.env.BUFFER_MINUTES || 60);
      var SLOT_STEP_MINUTES = Number(process.env.SLOT_STEP_MINUTES || 30);
      var BLOCK_MINUTES = SESSION_MINUTES + BUFFER_MINUTES;
      function bufferMinutes() {
        const v = Number(getSetting("buffer_minutes", BUFFER_MINUTES));
        return Number.isFinite(v) && v >= 0 && v <= 240 ? v : BUFFER_MINUTES;
      }
      var blockMinutes = () => SESSION_MINUTES + bufferMinutes();
      var BUSINESS_TZ = process.env.BUSINESS_TZ || "America/Los_Angeles";
      function nowIso() {
        return (/* @__PURE__ */ new Date()).toISOString();
      }
      function addMinutes(iso, minutes) {
        return new Date(new Date(iso).getTime() + minutes * 6e4).toISOString();
      }
      function addHours(iso, hours) {
        return addMinutes(iso, hours * 60);
      }
      var REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      function makeRef() {
        const bytes = crypto.randomBytes(6);
        let out = "";
        for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
        return `SPC-${out}`;
      }
      var TAKEN_SQL = `
  SELECT COUNT(*) AS n FROM registrations
   WHERE class_id = @classId
     AND (
           status = 'confirmed'
        OR (status = 'held'    AND hold_expires_at  > @now)
        OR (status = 'offered' AND offer_expires_at > @now)
     )
`;
      function getClass(classId) {
        return getDb().prepare("SELECT * FROM classes WHERE id = ?").get(classId);
      }
      function availability(classId, now = nowIso()) {
        const db = getDb();
        const cls = getClass(classId);
        if (!cls) return null;
        const taken = db.prepare(TAKEN_SQL).get({ classId, now }).n;
        const waitlist = db.prepare(`SELECT COUNT(*) AS n FROM registrations
               WHERE class_id = ? AND status = 'waitlist'`).get(classId).n;
        return {
          classId,
          capacity: cls.capacity,
          taken,
          available: Math.max(0, cls.capacity - taken),
          waitlist,
          isFull: cls.capacity - taken <= 0,
          status: cls.status
        };
      }
      function getSetting(key, fallback = null) {
        const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
        return row ? row.value : fallback;
      }
      function setSetting(key, value) {
        getDb().prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, String(value));
      }
      function minNoticeHours() {
        const v = Number(getSetting("min_notice_hours", process.env.MIN_NOTICE_HOURS ?? 24));
        return Number.isFinite(v) && v >= 0 ? v : 24;
      }
      var COURSES = [
        { code: "CPR", title: "CPR / AED", priceCents: 8500 },
        { code: "HEARTSAVER", title: "Heartsaver CPR / AED / First Aid", priceCents: 9500 },
        { code: "BABYSIT", title: "Babysitter Safety", priceCents: 5500 }
      ];
      function courses() {
        let saved = {};
        try {
          saved = JSON.parse(getSetting("course_prices", "{}")) || {};
        } catch {
        }
        return COURSES.map((c) => ({
          ...c,
          priceCents: Number.isInteger(saved[c.code]) ? saved[c.code] : c.priceCents
        }));
      }
      function coursePrice(code) {
        const c = courses().find((x) => x.code === code);
        return c ? c.priceCents : null;
      }
      function setCoursePrice(code, priceCents, now = nowIso()) {
        const db = getDb();
        if (!COURSES.some((c) => c.code === code)) return { ok: false, reason: "no_such_course" };
        let saved = {};
        try {
          saved = JSON.parse(getSetting("course_prices", "{}")) || {};
        } catch {
        }
        saved[code] = priceCents;
        return db.transaction(() => {
          setSetting("course_prices", JSON.stringify(saved));
          const info = db.prepare("UPDATE classes SET price_cents = ? WHERE course_code = ? AND ends_at > ?").run(priceCents, code, now);
          return { ok: true, daysUpdated: Number(info.changes) };
        })();
      }
      function defaultTrainers() {
        const v = Number(getSetting("default_trainers", 1));
        return Number.isInteger(v) && v >= 0 ? v : 1;
      }
      function trainersOn(ymd) {
        const row = getDb().prepare("SELECT trainers FROM trainer_days WHERE day = ?").get(ymd);
        return row ? row.trainers : defaultTrainers();
      }
      function setTrainers(days, trainers, now = nowIso()) {
        const db = getDb();
        const up = db.prepare(`INSERT INTO trainer_days (day, trainers) VALUES (?, ?)
                         ON CONFLICT(day) DO UPDATE SET trainers = excluded.trainers`);
        const clear = db.prepare("DELETE FROM trainer_days WHERE day = ?");
        db.transaction(() => {
          for (const d of days) {
            if (trainers === null || trainers === defaultTrainers()) clear.run(d);
            else up.run(d, trainers);
          }
        })();
        return days.map((day) => ({ day, ...overbooked(day, now) })).filter((x) => x.over);
      }
      function visitsOnDate(db, ymd, now) {
        const cls = db.prepare(`SELECT * FROM classes WHERE status = 'open' AND ends_at > ?
               AND starts_at BETWEEN ? AND ?`).all(now, addMinutes(`${ymd}T00:00:00.000Z`, -24 * 60), addMinutes(`${ymd}T00:00:00.000Z`, 48 * 60)).filter((c) => localDate(c.starts_at) === ymd);
        return cls.length ? activeBookings(db, cls.map((c) => c.id), now) : [];
      }
      function overbooked(ymd, now = nowIso()) {
        const visits = visitsOnDate(getDb(), ymd, now);
        const most = visits.reduce((m, v) => Math.max(m, depthAt(visits, v.slot_start)), 0);
        const trainers = trainersOn(ymd);
        return { trainers, mostAtOnce: most, over: most > trainers };
      }
      function depthAt(visits, iso, block = blockMinutes() * 6e4) {
        return depthAtMs(visits.map((v) => Date.parse(v.slot_start)), Date.parse(iso), block);
      }
      function depthAtMs(starts, t, block) {
        let n = 0;
        for (const s of starts) if (s <= t && t < s + block) n++;
        return n;
      }
      function freeAtMs(starts, s, trainers, block) {
        if (trainers <= 0) return false;
        if (depthAtMs(starts, s, block) + 1 > trainers) return false;
        for (const p of starts) {
          if (p >= s && p < s + block && depthAtMs(starts, p, block) + 1 > trainers) return false;
        }
        return true;
      }
      function trainerFree(visits, start, trainers) {
        return freeAtMs(
          visits.map((v) => Date.parse(v.slot_start)),
          Date.parse(start),
          trainers,
          blockMinutes() * 6e4
        );
      }
      function roomFor(visits, starts, trainers) {
        const block = blockMinutes() * 6e4;
        const placed = visits.map((v) => Date.parse(v.slot_start));
        let n = 0;
        for (const start of starts) {
          const s = Date.parse(start);
          if (freeAtMs(placed, s, trainers, block)) {
            placed.push(s);
            n++;
          }
        }
        return n;
      }
      function wastesDay(visits, starts, start, trainers, before = roomFor(visits, starts, trainers)) {
        const after = roomFor([...visits, { slot_start: start }], starts, trainers);
        return after + 1 < before;
      }
      function isTimeOff(ymd) {
        return Boolean(getDb().prepare("SELECT 1 FROM time_off WHERE starts_on <= ? AND ends_on >= ? LIMIT 1").get(ymd, ymd));
      }
      var DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      var localDates = /* @__PURE__ */ new Map();
      function localDate(iso) {
        let d = localDates.get(iso);
        if (d === void 0) {
          d = DAY_FORMAT.format(new Date(iso));
          if (localDates.size > 2e4) localDates.clear();
          localDates.set(iso, d);
        }
        return d;
      }
      function zoneLimitsFor(cls) {
        const out = {};
        for (const z of zones.ZONES) out[z.zone] = null;
        if (!cls || !cls.zone_limits) return out;
        try {
          const parsed = JSON.parse(cls.zone_limits) || {};
          for (const z of zones.ZONES) {
            const v = parsed[z.zone];
            if (Number.isInteger(v) && v >= 0) out[z.zone] = v;
          }
        } catch {
          console.warn(`[zones] class ${cls.id} has unreadable zone_limits, treating as unlimited`);
        }
        return out;
      }
      function sameDateClasses(db, cls) {
        const date = localDate(cls.starts_at);
        const from = addMinutes(cls.starts_at, -36 * 60);
        const to = addMinutes(cls.starts_at, 36 * 60);
        const rows = db.prepare(`SELECT * FROM classes
               WHERE (status = 'open' OR id = ?) AND starts_at BETWEEN ? AND ?`).all(cls.id, from, to).filter((c) => localDate(c.starts_at) === date);
        return rows.some((c) => c.id === cls.id) ? rows : [cls, ...rows];
      }
      function zoneTripsLeft(classId, zone, { now = nowIso(), db = getDb() } = {}) {
        const cls = getClass(classId);
        if (!cls) return null;
        const siblings = sameDateClasses(db, cls);
        const limits = siblings.map((c) => zoneLimitsFor(c)[zone]).filter((v) => v !== null && v !== void 0);
        const limit = limits.length ? Math.min(...limits) : null;
        const ids = siblings.map((c) => c.id);
        const used = db.prepare(
          `SELECT COUNT(DISTINCT COALESCE(group_ref, public_ref)) AS n
         FROM registrations
        WHERE class_id IN (${ids.map(() => "?").join(",")})
          AND travel_zone = ?
          AND (
                status = 'confirmed'
             OR (status = 'held'    AND hold_expires_at  > ?)
             OR (status = 'offered' AND offer_expires_at > ?)
          )`
        ).get(...ids, zone, now, now).n;
        return {
          zone,
          date: localDate(cls.starts_at),
          limit,
          used,
          left: limit === null ? null : Math.max(0, limit - used)
        };
      }
      function zipFromAddress(address) {
        const m = String(address || "").match(/\b(\d{5})(?:-\d{4})?\s*$/);
        return m ? m[1] : "";
      }
      var DEFAULT_TIERS = [
        {
          minSize: 1,
          maxSize: 2,
          adjustPct: 10,
          label: "Small group rate",
          reason: "A visit costs the same to travel to and set up whether it trains two people or eight, so smaller bookings carry a share of that."
        },
        {
          minSize: 3,
          maxSize: 4,
          adjustPct: -5,
          label: "Group discount",
          reason: "Three or more makes the trip worthwhile, so the per-person price comes down."
        },
        {
          minSize: 5,
          maxSize: null,
          // null = no upper bound
          adjustPct: -10,
          label: "Large group discount",
          reason: "Our best rate \u2014 one visit, more people trained, less cost each."
        }
      ];
      function tiersFor(cls) {
        if (!cls || !cls.pricing_tiers) return DEFAULT_TIERS;
        try {
          const parsed = JSON.parse(cls.pricing_tiers);
          if (Array.isArray(parsed) && parsed.length) return parsed;
        } catch {
          console.warn(`[pricing] class ${cls.id} has unreadable tiers, using defaults`);
        }
        return DEFAULT_TIERS;
      }
      function matchTier(tiers, partySize) {
        return tiers.find((t) => partySize >= (t.minSize ?? 1) && (t.maxSize === null || t.maxSize === void 0 || partySize <= t.maxSize)) || null;
      }
      function priceFor(cls, partySize) {
        const base = cls.price_cents;
        const tier = matchTier(tiersFor(cls), partySize);
        const adjustPct = tier ? Number(tier.adjustPct) || 0 : 0;
        const perSeatCents = Math.round(base * (1 + adjustPct / 100));
        return {
          baseCents: base,
          perSeatCents,
          totalCents: perSeatCents * partySize,
          adjustPct,
          savingCents: (base - perSeatCents) * partySize,
          // negative when a surcharge
          label: tier ? tier.label : null,
          reason: tier ? tier.reason : null
        };
      }
      function priceLadder(cls, maxSize = cls.capacity || MAX_GROUP_SEATS) {
        return tiersFor(cls).map((t) => {
          const size = Math.max(1, t.minSize ?? 1);
          const quote = priceFor(cls, size);
          return {
            minSize: t.minSize ?? 1,
            maxSize: t.maxSize ?? null,
            adjustPct: Number(t.adjustPct) || 0,
            perSeatCents: quote.perSeatCents,
            label: t.label,
            reason: t.reason
          };
        }).filter((t) => t.minSize <= maxSize);
      }
      function slotGrid(cls) {
        const open = new Date(cls.starts_at).getTime();
        const close = new Date(cls.ends_at).getTime();
        const sessionMs = SESSION_MINUTES * 6e4;
        const stepMs = SLOT_STEP_MINUTES * 6e4;
        const out = [];
        for (let t = open; t + sessionMs <= close; t += stepMs) {
          out.push(new Date(t).toISOString());
        }
        return out;
      }
      function bookableStarts(cls, now) {
        const cutoff = new Date(now).getTime() + minNoticeHours() * 36e5;
        return slotGrid(cls).filter((t) => new Date(t).getTime() >= cutoff && new Date(t).getTime() > new Date(now).getTime());
      }
      function activeBookings(db, classIds, now) {
        const ids = Array.isArray(classIds) ? classIds : [classIds];
        return db.prepare(
          `SELECT slot_start, group_ref, public_ref, COUNT(*) AS seats
         FROM registrations
        WHERE class_id IN (${ids.map(() => "?").join(",")})
          AND slot_start IS NOT NULL
          AND (
                status = 'confirmed'
             OR (status = 'held'    AND hold_expires_at  > ?)
             OR (status = 'offered' AND offer_expires_at > ?)
          )
        GROUP BY class_id, slot_start, COALESCE(group_ref, public_ref)`
        ).all(...ids, now, now);
      }
      function instructorBookings(db, cls, now) {
        return activeBookings(db, sameDateClasses(db, cls).map((c) => c.id), now);
      }
      function daySlots(classId, { partySize = 1, now = nowIso(), zone = null } = {}) {
        const db = getDb();
        const cls = getClass(classId);
        if (!cls) return null;
        const trips = zone ? zoneTripsLeft(classId, zone, { now, db }) : null;
        const zoneFull = Boolean(trips && trips.left === 0);
        const own = activeBookings(db, classId, now);
        const seatsTaken = own.reduce((sum, b) => sum + b.seats, 0);
        const seatsLeft = Math.max(0, cls.capacity - seatsTaken);
        const booked = instructorBookings(db, cls, now);
        const nowMs = new Date(now).getTime();
        const noticeMs = minNoticeHours() * 36e5;
        const offDay = isTimeOff(localDate(cls.starts_at));
        const trainers = trainersOn(localDate(cls.starts_at));
        const open = bookableStarts(cls, now);
        const room = roomFor(booked, open, trainers);
        const slots = slotGrid(cls).map((start) => {
          const startMs = new Date(start).getTime();
          let reason = null;
          if (startMs <= nowMs) reason = "past";
          else if (startMs < nowMs + noticeMs) reason = "too_soon";
          else if (offDay) reason = "time_off";
          else if (trainers === 0) reason = "no_trainer";
          else if (!trainerFree(booked, start, trainers)) reason = "booked";
          else if (wastesDay(booked, open, start, trainers, room)) reason = "gap";
          else if (seatsLeft < partySize) reason = seatsLeft === 0 ? "day_full" : "not_enough_seats";
          else if (zoneFull) reason = "zone_full";
          return {
            start,
            end: new Date(new Date(start).getTime() + SESSION_MINUTES * 6e4).toISOString(),
            available: !reason,
            reason
          };
        });
        return {
          classId,
          opensAt: cls.starts_at,
          closesAt: cls.ends_at,
          sessionMinutes: SESSION_MINUTES,
          bufferMinutes: bufferMinutes(),
          trainers,
          capacity: cls.capacity,
          seatsTaken,
          seatsLeft,
          slots,
          availableSlots: slots.filter((s) => s.available).length,
          zoneTrips: trips
        };
      }
      function suggestAlternatives({
        classId,
        preferredTime = null,
        partySize = 1,
        zip = null,
        limit = 4
      } = {}) {
        const db = getDb();
        const source = getClass(classId);
        if (!source) return [];
        const now = nowIso();
        const candidates = db.prepare(
          `SELECT * FROM classes
        WHERE status = 'open' AND id != ? AND course_code = ? AND ends_at >= ?
        ORDER BY starts_at ASC`
        ).all(classId, source.course_code, now);
        const hhmm = (iso) => new Date(iso).toISOString().slice(11, 16);
        const wanted = preferredTime ? preferredTime.slice(0, 5) : null;
        let zone = null;
        if (zip) {
          const where = zones.zoneForZip(zip);
          if (!where.ok) return [];
          zone = where.zone;
        }
        const out = [];
        for (const c of candidates) {
          const day = daySlots(c.id, { partySize, now, zone });
          if (!day || !day.availableSlots) continue;
          const exact = wanted ? day.slots.find((s) => s.available && hhmm(s.start) === wanted) : null;
          out.push({
            classId: c.id,
            title: c.title,
            courseCode: c.course_code,
            opensAt: c.starts_at,
            closesAt: c.ends_at,
            priceCents: c.price_cents,
            seatsLeft: day.seatsLeft,
            matchesPreferredTime: Boolean(exact),
            suggestedSlot: (exact || day.slots.find((s) => s.available)).start,
            availableSlots: day.availableSlots
          });
        }
        out.sort((a, b) => b.matchesPreferredTime - a.matchesPreferredTime || new Date(a.opensAt) - new Date(b.opensAt));
        return out.slice(0, limit);
      }
      function holdSeat({
        classId,
        name,
        email,
        phone = "",
        notes = "",
        slotStart = null,
        address = "",
        zip = ""
      }) {
        return holdSeats({ classId, attendees: [name], email, phone, notes, slotStart, address, zip });
      }
      function holdSeats({
        classId,
        attendees,
        email,
        phone = "",
        notes = "",
        organiserName = null,
        slotStart = null,
        address = "",
        addressNotes = "",
        zip = "",
        consent = false
      }) {
        const db = getDb();
        const people = (attendees || []).map((a) => typeof a === "string" ? { name: a } : a || {}).map((a) => ({
          name: String(a.name ?? "").trim(),
          email: String(a.email ?? "").trim() || String(email ?? "").trim(),
          phone: String(a.phone ?? "").trim() || String(phone ?? "").trim(),
          ownContact: Boolean(String(a.email ?? "").trim() || String(a.phone ?? "").trim())
        })).filter((a) => a.name);
        if (!people.length) return { ok: false, reason: "no_attendees" };
        if (people.length > MAX_GROUP_SEATS) {
          return { ok: false, reason: "too_many_seats", max: MAX_GROUP_SEATS };
        }
        if (!slotStart) return { ok: false, reason: "slot_required" };
        if (!String(address).trim()) return { ok: false, reason: "address_required" };
        const run = db.transaction((args) => {
          const now = nowIso();
          const cls = getClass(args.classId);
          if (!cls) return { ok: false, reason: "no_such_class" };
          if (cls.status !== "open") return { ok: false, reason: "class_cancelled" };
          if (args.people.length > cls.capacity) {
            return { ok: false, reason: "too_many_seats", max: cls.capacity };
          }
          const where = zones.zoneForZip(args.zip);
          if (!where.ok) {
            return {
              ok: false,
              reason: where.reason === "zip_invalid" ? "zip_required" : "outside_service_area",
              zip: args.zip || null,
              miles: where.miles ?? null
            };
          }
          const taken = db.prepare(TAKEN_SQL).get({ classId: args.classId, now }).n;
          const available = cls.capacity - taken;
          if (available < args.people.length) {
            return {
              ok: false,
              reason: available <= 0 ? "full" : "not_enough_seats",
              available: Math.max(0, available),
              requested: args.people.length
            };
          }
          const grid = slotGrid(cls);
          if (!grid.includes(args.slotStart)) {
            return { ok: false, reason: "slot_not_offered", slots: grid };
          }
          const startMs = new Date(args.slotStart).getTime();
          if (startMs <= new Date(now).getTime()) {
            return { ok: false, reason: "slot_in_past" };
          }
          const notice = minNoticeHours();
          if (startMs < new Date(now).getTime() + notice * 36e5) {
            return { ok: false, reason: "slot_too_soon", noticeHours: notice };
          }
          if (isTimeOff(localDate(cls.starts_at))) {
            return { ok: false, reason: "day_off" };
          }
          const trainers = trainersOn(localDate(cls.starts_at));
          const others = instructorBookings(db, cls, now);
          if (!trainerFree(others, args.slotStart, trainers)) {
            return { ok: false, reason: "slot_taken", slotStart: args.slotStart };
          }
          if (wastesDay(others, bookableStarts(cls, now), args.slotStart, trainers)) {
            return { ok: false, reason: "slot_taken", slotStart: args.slotStart };
          }
          const trips = zoneTripsLeft(args.classId, where.zone, { now, db });
          if (trips.left === 0) {
            return {
              ok: false,
              reason: "zone_full",
              zone: where.zone,
              limit: trips.limit,
              date: trips.date
            };
          }
          const quote = priceFor(cls, args.people.length);
          const groupRef = args.people.length > 1 ? makeRef().replace("SPC-", "GRP-") : null;
          const holdExpiresAt = addMinutes(now, HOLD_MINUTES);
          const rows = args.people.map((person, i) => {
            const reg = insertRegistration(db, {
              classId: args.classId,
              status: "held",
              name: person.name,
              email: person.email,
              phone: person.phone,
              notes: args.notes,
              slotStart: args.slotStart,
              address: args.address,
              addressNotes: args.addressNotes,
              amountCents: quote.perSeatCents,
              // per seat; the group pays the sum
              holdExpiresAt,
              offerExpiresAt: null,
              groupRef,
              seatIndex: i,
              organiserName: groupRef ? args.organiserName : null,
              travelZone: where.zone,
              travelMiles: where.miles,
              consentAt: args.consent ? now : null,
              // One trip, one charge — carried on the organiser's seat only.
              travelCents: i === 0 ? where.feeCents : 0
            });
            logEvent(db, {
              registrationId: reg.id,
              classId: args.classId,
              kind: groupRef ? "group_hold_created" : "hold_created",
              detail: groupRef ? `${groupRef} seat ${i + 1}/${args.people.length}` : `expires ${holdExpiresAt}`
            });
            return reg;
          });
          return {
            ok: true,
            registration: rows[0],
            // the organiser's row drives payment
            registrations: rows,
            groupRef,
            seats: rows.length,
            seatsCents: quote.totalCents,
            travelCents: where.feeCents,
            totalCents: quote.totalCents + where.feeCents,
            travel: {
              zone: where.zone,
              miles: where.miles,
              feeCents: where.feeCents,
              city: where.city,
              state: where.state
            },
            pricing: quote,
            contactEmail: args.email,
            slotStart: args.slotStart,
            slotEnd: new Date(new Date(args.slotStart).getTime() + SESSION_MINUTES * 6e4).toISOString(),
            address: args.address,
            expiresAt: holdExpiresAt,
            holdMinutes: HOLD_MINUTES
          };
        });
        return run.immediate({
          classId,
          people,
          email,
          phone,
          notes,
          organiserName,
          slotStart,
          address: String(address).trim(),
          addressNotes: String(addressNotes).trim(),
          zip: (String(zip || "").trim() || zipFromAddress(address)).slice(0, 5),
          consent: Boolean(consent)
        });
      }
      function insertRegistration(db, r) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const ref = makeRef();
          try {
            const info = db.prepare(
              `INSERT INTO registrations
             (public_ref, class_id, status, student_name, student_email,
              student_phone, notes, amount_cents, hold_expires_at, offer_expires_at,
              group_ref, seat_index, organiser_name,
              slot_start, address, address_notes,
              travel_zone, travel_miles, travel_cents, consent_at)
           VALUES
             (@ref, @classId, @status, @name, @email,
              @phone, @notes, @amountCents, @holdExpiresAt, @offerExpiresAt,
              @groupRef, @seatIndex, @organiserName,
              @slotStart, @address, @addressNotes,
              @travelZone, @travelMiles, @travelCents, @consentAt)`
            ).run({
              groupRef: null,
              seatIndex: 0,
              organiserName: null,
              slotStart: null,
              address: "",
              addressNotes: "",
              travelZone: null,
              travelMiles: null,
              travelCents: 0,
              consentAt: null,
              ...r,
              ref
            });
            return db.prepare("SELECT * FROM registrations WHERE id = ?").get(info.lastInsertRowid);
          } catch (err) {
            if (!String(err.message).includes("UNIQUE") || attempt === 4) throw err;
          }
        }
      }
      function extendHold(publicRef, minutes = HOLD_MINUTES) {
        const db = getDb();
        const now = nowIso();
        const reg = findByRef(publicRef);
        if (!reg) return { ok: false, reason: "not_found" };
        if (reg.status !== "held") return { ok: false, reason: "not_held" };
        if (reg.hold_expires_at <= now) return { ok: false, reason: "expired" };
        const expiresAt = addMinutes(now, minutes);
        db.prepare(
          `UPDATE registrations
        SET hold_expires_at = ?, updated_at = ?
      WHERE id = ?`
        ).run(expiresAt, now, reg.id);
        return { ok: true, expiresAt };
      }
      function confirmPayment({ publicRef, provider, paymentRef, raw = null }) {
        const db = getDb();
        const run = db.transaction(() => {
          const now = nowIso();
          const reg = db.prepare("SELECT * FROM registrations WHERE public_ref = ?").get(publicRef);
          if (!reg) return { ok: false, reason: "not_found" };
          if (reg.status === "confirmed") {
            if (reg.payment_ref && paymentRef && reg.payment_ref !== paymentRef) {
              logEvent(db, {
                registrationId: reg.id,
                classId: reg.class_id,
                kind: "duplicate_payment_suspected",
                detail: `existing=${reg.payment_ref} incoming=${paymentRef}`
              });
              return { ok: false, reason: "already_confirmed_other_payment", registration: reg };
            }
            return { ok: true, alreadyConfirmed: true, registration: reg };
          }
          if (!["held", "offered"].includes(reg.status)) {
            return { ok: false, reason: `cannot_confirm_from_${reg.status}`, registration: reg };
          }
          const deadline = reg.status === "held" ? reg.hold_expires_at : reg.offer_expires_at;
          if (deadline && deadline <= now) {
            const avail = availability(reg.class_id, now);
            if (avail.available <= 0) {
              logEvent(db, {
                registrationId: reg.id,
                classId: reg.class_id,
                kind: "paid_after_expiry_no_seat",
                detail: `payment_ref=${paymentRef} \u2014 refund required`
              });
              return {
                ok: false,
                reason: "expired_and_full",
                registration: reg,
                needsRefund: true
              };
            }
            logEvent(db, {
              registrationId: reg.id,
              classId: reg.class_id,
              kind: "hold_lapsed_but_seat_free",
              detail: "confirmed anyway"
            });
          }
          const groupRows = reg.group_ref ? db.prepare(`SELECT * FROM registrations
                     WHERE group_ref = ? AND status IN ('held','offered')
                     ORDER BY seat_index ASC`).all(reg.group_ref) : [reg];
          for (const row of groupRows) {
            db.prepare(
              `UPDATE registrations
            SET status = 'confirmed',
                payment_provider = @provider,
                payment_ref = @paymentRef,
                payment_raw = @raw,
                hold_expires_at = NULL,
                offer_expires_at = NULL,
                confirmed_at = @now,
                updated_at = @now
          WHERE id = @id`
            ).run({
              id: row.id,
              provider,
              paymentRef: reg.group_ref ? `${paymentRef}#${row.seat_index}` : paymentRef,
              raw: raw ? JSON.stringify(raw) : null,
              now
            });
            logEvent(db, {
              registrationId: row.id,
              classId: row.class_id,
              kind: "confirmed",
              detail: reg.group_ref ? `${provider}:${paymentRef} (group ${reg.group_ref}, seat ${row.seat_index + 1})` : `${provider}:${paymentRef}`
            });
          }
          const updated = db.prepare("SELECT * FROM registrations WHERE id = ?").get(reg.id);
          queueConfirmationEmail(db, updated);
          if (reg.group_ref) {
            for (const row of groupRows) {
              if (row.id !== reg.id && row.student_email && row.student_email.toLowerCase() !== reg.student_email.toLowerCase()) {
                queueSeatEmail(db, row);
              }
            }
          }
          return {
            ok: true,
            registration: updated,
            seatsConfirmed: groupRows.length,
            groupRef: reg.group_ref || null
          };
        });
        return run.immediate();
      }
      function cancelGroup(groupRef, { reason = "" } = {}) {
        const db = getDb();
        const now = nowIso();
        const rows = db.prepare(`SELECT * FROM registrations
               WHERE group_ref = ? AND status NOT IN ('cancelled','expired')`).all(groupRef);
        if (!rows.length) return { ok: false, reason: "not_found" };
        for (const row of rows) {
          db.prepare(
            `UPDATE registrations
          SET status = 'cancelled', hold_expires_at = NULL,
              offer_expires_at = NULL, updated_at = ?, cancelled_at = ?
        WHERE id = ?`
          ).run(now, now, row.id);
          logEvent(db, {
            registrationId: row.id,
            classId: row.class_id,
            kind: "cancelled",
            detail: `group ${groupRef}: ${reason}`
          });
        }
        const promoted = promoteWaitlist(rows[0].class_id);
        return { ok: true, cancelled: rows.length, promoted };
      }
      function cancelRegistration(publicRef, { reason = "" } = {}) {
        const db = getDb();
        const now = nowIso();
        const reg = findByRef(publicRef);
        if (!reg) return { ok: false, reason: "not_found" };
        if (["cancelled", "expired"].includes(reg.status)) {
          return { ok: true, alreadyReleased: true, registration: reg };
        }
        db.prepare(
          `UPDATE registrations
        SET status = 'cancelled', hold_expires_at = NULL,
            offer_expires_at = NULL, updated_at = ?, cancelled_at = ?
      WHERE id = ?`
        ).run(now, now, reg.id);
        logEvent(db, {
          registrationId: reg.id,
          classId: reg.class_id,
          kind: "cancelled",
          detail: reason
        });
        const promoted = promoteWaitlist(reg.class_id);
        return { ok: true, promoted };
      }
      function joinWaitlist({
        classId,
        name,
        email,
        phone = "",
        notes = "",
        preferredTime = null,
        partySize = 1,
        address = "",
        consent = false
      }) {
        const db = getDb();
        const cls = getClass(classId);
        if (!cls) return { ok: false, reason: "no_such_class" };
        const existing = db.prepare(
          `SELECT * FROM registrations
        WHERE class_id = ? AND lower(student_email) = lower(?)
          AND status IN ('waitlist','offered','held','confirmed')`
        ).get(classId, email);
        if (existing) {
          return { ok: false, reason: "already_registered", registration: existing };
        }
        const reg = insertRegistration(db, {
          classId,
          status: "waitlist",
          name,
          email,
          phone,
          // Keep what they asked for, so an offer can come back with a time that
          // actually suits them rather than whatever happens to free up.
          notes: [
            notes,
            preferredTime ? `preferred time ${preferredTime}` : "",
            partySize > 1 ? `party of ${partySize}` : ""
          ].filter(Boolean).join(" \xB7 "),
          amountCents: cls.price_cents,
          holdExpiresAt: null,
          offerExpiresAt: null,
          address,
          consentAt: consent ? nowIso() : null
        });
        logEvent(db, {
          registrationId: reg.id,
          classId,
          kind: "waitlist_joined",
          detail: ""
        });
        const position = db.prepare(
          `SELECT COUNT(*) AS n FROM registrations
        WHERE class_id = ? AND status = 'waitlist' AND created_at <= ?`
        ).get(classId, reg.created_at).n;
        return { ok: true, registration: reg, position };
      }
      function promoteWaitlist(classId) {
        const db = getDb();
        const run = db.transaction(() => {
          const now = nowIso();
          const avail = availability(classId, now);
          if (!avail || avail.available <= 0) return [];
          if (avail.status !== "open") return [];
          const candidates = db.prepare(
            `SELECT * FROM registrations
          WHERE class_id = ? AND status = 'waitlist'
          ORDER BY created_at ASC, id ASC
          LIMIT ?`
          ).all(classId, avail.available);
          const promoted = [];
          for (const c of candidates) {
            const offerExpiresAt = addHours(now, OFFER_HOURS);
            db.prepare(
              `UPDATE registrations
            SET status = 'offered', offer_expires_at = ?, updated_at = ?
          WHERE id = ?`
            ).run(offerExpiresAt, now, c.id);
            logEvent(db, {
              registrationId: c.id,
              classId,
              kind: "waitlist_offered",
              detail: `expires ${offerExpiresAt}`
            });
            const updated = db.prepare("SELECT * FROM registrations WHERE id = ?").get(c.id);
            queueOfferEmail(db, updated, offerExpiresAt);
            promoted.push(updated);
          }
          return promoted;
        });
        return run.immediate();
      }
      function acceptOffer(publicRef) {
        const db = getDb();
        const now = nowIso();
        const reg = findByRef(publicRef);
        if (!reg) return { ok: false, reason: "not_found" };
        if (reg.status !== "offered") return { ok: false, reason: `not_offered_${reg.status}` };
        if (reg.offer_expires_at && reg.offer_expires_at <= now) {
          return { ok: false, reason: "offer_expired" };
        }
        const holdExpiresAt = addMinutes(now, HOLD_MINUTES);
        db.prepare(
          `UPDATE registrations
        SET status = 'held', hold_expires_at = ?, offer_expires_at = NULL, updated_at = ?
      WHERE id = ?`
        ).run(holdExpiresAt, now, reg.id);
        logEvent(db, {
          registrationId: reg.id,
          classId: reg.class_id,
          kind: "offer_accepted",
          detail: `hold until ${holdExpiresAt}`
        });
        return {
          ok: true,
          registration: findByRef(publicRef),
          expiresAt: holdExpiresAt,
          holdMinutes: HOLD_MINUTES
        };
      }
      function sweepExpired() {
        const db = getDb();
        const now = nowIso();
        const lapsedHolds = db.prepare(
          `SELECT * FROM registrations
        WHERE status = 'held' AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?`
        ).all(now);
        const lapsedOffers = db.prepare(
          `SELECT * FROM registrations
        WHERE status = 'offered' AND offer_expires_at IS NOT NULL AND offer_expires_at <= ?`
        ).all(now);
        const touchedClasses = /* @__PURE__ */ new Set();
        for (const r of [...lapsedHolds, ...lapsedOffers]) {
          db.prepare(
            `UPDATE registrations
          SET status = 'expired', hold_expires_at = NULL,
              offer_expires_at = NULL, updated_at = ?
        WHERE id = ?`
          ).run(now, r.id);
          logEvent(db, {
            registrationId: r.id,
            classId: r.class_id,
            kind: r.status === "held" ? "hold_expired" : "offer_expired",
            detail: ""
          });
          touchedClasses.add(r.class_id);
        }
        const promoted = [];
        for (const classId of touchedClasses) {
          promoted.push(...promoteWaitlist(classId));
        }
        return {
          expiredHolds: lapsedHolds.length,
          expiredOffers: lapsedOffers.length,
          promoted: promoted.length
        };
      }
      function findByRef(publicRef) {
        return getDb().prepare("SELECT * FROM registrations WHERE public_ref = ?").get(publicRef);
      }
      function bookingTotals(reg) {
        if (!reg) return null;
        const rows = reg.group_ref ? getDb().prepare(`SELECT amount_cents, travel_cents FROM registrations
                        WHERE group_ref = ? AND status NOT IN ('cancelled','expired')`).all(reg.group_ref) : [reg];
        const seatsCents = rows.reduce((sum, r) => sum + (r.amount_cents || 0), 0);
        const travelCents = rows.reduce((sum, r) => sum + (r.travel_cents || 0), 0);
        return {
          seats: rows.length,
          seatsCents,
          travelCents,
          travelZone: reg.travel_zone ?? null,
          totalCents: seatsCents + travelCents
        };
      }
      function listUpcomingClasses({ includeFull = true, from = nowIso() } = {}) {
        const db = getDb();
        const rows = db.prepare(
          `SELECT * FROM classes
        WHERE status = 'open' AND ends_at >= ?
        ORDER BY starts_at ASC`
        ).all(from);
        return rows.map((c) => ({ ...c, seats: availability(c.id, from) })).filter((c) => includeFull ? true : !c.seats.isFull);
      }
      function dayVisits(classId, now = nowIso()) {
        return getDb().prepare(
          `SELECT slot_start, address, travel_zone, travel_miles,
              COALESCE(group_ref, public_ref) AS visit_ref,
              COUNT(*) AS people,
              status = 'cancelled' AS removed,
              MAX(cancelled_at) AS removed_at,
              MAX(CASE WHEN status = 'confirmed' OR confirmed_at IS NOT NULL THEN 1 ELSE 0 END) AS paid,
              COALESCE(MAX(organiser_name),
                       MAX(CASE WHEN seat_index = 0 THEN student_name END),
                       MAX(student_name)) AS contact
         FROM registrations
        WHERE class_id = @classId
          AND slot_start IS NOT NULL
          AND (
                status IN ('confirmed','cancelled')
             OR (status = 'held'    AND hold_expires_at  > @now)
             OR (status = 'offered' AND offer_expires_at > @now)
          )
        GROUP BY slot_start, COALESCE(group_ref, public_ref), status = 'cancelled'
        ORDER BY status = 'cancelled', slot_start ASC`
        ).all({ classId, now }).map((v) => ({
          slotStart: v.slot_start,
          slotEnd: addMinutes(v.slot_start, SESSION_MINUTES),
          address: v.address,
          zone: v.travel_zone,
          miles: v.travel_miles,
          people: v.people,
          paid: Boolean(v.paid),
          contact: v.contact || "",
          // Removed by staff or the customer: kept, crossed out, for the records.
          removed: Boolean(v.removed),
          removedAt: v.removed_at || null
        }));
      }
      function purgeEmptyCancelledDays(now = nowIso()) {
        const db = getDb();
        return db.transaction(() => {
          const empty = db.prepare(
            `SELECT c.id FROM classes c
          WHERE c.status = 'cancelled' AND c.archived = 0
            AND NOT EXISTS (
              SELECT 1 FROM registrations r
               WHERE r.class_id = c.id
                 AND (
                       r.status IN ('confirmed','waitlist')
                    OR (r.status = 'held'    AND r.hold_expires_at  > @now)
                    OR (r.status = 'offered' AND r.offer_expires_at > @now)
                 )
            )`
          ).all({ now }).map((r) => r.id);
          const skip = db.prepare(
            `INSERT OR IGNORE INTO schedule_skips (schedule_id, day, course_code)
       SELECT schedule_id, ?, course_code FROM classes WHERE id = ? AND schedule_id IS NOT NULL`
          );
          for (const id of empty) {
            skip.run(localDate(getClass(id).starts_at), id);
            retireDay(db, id);
          }
          return empty;
        })();
      }
      function retireDay(db, id) {
        const history = db.prepare("SELECT 1 FROM registrations WHERE class_id = ? LIMIT 1").get(id);
        if (history) {
          db.prepare(`UPDATE classes SET status = 'cancelled', archived = 1 WHERE id = ?`).run(id);
          return "archived";
        }
        db.prepare("DELETE FROM classes WHERE id = ?").run(id);
        return "deleted";
      }
      function roster(classId) {
        return getDb().prepare(
          `SELECT public_ref, student_name, student_email, student_phone,
              status, amount_cents, confirmed_at, created_at,
              group_ref, seat_index, organiser_name,
              slot_start, address, address_notes, notes,
              travel_zone, travel_miles, travel_cents, cancelled_at
         FROM registrations
        WHERE class_id = ? AND status IN ('confirmed','held','offered','waitlist','cancelled')
        ORDER BY
          status = 'cancelled',
          slot_start IS NULL, slot_start ASC,
          CASE status
            WHEN 'confirmed' THEN 0 WHEN 'held' THEN 1
            WHEN 'offered'   THEN 2 ELSE 3
          END,
          created_at ASC, seat_index ASC`
        ).all(classId);
      }
      function logEvent(db, { registrationId, classId, kind, detail }) {
        db.prepare(
          `INSERT INTO events (registration_id, class_id, kind, detail)
     VALUES (?, ?, ?, ?)`
        ).run(registrationId ?? null, classId ?? null, kind, detail ?? "");
      }
      function queueConfirmationEmail(db, reg) {
        const cls = db.prepare("SELECT * FROM classes WHERE id = ?").get(reg.class_id);
        const group = reg.group_ref ? db.prepare(`SELECT student_name, public_ref FROM registrations
                   WHERE group_ref = ? AND status = 'confirmed'
                   ORDER BY seat_index ASC`).all(reg.group_ref) : null;
        const greeting = reg.organiser_name || reg.student_name;
        const when = reg.slot_start || cls.starts_at;
        const where = reg.address || cls.location;
        const totals = bookingTotals(reg);
        const dollars = (c) => `$${(c / 100).toFixed(2)}`;
        const charges = reg.travel_zone ? [
          ``,
          `Classes: ${dollars(totals.seatsCents)}`,
          `Travel (Zone ${reg.travel_zone}): ${totals.travelCents ? dollars(totals.travelCents) : "no charge"}`,
          `Total:   ${dollars(totals.totalCents)}`
        ] : [];
        const body = group && group.length > 1 ? [
          `Hi ${greeting},`,
          ``,
          `${group.length} seats are confirmed for ${cls.title}.`,
          `When:  ${when}`,
          `Where: ${where}`,
          ``,
          `Attending:`,
          ...group.map((g, i) => `  ${i + 1}. ${g.student_name} \u2014 ${g.public_ref}`),
          ...charges,
          ``,
          `Group reference: ${reg.group_ref}`,
          ``,
          `We come to you. Have everyone ready in comfortable clothes with floor`,
          `space for compressions. Each person receives their own card.`
        ] : [
          `Hi ${reg.student_name},`,
          ``,
          `You're confirmed for ${cls.title}.`,
          `When:  ${when}`,
          `Where: ${where}`,
          `Confirmation: ${reg.public_ref}`,
          ...charges,
          ``,
          `We come to you. Wear comfortable clothes and have floor space ready.`
        ];
        db.prepare(
          `INSERT INTO outbox (registration_id, to_email, subject, body) VALUES (?, ?, ?, ?)`
        ).run(
          reg.id,
          reg.student_email,
          group && group.length > 1 ? `${group.length} seats confirmed \u2014 ${cls.title}` : `You're registered \u2014 ${cls.title}`,
          body.join("\n")
        );
      }
      function queueSeatEmail(db, reg) {
        const cls = db.prepare("SELECT * FROM classes WHERE id = ?").get(reg.class_id);
        db.prepare(
          `INSERT INTO outbox (registration_id, to_email, subject, body) VALUES (?, ?, ?, ?)`
        ).run(
          reg.id,
          reg.student_email,
          `You're registered \u2014 ${cls.title}`,
          [
            `Hi ${reg.student_name},`,
            ``,
            `A seat has been booked for you on ${cls.title}.`,
            `When:  ${reg.slot_start || cls.starts_at}`,
            `Where: ${reg.address || cls.location}`,
            `Your confirmation: ${reg.public_ref}`,
            ``,
            `Arrive 10 minutes early and wear comfortable clothes.`
          ].join("\n")
        );
      }
      function queueOfferEmail(db, reg, expiresAt) {
        const cls = db.prepare("SELECT * FROM classes WHERE id = ?").get(reg.class_id);
        db.prepare(
          `INSERT INTO outbox (registration_id, to_email, subject, body) VALUES (?, ?, ?, ?)`
        ).run(
          reg.id,
          reg.student_email,
          `A seat opened up \u2014 ${cls.title}`,
          [
            `Hi ${reg.student_name},`,
            ``,
            `A time opened up for ${cls.title} on ${cls.starts_at.slice(0, 10)}.`,
            `It's reserved for you until ${expiresAt}.`,
            ``,
            `Claim it here: [OFFER_LINK]/offer/${reg.public_ref}`
          ].join("\n")
        );
      }
      module.exports = {
        bufferMinutes,
        COURSES,
        courses,
        coursePrice,
        setCoursePrice,
        defaultTrainers,
        trainersOn,
        setTrainers,
        overbooked,
        getSetting,
        setSetting,
        minNoticeHours,
        isTimeOff,
        BUSINESS_TZ,
        localDate,
        zoneLimitsFor,
        zoneTripsLeft,
        zipFromAddress,
        bookingTotals,
        DEFAULT_TIERS,
        priceFor,
        priceLadder,
        tiersFor,
        HOLD_MINUTES,
        OFFER_HOURS,
        MAX_GROUP_SEATS,
        SESSION_MINUTES,
        BUFFER_MINUTES,
        SLOT_STEP_MINUTES,
        BLOCK_MINUTES,
        daySlots,
        slotGrid,
        suggestAlternatives,
        holdSeats,
        nowIso,
        addMinutes,
        availability,
        holdSeat,
        extendHold,
        confirmPayment,
        cancelRegistration,
        cancelGroup,
        joinWaitlist,
        promoteWaitlist,
        acceptOffer,
        sweepExpired,
        findByRef,
        getClass,
        listUpcomingClasses,
        roster,
        dayVisits,
        purgeEmptyCancelledDays,
        retireDay
      };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/calendar.js
  var require_calendar = __commonJS({
    "../vlottiz/spectrumcpr_web/src/calendar.js"(exports, module) {
      "use strict";
      function toCalendarStamp(iso) {
        return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      }
      function escapeIcsText(value) {
        return String(value ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
      }
      function foldLine(line) {
        if (line.length <= 75) return line;
        const chunks = [line.slice(0, 75)];
        let rest = line.slice(75);
        while (rest.length > 74) {
          chunks.push(" " + rest.slice(0, 74));
          rest = rest.slice(74);
        }
        if (rest.length) chunks.push(" " + rest);
        return chunks.join("\r\n");
      }
      function buildDescription({ cls, registration, orgName }) {
        return [
          `${cls.title} with ${orgName}.`,
          "",
          `Confirmation: ${registration.public_ref}`,
          registration.address ? `Address: ${registration.address}` : "",
          registration.address_notes ? `Notes: ${registration.address_notes}` : "",
          "",
          "The instructor comes to you. Wear comfortable clothes and have floor space",
          "ready for compressions. Certification cards are issued before they leave."
        ].filter((l) => l !== null).join("\n");
      }
      function eventTimes({ cls, registration, sessionMinutes = 240 }) {
        if (!registration.slot_start) return { start: cls.starts_at, end: cls.ends_at };
        const start = registration.slot_start;
        const end = new Date(new Date(start).getTime() + sessionMinutes * 6e4).toISOString();
        return { start, end };
      }
      function buildIcs({
        cls,
        registration,
        orgName = "Spectrum CPR + First Aid",
        domain = "spectrumcpr.local",
        sessionMinutes = 240
      }) {
        const now = toCalendarStamp((/* @__PURE__ */ new Date()).toISOString());
        const { start, end } = eventTimes({ cls, registration, sessionMinutes });
        const lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          `PRODID:-//${escapeIcsText(orgName)}//Booking//EN`,
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          `UID:${registration.public_ref}@${domain}`,
          `DTSTAMP:${now}`,
          `DTSTART:${toCalendarStamp(start)}`,
          `DTEND:${toCalendarStamp(end)}`,
          `SUMMARY:${escapeIcsText(cls.title)}`,
          `DESCRIPTION:${escapeIcsText(buildDescription({ cls, registration, orgName }))}`,
          `LOCATION:${escapeIcsText(registration.address || cls.location)}`,
          "STATUS:CONFIRMED",
          "TRANSP:OPAQUE",
          // Two nudges: the night before, and an hour out.
          "BEGIN:VALARM",
          "TRIGGER:-P1D",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeIcsText(cls.title)} is tomorrow`,
          "END:VALARM",
          "BEGIN:VALARM",
          "TRIGGER:-PT1H",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeIcsText(cls.title)} starts in an hour`,
          "END:VALARM",
          "END:VEVENT",
          "END:VCALENDAR"
        ];
        return lines.map(foldLine).join("\r\n") + "\r\n";
      }
      function buildGoogleUrl({
        cls,
        registration,
        orgName = "Spectrum CPR + First Aid",
        sessionMinutes = 240
      }) {
        const { start, end } = eventTimes({ cls, registration, sessionMinutes });
        const params = new URLSearchParams({
          action: "TEMPLATE",
          text: cls.title,
          dates: `${toCalendarStamp(start)}/${toCalendarStamp(end)}`,
          details: buildDescription({ cls, registration, orgName }),
          location: registration.address || cls.location
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
      }
      module.exports = { buildIcs, buildGoogleUrl, toCalendarStamp, eventTimes };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/payments/mock.js
  var require_mock = __commonJS({
    "../vlottiz/spectrumcpr_web/src/payments/mock.js"(exports, module) {
      "use strict";
      var crypto = require_crypto();
      var name = "mock";
      async function createSession({ registration, cls, amountCents, seatCount = 1 }) {
        const token = "MOCKTOKEN_" + crypto.randomBytes(12).toString("hex").toUpperCase();
        const total = amountCents ?? registration.amount_cents;
        return {
          provider: name,
          mode: "mock",
          sessionToken: token,
          // Real Converge returns nothing like this — the token goes to PayWithConverge.js.
          checkoutUrl: `/mock-checkout?ref=${encodeURIComponent(registration.public_ref)}`,
          amountCents: total,
          seatCount,
          description: seatCount > 1 ? `${cls.title} \u2014 ${seatCount} seats` : cls.title,
          // Visible in the API response so nobody mistakes staging for production.
          warning: "MOCK PAYMENT \u2014 no card is charged and no money moves."
        };
      }
      async function verify(payload) {
        const approved = payload?.outcome === "approve";
        if (!approved) {
          return { ok: false, reason: "declined", raw: { mock: true, ...payload } };
        }
        const seed = String(payload?.publicRef || "unknown");
        const digest = crypto.createHash("sha256").update(seed).digest("hex");
        return {
          ok: true,
          paymentRef: "MOCKTXN_" + digest.slice(0, 16).toUpperCase(),
          raw: { mock: true, approvedAt: (/* @__PURE__ */ new Date()).toISOString(), ...payload }
        };
      }
      async function webhook(req) {
        const body = req.body || {};
        if (!body.publicRef) return { ok: false, reason: "publicRef missing" };
        const v = await verify({ ...body });
        return v.ok ? { ok: true, publicRef: String(body.publicRef), paymentRef: v.paymentRef, raw: v.raw } : { ok: false, reason: v.reason };
      }
      module.exports = { name, createSession, verify, webhook };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/payments/converge.js
  var require_converge = __commonJS({
    "../vlottiz/spectrumcpr_web/src/payments/converge.js"(exports, module) {
      "use strict";
      var name = "converge";
      var ENDPOINTS = {
        demo: "https://api.demo.convergepay.com/hosted-payments/transaction_token",
        production: "https://api.convergepay.com/hosted-payments/transaction_token"
      };
      function config() {
        const cfg = {
          merchantId: process.env.CONVERGE_MERCHANT_ID,
          userId: process.env.CONVERGE_USER_ID,
          pin: process.env.CONVERGE_PIN,
          env: process.env.CONVERGE_ENV === "production" ? "production" : "demo"
        };
        const missing = Object.entries(cfg).filter(([k, v]) => k !== "env" && !v).map(([k]) => k);
        if (missing.length) {
          throw new Error(
            `Converge is not configured. Missing: ${missing.join(", ")}. Set these in .env, or run with PAYMENT_PROVIDER=mock while waiting on Elavon.`
          );
        }
        return cfg;
      }
      async function createSession({ registration, cls, amountCents, seatCount = 1 }) {
        const cfg = config();
        const total = amountCents ?? registration.amount_cents;
        const body = new URLSearchParams({
          ssl_merchant_id: cfg.merchantId,
          ssl_user_id: cfg.userId,
          ssl_pin: cfg.pin,
          ssl_transaction_type: "ccsale",
          ssl_amount: (total / 100).toFixed(2),
          // Our reference travels with the transaction and comes back in the
          // response — this is how a payment maps to a seat without scraping email.
          ssl_invoice_number: registration.public_ref,
          ssl_description: seatCount > 1 ? `${cls.title} (${seatCount} seats)` : cls.title,
          ssl_first_name: registration.student_name.split(" ")[0] || "",
          ssl_last_name: registration.student_name.split(" ").slice(1).join(" ") || "",
          ssl_email: registration.student_email
        });
        const res = await fetch(ENDPOINTS[cfg.env], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
        const text = (await res.text()).trim();
        if (!res.ok || text.startsWith("<")) {
          throw new Error(`Converge token request failed (${res.status}): ${text.slice(0, 300)}`);
        }
        return {
          provider: name,
          mode: "lightbox",
          sessionToken: text,
          scriptUrl: cfg.env === "production" ? "https://api.convergepay.com/hosted-payments/PayWithConverge.js" : "https://api.demo.convergepay.com/hosted-payments/PayWithConverge.js",
          amountCents: total,
          seatCount,
          description: seatCount > 1 ? `${cls.title} \u2014 ${seatCount} seats` : cls.title
        };
      }
      async function verify(payload) {
        const result = String(payload?.ssl_result ?? "");
        const message = String(payload?.ssl_result_message ?? "");
        const txnId = payload?.ssl_txn_id;
        if (result !== "0" || !txnId) {
          return {
            ok: false,
            reason: message || `declined (ssl_result=${result || "missing"})`,
            raw: payload
          };
        }
        return { ok: true, paymentRef: String(txnId), raw: payload };
      }
      module.exports = { name, createSession, verify, ENDPOINTS };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/payments/index.js
  var require_payments = __commonJS({
    "../vlottiz/spectrumcpr_web/src/payments/index.js"(exports, module) {
      "use strict";
      var PROVIDER = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
      var providers = {
        mock: require_mock(),
        converge: require_converge()
        // yourprovider: require('./yourprovider'),   // ← add a new processor here
      };
      var active = providers[PROVIDER];
      if (!active) {
        throw new Error(
          `Unknown PAYMENT_PROVIDER "${PROVIDER}". Expected one of: ${Object.keys(providers).join(", ")}`
        );
      }
      var isMock = PROVIDER === "mock";
      if (isMock) {
        console.warn(
          "\n  \u26A0  PAYMENT PROVIDER: MOCK \u2014 no cards are charged, no money moves.\n     Set PAYMENT_PROVIDER=converge once Elavon credentials are in place.\n"
        );
      }
      module.exports = {
        name: active.name,
        isMock,
        createSession: active.createSession,
        verify: active.verify,
        // Server-to-server payment notice, for providers that send one.
        webhook: typeof active.webhook === "function" ? active.webhook : null
      };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/schedule.js
  var require_schedule = __commonJS({
    "../vlottiz/spectrumcpr_web/src/schedule.js"(exports, module) {
      "use strict";
      var { getDb } = require_db();
      var seats = require_seats();
      var TZ = seats.BUSINESS_TZ;
      var MAX_WEEKS_AHEAD = 26;
      function addDays(ymd, n) {
        const [y, m, d] = ymd.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
      }
      function weekday(ymd) {
        const [y, m, d] = ymd.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      }
      var offsetFormats = /* @__PURE__ */ new Map();
      function tzOffsetMs(instant, tz) {
        let fmt = offsetFormats.get(tz);
        if (!fmt) {
          fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          offsetFormats.set(tz, fmt);
        }
        const parts = Object.fromEntries(fmt.formatToParts(instant).map((p) => [p.type, p.value]));
        const asUtc = Date.UTC(
          +parts.year,
          +parts.month - 1,
          +parts.day,
          +parts.hour,
          +parts.minute,
          +parts.second
        );
        return asUtc - Math.floor(instant.getTime() / 1e3) * 1e3;
      }
      function zonedToUtc(ymd, hhmm, tz = TZ) {
        const [y, m, d] = ymd.split("-").map(Number);
        const [h, min] = hhmm.split(":").map(Number);
        const wall = Date.UTC(y, m - 1, d, h, min);
        let t = wall - tzOffsetMs(new Date(wall), tz);
        const again = wall - tzOffsetMs(new Date(t), tz);
        if (again !== t) t = again;
        return new Date(t).toISOString();
      }
      var today = (now = (/* @__PURE__ */ new Date()).toISOString()) => seats.localDate(now);
      function parseSchedule(row) {
        if (!row) return null;
        return {
          id: row.id,
          courses: JSON.parse(row.courses),
          week: JSON.parse(row.week),
          weeksAhead: row.weeks_ahead,
          capacity: row.capacity,
          pricingTiers: row.pricing_tiers ? JSON.parse(row.pricing_tiers) : null,
          zoneLimits: row.zone_limits ? JSON.parse(row.zone_limits) : null,
          startsOn: row.starts_on,
          filledThrough: row.filled_through,
          active: Boolean(row.active)
        };
      }
      function getSchedule(id) {
        return parseSchedule(getDb().prepare("SELECT * FROM schedules WHERE id = ?").get(id));
      }
      function listSchedules() {
        return getDb().prepare("SELECT * FROM schedules ORDER BY id").all().map(parseSchedule);
      }
      function listTimeOff() {
        return getDb().prepare("SELECT * FROM time_off WHERE ends_on >= ? ORDER BY starts_on").all(today()).map((r) => ({ id: r.id, startsOn: r.starts_on, endsOn: r.ends_on, note: r.note }));
      }
      function fillSchedule(id, now = (/* @__PURE__ */ new Date()).toISOString()) {
        const db = getDb();
        const row = db.prepare("SELECT * FROM schedules WHERE id = ?").get(id);
        const s = parseSchedule(row);
        if (!s || !s.active) return 0;
        const first = [s.startsOn, today(now), s.filledThrough ? addDays(s.filledThrough, 1) : null].filter(Boolean).sort().pop();
        const horizon = addDays(today(now), s.weeksAhead * 7 - 1);
        if (first > horizon) return 0;
        const have = new Set(db.prepare(`SELECT course_code, starts_at FROM classes
               WHERE schedule_id = ? AND starts_at >= ? AND archived = 0`).all(id, zonedToUtc(first, "00:00")).map((c) => `${seats.localDate(c.starts_at)}|${c.course_code}`));
        const skipped = new Set(db.prepare("SELECT day, course_code FROM schedule_skips WHERE schedule_id = ? AND day >= ?").all(id, first).map((k) => `${k.day}|${k.course_code}`));
        const insert = db.prepare(
          `INSERT INTO classes
       (course_code, title, starts_at, ends_at, location, capacity, price_cents,
        pricing_tiers, zone_limits, schedule_id)
     VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?)`
        );
        let made = 0;
        db.transaction(() => {
          for (let day = first; day <= horizon; day = addDays(day, 1)) {
            const hours = s.week[weekday(day)];
            if (!hours || !hours.on) continue;
            if (seats.isTimeOff(day)) continue;
            const startsAt = zonedToUtc(day, hours.open);
            const endsAt = zonedToUtc(day, hours.close);
            if (endsAt <= now) continue;
            for (const c of s.courses) {
              const key = `${day}|${c.code}`;
              if (have.has(key) || skipped.has(key)) continue;
              insert.run(
                c.code,
                c.title,
                startsAt,
                endsAt,
                s.capacity,
                seats.coursePrice(c.code) ?? c.priceCents,
                row.pricing_tiers,
                row.zone_limits,
                id
              );
              made++;
            }
          }
          db.prepare("UPDATE schedules SET filled_through = ? WHERE id = ?").run(horizon, id);
        })();
        return made;
      }
      function fillSchedules(now = (/* @__PURE__ */ new Date()).toISOString()) {
        return getDb().prepare("SELECT id FROM schedules WHERE active = 1").all().reduce((n, r) => n + fillSchedule(r.id, now), 0);
      }
      function clearFutureDays(id, now = (/* @__PURE__ */ new Date()).toISOString()) {
        const db = getDb();
        const ids = db.prepare(
          `SELECT c.id FROM classes c
        WHERE c.schedule_id = ? AND c.ends_at > ? AND c.archived = 0
          AND NOT EXISTS (
            SELECT 1 FROM registrations r
             WHERE r.class_id = c.id
               AND (   r.status IN ('confirmed','waitlist')
                    OR (r.status = 'held'    AND r.hold_expires_at  > ?)
                    OR (r.status = 'offered' AND r.offer_expires_at > ?)))`
        ).all(id, now, now, now).map((r) => r.id);
        db.transaction(() => ids.forEach((x) => seats.retireDay(db, x)))();
        return ids.length;
      }
      var HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
      function cleanSchedule(body, { sessionMinutes }) {
        const b = body || {};
        const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        if (!Array.isArray(b.courses) || !b.courses.length) {
          return { error: "Pick at least one course to offer." };
        }
        const courses = [];
        for (const c of b.courses) {
          const code = String(c?.code || "").trim();
          const known = seats.courses().find((x) => x.code === code);
          const title = String(c?.title || known?.title || "").trim();
          const priceCents = known ? known.priceCents : Number(c?.priceCents);
          if (!code || title.length < 2) return { error: "Each course needs a name." };
          if (!Number.isInteger(priceCents) || priceCents < 0) {
            return { error: `Enter a price for ${title}.` };
          }
          if (courses.some((x) => x.code === code)) return { error: `${title} is listed twice.` };
          courses.push({ code, title, priceCents });
        }
        if (!Array.isArray(b.week) || b.week.length !== 7) return { error: "Set the weekly hours." };
        const week = b.week.map((d) => ({
          on: Boolean(d && d.on),
          open: String(d?.open || ""),
          close: String(d?.close || "")
        }));
        if (!week.some((d) => d.on)) return { error: "Tick at least one open day." };
        for (const [i, d] of week.entries()) {
          if (!d.on) continue;
          if (!HHMM.test(d.open) || !HHMM.test(d.close)) return { error: `${DAY[i]}: set opening and closing times.` };
          const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
          if (mins(d.close) <= mins(d.open)) return { error: `${DAY[i]}: closing time must be after opening.` };
          if (mins(d.close) - mins(d.open) < sessionMinutes) {
            const h = sessionMinutes / 60;
            return { error: `${DAY[i]}: open at least ${h} hour${h === 1 ? "" : "s"} \u2014 one full session.` };
          }
        }
        const weeksAhead = Number(b.weeksAhead);
        if (!Number.isInteger(weeksAhead) || weeksAhead < 1 || weeksAhead > MAX_WEEKS_AHEAD) {
          return { error: `Keep between 1 and ${MAX_WEEKS_AHEAD} weeks open.` };
        }
        const capacity = Number(b.capacity);
        if (!Number.isInteger(capacity) || capacity < 1) return { error: "Set at least one place." };
        const startsOn = /^\d{4}-\d{2}-\d{2}$/.test(String(b.startsOn || "")) ? b.startsOn : today();
        return { value: { courses, week, weeksAhead, capacity, startsOn } };
      }
      function createSchedule(v, { pricingTiers = null, zoneLimits = null } = {}) {
        const info = getDb().prepare(
          `INSERT INTO schedules
         (courses, week, weeks_ahead, capacity, pricing_tiers, zone_limits, starts_on)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          JSON.stringify(v.courses),
          JSON.stringify(v.week),
          v.weeksAhead,
          v.capacity,
          pricingTiers,
          zoneLimits,
          v.startsOn
        );
        const id = Number(info.lastInsertRowid);
        return { id, created: fillSchedule(id) };
      }
      function updateSchedule(id, v, { pricingTiers = null, zoneLimits = null } = {}) {
        const db = getDb();
        db.prepare(
          `UPDATE schedules
        SET courses = ?, week = ?, weeks_ahead = ?, capacity = ?,
            pricing_tiers = ?, zone_limits = ?, starts_on = ?, filled_through = NULL
      WHERE id = ?`
        ).run(
          JSON.stringify(v.courses),
          JSON.stringify(v.week),
          v.weeksAhead,
          v.capacity,
          pricingTiers,
          zoneLimits,
          v.startsOn,
          id
        );
        const removed = clearFutureDays(id);
        return { removed, created: fillSchedule(id) };
      }
      function setScheduleActive(id, active) {
        getDb().prepare("UPDATE schedules SET active = ?, filled_through = NULL WHERE id = ?").run(active ? 1 : 0, id);
        return active ? fillSchedule(id) : 0;
      }
      function deleteSchedule(id) {
        const db = getDb();
        const removed = clearFutureDays(id);
        db.transaction(() => {
          db.prepare("UPDATE classes SET schedule_id = NULL WHERE schedule_id = ?").run(id);
          db.prepare("DELETE FROM schedule_skips WHERE schedule_id = ?").run(id);
          db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
        })();
        return { removed };
      }
      function addTimeOff({ startsOn, endsOn, note = "" }, now = (/* @__PURE__ */ new Date()).toISOString()) {
        const db = getDb();
        const info = db.prepare("INSERT INTO time_off (starts_on, ends_on, note) VALUES (?, ?, ?)").run(startsOn, endsOn, String(note).slice(0, 120));
        const inRange = db.prepare(`SELECT * FROM classes WHERE status = 'open' AND starts_at > ?
               AND starts_at BETWEEN ? AND ?`).all(now, zonedToUtc(addDays(startsOn, -1), "00:00"), zonedToUtc(addDays(endsOn, 2), "00:00")).filter((c) => {
          const d = seats.localDate(c.starts_at);
          return d >= startsOn && d <= endsOn;
        });
        const removed = [];
        const kept = [];
        db.transaction(() => {
          for (const c of inRange) {
            const people = db.prepare(
              `SELECT COUNT(*) AS n FROM registrations WHERE class_id = ?
           AND (status IN ('confirmed','waitlist')
                OR (status = 'held'    AND hold_expires_at  > ?)
                OR (status = 'offered' AND offer_expires_at > ?))`
            ).get(c.id, now, now).n;
            if (people) kept.push({ id: c.id, title: c.title, startsAt: c.starts_at, people });
            else {
              seats.retireDay(db, c.id);
              removed.push(c.id);
            }
          }
        })();
        return { id: Number(info.lastInsertRowid), removed: removed.length, kept };
      }
      function removeTimeOff(id) {
        const db = getDb();
        db.prepare("DELETE FROM time_off WHERE id = ?").run(id);
        db.prepare("UPDATE schedules SET filled_through = NULL WHERE active = 1").run();
        return fillSchedules();
      }
      module.exports = {
        MAX_WEEKS_AHEAD,
        addDays,
        weekday,
        zonedToUtc,
        getSchedule,
        listSchedules,
        listTimeOff,
        fillSchedule,
        fillSchedules,
        clearFutureDays,
        cleanSchedule,
        createSchedule,
        updateSchedule,
        setScheduleActive,
        deleteSchedule,
        addTimeOff,
        removeTimeOff
      };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/records.js
  var require_records = __commonJS({
    "../vlottiz/spectrumcpr_web/src/records.js"(exports, module) {
      "use strict";
      var { getDb } = require_db();
      var CERT_YEARS = 2;
      var RETENTION_DAYS = Number(process.env.RETENTION_DAYS || 730);
      var REMINDER_DAYS = Number(process.env.REMINDER_DAYS || 30);
      var DAY_MS = 864e5;
      var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
      var CERT_AT = "COALESCE(r.slot_start, c.starts_at)";
      function plusYears(iso, years) {
        const d = new Date(iso);
        d.setUTCFullYear(d.getUTCFullYear() + years);
        return d.toISOString();
      }
      function billing() {
        return getDb().prepare(
          `SELECT r.public_ref AS ref, r.group_ref AS groupRef,
              r.student_name AS name, r.student_email AS email, r.student_phone AS phone,
              r.address, r.organiser_name AS organiser,
              c.title AS course, c.course_code AS courseCode,
              ${CERT_AT} AS classAt,
              r.amount_cents AS seatCents, r.travel_cents AS travelCents,
              r.travel_zone AS zone,
              r.confirmed_at AS paidAt, r.payment_provider AS paidBy, r.payment_ref AS paymentRef,
              r.status, r.cancelled_at AS removedAt, r.consent_at AS consentAt,
              r.anonymized_at AS anonymizedAt
         FROM registrations r JOIN classes c ON c.id = r.class_id
        WHERE r.confirmed_at IS NOT NULL
        ORDER BY r.confirmed_at DESC, r.group_ref, r.seat_index`
        ).all().map((x) => ({ ...x, removed: x.status === "cancelled" }));
      }
      function renewals({ withinDays = null, now = nowIso() } = {}) {
        const rows = getDb().prepare(
          `SELECT r.public_ref AS ref, r.student_name AS name, r.student_email AS email,
              r.student_phone AS phone, r.address,
              c.title AS course, c.course_code AS courseCode,
              ${CERT_AT} AS classAt, r.reminder_sent_at AS reminderSentAt, r.consent_at AS consentAt
         FROM registrations r JOIN classes c ON c.id = r.class_id
        WHERE r.status = 'confirmed' AND r.anonymized_at IS NULL
          AND ${CERT_AT} <= ?`
        ).all(now).map((x) => {
          const expiresAt = plusYears(x.classAt, CERT_YEARS);
          return { ...x, expiresAt, daysLeft: Math.ceil((new Date(expiresAt) - new Date(now)) / DAY_MS) };
        }).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
        return withinDays === null ? rows : rows.filter((x) => x.daysLeft <= withinDays);
      }
      function queueRenewalReminders(now = nowIso()) {
        const db = getDb();
        const due = renewals({ withinDays: REMINDER_DAYS, now }).filter((x) => !x.reminderSentAt && x.email && x.daysLeft > -30);
        if (!due.length) return 0;
        const byInbox = /* @__PURE__ */ new Map();
        for (const x of due) {
          const key = `${x.email.toLowerCase()}|${x.courseCode}|${x.expiresAt.slice(0, 10)}`;
          if (!byInbox.has(key)) byInbox.set(key, []);
          byInbox.get(key).push(x);
        }
        const orgName = process.env.ORG_NAME || "Spectrum CPR + First Aid";
        const insert = db.prepare(
          "INSERT INTO outbox (registration_id, to_email, subject, body) VALUES (?, ?, ?, ?)"
        );
        const mark = db.prepare("UPDATE registrations SET reminder_sent_at = ? WHERE public_ref = ?");
        const regId = db.prepare("SELECT id FROM registrations WHERE public_ref = ?");
        const date = (iso) => new Date(iso).toLocaleDateString(
          "en-US",
          { timeZone: process.env.BUSINESS_TZ || "America/Los_Angeles", month: "long", day: "numeric", year: "numeric" }
        );
        db.transaction(() => {
          for (const people of byInbox.values()) {
            const first = people[0];
            const names = people.map((p) => p.name);
            insert.run(
              regId.get(first.ref)?.id ?? null,
              first.email,
              `Your ${first.course} card expires ${date(first.expiresAt)}`,
              [
                `Hi ${names.length > 1 ? "there" : first.name},`,
                ``,
                `${names.length > 1 ? `The ${first.course} cards for ${names.join(", ")} expire` : `Your ${first.course} card expires`} on ${date(first.expiresAt)}.`,
                ``,
                `Book a renewal class and we'll come to you, the same as last time.`,
                ``,
                `\u2014 ${orgName}`
              ].join("\n")
            );
            for (const p of people) mark.run(now, p.ref);
          }
        })();
        return byInbox.size;
      }
      function anonymizeExpired(now = nowIso()) {
        const db = getDb();
        const cutoff = new Date(new Date(now).getTime() - RETENTION_DAYS * DAY_MS).toISOString();
        const ids = db.prepare(
          `SELECT r.id FROM registrations r JOIN classes c ON c.id = r.class_id
        WHERE r.anonymized_at IS NULL AND ${CERT_AT} < ?`
        ).all(cutoff).map((r) => r.id);
        if (!ids.length) return 0;
        const clear = db.prepare(
          `UPDATE registrations
        SET student_name = 'Details removed after 2 years', student_email = '',
            student_phone = '', address = '', address_notes = '', notes = '',
            organiser_name = NULL, anonymized_at = ?
      WHERE id = ?`
        );
        const mail = db.prepare("DELETE FROM outbox WHERE registration_id = ?");
        db.transaction(() => {
          for (const id of ids) {
            clear.run(now, id);
            mail.run(id);
          }
        })();
        return ids.length;
      }
      module.exports = {
        CERT_YEARS,
        RETENTION_DAYS,
        REMINDER_DAYS,
        plusYears,
        billing,
        renewals,
        queueRenewalReminders,
        anonymizeExpired
      };
    }
  });

  // ../vlottiz/spectrumcpr_web/src/server.js
  var require_server = __commonJS({
    "../vlottiz/spectrumcpr_web/src/server.js"(exports, module) {
      "use strict";
      var path = require_path();
      var express = require_express();
      var seats = require_seats();
      var seats_ = seats;
      var calendar = require_calendar();
      var address = require_address();
      var payments = require_payments();
      var zones = require_zones();
      var schedule = require_schedule();
      var records = require_records();
      var CONSENT_MESSAGE = "Please tick the box to agree to us keeping your details, so we can book you in.";
      var { getDb } = require_db();
      var app = express();
      var PORT = process.env.PORT || 3e3;
      var ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
      var ORG_NAME = process.env.ORG_NAME || "Spectrum CPR + First Aid";
      var SITE_DIR = process.env.SITE_DIR || path.join(__dirname, "..");
      var keepRaw = (req, _res, buf) => {
        req.rawBody = buf;
      };
      app.use(express.json({ limit: "64kb", verify: keepRaw }));
      app.use(express.urlencoded({ extended: true, verify: keepRaw }));
      var PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
      var ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",").map((o) => o.trim()).filter(Boolean);
      app.use((req, res, next) => {
        const origin = req.get("origin");
        if (ALLOWED_ORIGINS.includes("*")) {
          res.set("Access-Control-Allow-Origin", "*");
        } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
          res.set("Access-Control-Allow-Origin", origin);
          res.set("Vary", "Origin");
        }
        res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type,x-admin-token");
        if (req.method === "OPTIONS") return res.sendStatus(204);
        next();
      });
      app.use(express.static(SITE_DIR, { extensions: ["html"] }));
      function bad(res, status, reason, extra = {}) {
        return res.status(status).json({ ok: false, reason, ...extra });
      }
      function validEmail(s) {
        return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
      }
      function publicRegistration(reg) {
        if (!reg) return null;
        return {
          ref: reg.public_ref,
          status: reg.status,
          name: reg.student_name,
          email: reg.student_email,
          classId: reg.class_id,
          amountCents: reg.amount_cents,
          holdExpiresAt: reg.hold_expires_at,
          offerExpiresAt: reg.offer_expires_at,
          confirmedAt: reg.confirmed_at,
          groupRef: reg.group_ref || null,
          slotStart: reg.slot_start || null,
          address: reg.address || ""
        };
      }
      function publicClass(c) {
        const day = seats.daySlots(c.id);
        return {
          // False once every time is past, inside the booking notice, on time off
          // or with no trainer — nothing left to offer, not even a waitlist.
          stillBookable: Boolean(day && day.slots.some((s) => !["past", "too_soon", "time_off", "no_trainer"].includes(s.reason))),
          id: c.id,
          courseCode: c.course_code,
          title: c.title,
          // The day's working window, not one session.
          opensAt: c.starts_at,
          closesAt: c.ends_at,
          startsAt: c.starts_at,
          // kept for older callers
          endsAt: c.ends_at,
          priceCents: c.price_cents,
          pricingTiers: seats.priceLadder(c),
          seatsAvailable: c.seats.available,
          capacity: c.seats.capacity,
          waitlistCount: c.seats.waitlist,
          sessionMinutes: seats.SESSION_MINUTES,
          availableSlots: day ? day.availableSlots : 0,
          // "Full" now means no bookable time left, whether that's seats or clashes.
          isFull: c.seats.isFull || !day || day.availableSlots === 0
        };
      }
      function validateTiers(tiers) {
        if (tiers === void 0 || tiers === null) return null;
        if (!Array.isArray(tiers) || !tiers.length) return "Set at least one price band.";
        const sorted = [...tiers].sort((a, b) => (a.minSize ?? 1) - (b.minSize ?? 1));
        if ((sorted[0].minSize ?? 1) !== 1) {
          return "The first price band has to start at 1 person.";
        }
        if (sorted[sorted.length - 1].maxSize !== null && sorted[sorted.length - 1].maxSize !== void 0) {
          return "The last price band needs no upper limit, so every group size is covered.";
        }
        for (let i = 0; i < sorted.length; i++) {
          const t = sorted[i];
          const min = t.minSize ?? 1;
          const max = t.maxSize;
          if (!Number.isInteger(min) || min < 1) return "Each band must start at a whole number of people.";
          if (max !== null && max !== void 0 && (!Number.isInteger(max) || max < min)) {
            return "A band cannot end before it starts.";
          }
          if (typeof t.adjustPct !== "number" || Number.isNaN(t.adjustPct)) {
            return "Each band needs a percentage.";
          }
          if (t.adjustPct < -90 || t.adjustPct > 200) {
            return "Keep adjustments between -90% and +200%.";
          }
          if (!String(t.reason || "").trim()) {
            return "Each band needs a short reason \u2014 customers are shown it.";
          }
          const next = sorted[i + 1];
          if (next && (max === null || max === void 0)) {
            return "Only the last band can be open-ended.";
          }
          if (next && (next.minSize ?? 1) !== max + 1) {
            return `Gap in the bands: nothing covers a group of ${max + 1}.`;
          }
        }
        return null;
      }
      function cleanZoneLimits(limits) {
        if (limits === void 0) return { value: void 0 };
        if (limits === null) return { value: null };
        if (typeof limits !== "object" || Array.isArray(limits)) {
          return { error: "Zone limits must be set per zone." };
        }
        const out = {};
        for (const z of zones.ZONES) {
          const raw = limits[z.zone] ?? limits[String(z.zone)];
          if (raw === null || raw === void 0 || raw === "") {
            out[z.zone] = null;
            continue;
          }
          const n = Number(raw);
          if (!Number.isInteger(n) || n < 0 || n > 50) {
            return { error: `Zone ${z.zone}: enter a whole number of trips, or leave it blank for no limit.` };
          }
          out[z.zone] = n;
        }
        return { value: out };
      }
      var storeZoneLimits = (v) => v && Object.values(v).some((n) => n !== null) ? JSON.stringify(v) : null;
      function dayHoursProblem(startsAt, endsAt) {
        const open = new Date(startsAt).getTime();
        const close = new Date(endsAt).getTime();
        if (Number.isNaN(open) || Number.isNaN(close)) return "Those hours are not valid times.";
        if (close <= open) return "Closing time must be after opening.";
        if (close - open < seats.SESSION_MINUTES * 6e4) {
          const hours = seats.SESSION_MINUTES / 60;
          return `Open at least ${hours} hour${hours === 1 ? "" : "s"} \u2014 one full session.`;
        }
        return null;
      }
      function requireAdmin(req, res, next) {
        if (!ADMIN_TOKEN) {
          return bad(res, 503, "admin_disabled", {
            hint: "Set ADMIN_TOKEN in the environment to enable admin routes."
          });
        }
        const sent = req.get("x-admin-token");
        if (sent !== ADMIN_TOKEN) return bad(res, 401, "unauthorized");
        next();
      }
      app.get("/api/classes", (req, res) => {
        const includeFull = req.query.includeFull !== "false";
        const classes = seats.listUpcomingClasses({ includeFull }).map(publicClass).filter((c) => c.stillBookable);
        res.json({ ok: true, classes, minNoticeHours: seats.minNoticeHours() });
      });
      app.get("/api/classes/:id", (req, res) => {
        const cls = seats.getClass(Number(req.params.id));
        if (!cls) return bad(res, 404, "no_such_class");
        const availability = seats.availability(cls.id);
        res.json({ ok: true, class: publicClass({ ...cls, seats: availability }) });
      });
      app.get("/api/registrations/:ref", (req, res) => {
        const reg = seats.findByRef(req.params.ref);
        if (!reg) return bad(res, 404, "not_found");
        res.json({ ok: true, registration: publicRegistration(reg) });
      });
      app.get("/api/classes/:id/slots", (req, res) => {
        const classId = Number(req.params.id);
        const partySize = Math.max(1, Number(req.query.partySize) || 1);
        const where = req.query.zip ? zones.zoneForZip(req.query.zip) : null;
        const day = seats.daySlots(classId, { partySize, zone: where && where.ok ? where.zone : null });
        if (!day) return bad(res, 404, "no_such_class");
        const cls = seats.getClass(classId);
        res.json({
          ok: true,
          class: {
            id: cls.id,
            title: cls.title,
            courseCode: cls.course_code,
            priceCents: cls.price_cents
          },
          ...day
        });
      });
      app.get("/api/classes/:id/alternatives", (req, res) => {
        const classId = Number(req.params.id);
        const partySize = Math.max(1, Number(req.query.partySize) || 1);
        const preferredTime = req.query.preferredTime || null;
        const zip = req.query.zip || null;
        if (!seats.getClass(classId)) return bad(res, 404, "no_such_class");
        res.json({
          ok: true,
          alternatives: seats.suggestAlternatives({ classId, preferredTime, partySize, zip })
        });
      });
      app.get("/api/zones", (req, res) => {
        res.json({ ok: true, homeZip: zones.HOME_ZIP, zones: zones.describeZones() });
      });
      app.get("/api/zones/lookup", (req, res) => {
        const where = zones.zoneForZip(req.query.zip);
        if (!where.ok) {
          return res.json({
            ok: false,
            reason: where.reason,
            zip: where.zip || null,
            miles: where.miles ?? null,
            maxMiles: zones.MAX_MILES,
            message: where.reason === "zip_invalid" ? "Enter a five digit ZIP code." : `${where.zip} is outside our travel area \u2014 we go up to ${zones.MAX_MILES} miles from Forest Grove. Call us and we'll see what we can do.`
          });
        }
        const out = { ok: true, ...where };
        const classId = Number(req.query.classId);
        if (classId && seats.getClass(classId)) {
          const trips = seats.zoneTripsLeft(classId, where.zone);
          out.dayHasRoom = trips.left !== 0;
          out.tripsLeft = trips.left;
        }
        res.json(out);
      });
      app.get("/api/classes/:id/quote", (req, res) => {
        const cls = seats.getClass(Number(req.params.id));
        if (!cls) return bad(res, 404, "no_such_class");
        const partySize = Math.max(1, Math.min(
          cls.capacity,
          Number(req.query.partySize) || 1
        ));
        res.json({
          ok: true,
          partySize,
          ...seats.priceFor(cls, partySize),
          tiers: seats.priceLadder(cls)
        });
      });
      app.post("/api/classes/:id/hold", async (req, res) => {
        const classId = Number(req.params.id);
        const {
          name,
          attendees,
          email,
          phone = "",
          notes = "",
          organiserName,
          slotStart,
          address: address2 = "",
          addressNotes = "",
          zip = "",
          consent
        } = req.body || {};
        const people = Array.isArray(attendees) && attendees.length ? attendees.map((a) => typeof a === "string" ? { name: a } : a || {}) : [{ name }];
        const cleaned = people.map((a) => ({
          name: String(a.name ?? "").trim(),
          email: String(a.email ?? "").trim(),
          phone: String(a.phone ?? "").trim()
        }));
        const missing = cleaned.findIndex((a) => a.name.length < 2);
        if (missing !== -1) {
          return bad(res, 400, "name_required", {
            seat: missing + 1,
            message: cleaned.length > 1 ? `Please enter a name for attendee ${missing + 1}.` : "Please enter your name."
          });
        }
        if (cleaned.length > seats.MAX_GROUP_SEATS) {
          return bad(res, 400, "too_many_seats", { max: seats.MAX_GROUP_SEATS });
        }
        const badEmail = cleaned.findIndex((a) => a.email && !validEmail(a.email));
        if (badEmail !== -1) {
          return bad(res, 400, "attendee_email_invalid", {
            seat: badEmail + 1,
            message: `That email for attendee ${badEmail + 1} doesn't look right.`
          });
        }
        if (!validEmail(email)) {
          return bad(res, 400, "valid_email_required", {
            message: cleaned.length > 1 ? "Please enter a valid email address for the booking." : "Please enter a valid email address."
          });
        }
        if (!slotStart) {
          return bad(res, 400, "slot_required", { message: "Please choose a time." });
        }
        if (consent !== true) {
          return bad(res, 400, "consent_required", { message: CONSENT_MESSAGE });
        }
        if (String(address2).trim().length < 8) {
          return bad(res, 400, "address_required", {
            message: "Please enter the full address where the training will happen."
          });
        }
        const zipUsed = (String(zip || "").trim() || seats.zipFromAddress(address2)).slice(0, 5);
        const where = zones.zoneForZip(zipUsed);
        if (!where.ok) {
          return bad(
            res,
            where.reason === "zip_invalid" ? 400 : 409,
            where.reason === "zip_invalid" ? "zip_required" : "outside_service_area",
            {
              zip: zipUsed || null,
              message: where.reason === "zip_invalid" ? "Please enter the ZIP code so we can work out your travel zone." : `${zipUsed} is outside our travel area (more than ${zones.MAX_MILES} miles from Forest Grove). Please call us and we'll see what we can do.`
            }
          );
        }
        const result = seats.holdSeats({
          classId,
          attendees: cleaned,
          email: String(email).trim(),
          phone: String(phone).trim(),
          notes: String(notes).trim(),
          organiserName: organiserName ? String(organiserName).trim() : null,
          slotStart: String(slotStart),
          address: String(address2).trim(),
          addressNotes: String(addressNotes).trim(),
          zip: zipUsed,
          consent: true
        });
        if (!result.ok) {
          const conflict = ["full", "not_enough_seats", "slot_taken", "zone_full"].includes(result.reason);
          const status = conflict ? 409 : 400;
          return bad(res, status, result.reason, {
            canJoinWaitlist: ["full", "slot_taken", "not_enough_seats"].includes(result.reason),
            zone: result.zone,
            available: result.available,
            requested: result.requested,
            max: result.max,
            slotStart: result.slotStart,
            message: {
              not_enough_seats: `Only ${result.available} seat${result.available === 1 ? "" : "s"} left that day \u2014 you asked for ${result.requested}.`,
              slot_taken: "Someone just booked that time. Please pick another.",
              slot_in_past: "That time has already passed. Please pick another.",
              slot_too_soon: `Bookings need at least ${result.noticeHours} hours' notice. Please pick a later time.`,
              day_off: "Sorry, that day is no longer available. Please pick another.",
              slot_not_offered: "That time is not available on this day.",
              too_many_seats: `The largest group we can take on this day is ${result.max}.`,
              full: "This day is fully booked.",
              outside_service_area: `That ZIP code is outside our travel area.`,
              zip_required: "Please enter the ZIP code so we can work out your travel zone.",
              zone_full: `We're already booked for Zone ${result.zone} trips on this day. Please pick another day.`
            }[result.reason],
            detail: result.reason
          });
        }
        const cls = seats.getClass(classId);
        const site = PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
        let session;
        try {
          session = await payments.createSession({
            registration: result.registration,
            cls,
            // A group pays once for every seat.
            amountCents: result.totalCents,
            seatCount: result.seats,
            returnUrl: `${site}/?booking=${encodeURIComponent(result.registration.public_ref)}`,
            notifyUrl: `${site}/api/payments/webhook`
          });
        } catch (err) {
          if (result.groupRef) {
            seats.cancelGroup(result.groupRef, { reason: `payment session failed: ${err.message}` });
          } else {
            seats.cancelRegistration(result.registration.public_ref, {
              reason: `payment session failed: ${err.message}`
            });
          }
          console.error("[payments] createSession failed:", err.message);
          return bad(res, 502, "payment_unavailable", { detail: err.message });
        }
        res.json({
          ok: true,
          registration: publicRegistration(result.registration),
          attendees: result.registrations.map((r) => ({
            ref: r.public_ref,
            name: r.student_name,
            seat: r.seat_index + 1
          })),
          groupRef: result.groupRef,
          seats: result.seats,
          seatsCents: result.seatsCents,
          travelCents: result.travelCents,
          travel: result.travel,
          totalCents: result.totalCents,
          slotStart: result.slotStart,
          slotEnd: result.slotEnd,
          address: result.address,
          expiresAt: result.expiresAt,
          holdMinutes: result.holdMinutes,
          payment: session
        });
      });
      app.post("/api/registrations/:ref/extend", (req, res) => {
        const result = seats.extendHold(req.params.ref);
        if (!result.ok) return bad(res, 409, result.reason);
        res.json({ ok: true, expiresAt: result.expiresAt });
      });
      app.post("/api/registrations/:ref/confirm", async (req, res) => {
        const ref = req.params.ref;
        const reg = seats.findByRef(ref);
        if (!reg) return bad(res, 404, "not_found");
        if (reg.status === "confirmed") {
          return res.json({
            ok: true,
            alreadyConfirmed: true,
            registration: publicRegistration(reg)
          });
        }
        const verification = await payments.verify({ ...req.body || {}, publicRef: ref });
        if (!verification.ok) {
          return bad(res, 402, "payment_not_approved", { detail: verification.reason });
        }
        const result = seats.confirmPayment({
          publicRef: ref,
          provider: payments.name,
          paymentRef: verification.paymentRef,
          raw: verification.raw
        });
        if (!result.ok) {
          if (result.needsRefund) {
            console.error(
              `[REFUND REQUIRED] ${ref} paid ${verification.paymentRef} but the class filled up.`
            );
            return bad(res, 409, "expired_and_full", {
              needsRefund: true,
              paymentRef: verification.paymentRef,
              message: "Your payment went through but the seat expired and the class is now full. We will refund you \u2014 please contact us."
            });
          }
          return bad(res, 409, result.reason);
        }
        res.json({
          ok: true,
          alreadyConfirmed: Boolean(result.alreadyConfirmed),
          registration: publicRegistration(result.registration),
          seatsConfirmed: result.seatsConfirmed || 1,
          groupRef: result.groupRef || null
        });
      });
      app.post("/api/payments/webhook", async (req, res) => {
        if (!payments.webhook) {
          return bad(res, 501, "webhook_not_supported", {
            message: `The ${payments.name} payment provider doesn't use webhooks.`
          });
        }
        let notice;
        try {
          notice = await payments.webhook(req);
        } catch (err) {
          console.error("[payments] webhook failed:", err.message);
          return bad(res, 400, "webhook_invalid");
        }
        if (!notice || !notice.ok) return bad(res, 400, notice && notice.reason || "rejected");
        const result = seats.confirmPayment({
          publicRef: notice.publicRef,
          provider: payments.name,
          paymentRef: notice.paymentRef,
          raw: notice.raw
        });
        if (!result.ok && result.needsRefund) {
          console.error(`[REFUND REQUIRED] ${notice.publicRef} paid ${notice.paymentRef} but the class filled up.`);
        }
        res.status(result.ok ? 200 : 409).json({
          ok: result.ok,
          reason: result.reason || null,
          needsRefund: Boolean(result.needsRefund)
        });
      });
      app.post("/api/registrations/:ref/cancel", (req, res) => {
        const result = seats.cancelRegistration(req.params.ref, {
          reason: String(req.body?.reason || "student cancelled")
        });
        if (!result.ok) return bad(res, 404, result.reason);
        res.json({ ok: true, promoted: (result.promoted || []).length });
      });
      app.post("/api/classes/:id/waitlist", (req, res) => {
        const classId = Number(req.params.id);
        const {
          name,
          email,
          phone = "",
          notes = "",
          preferredTime = null,
          partySize = 1,
          address: address2 = "",
          consent
        } = req.body || {};
        if (!name || String(name).trim().length < 2) return bad(res, 400, "name_required");
        if (!validEmail(email)) return bad(res, 400, "valid_email_required");
        if (consent !== true) return bad(res, 400, "consent_required", { message: CONSENT_MESSAGE });
        const result = seats.joinWaitlist({
          classId,
          name: String(name).trim(),
          email: String(email).trim(),
          phone: String(phone).trim(),
          notes: String(notes).trim(),
          preferredTime: preferredTime ? String(preferredTime) : null,
          partySize: Math.max(1, Number(partySize) || 1),
          address: String(address2).trim(),
          consent: true
        });
        if (!result.ok) {
          return bad(res, result.reason === "already_registered" ? 409 : 400, result.reason);
        }
        res.json({
          ok: true,
          registration: publicRegistration(result.registration),
          position: result.position,
          // Somewhere else they could go instead of waiting.
          alternatives: seats.suggestAlternatives({
            classId,
            preferredTime: preferredTime ? String(preferredTime) : null,
            partySize: Math.max(1, Number(partySize) || 1)
          })
        });
      });
      app.post("/api/registrations/:ref/accept-offer", async (req, res) => {
        const result = seats.acceptOffer(req.params.ref);
        if (!result.ok) return bad(res, 409, result.reason);
        const cls = seats.getClass(result.registration.class_id);
        let session;
        try {
          session = await payments.createSession({ registration: result.registration, cls });
        } catch (err) {
          return bad(res, 502, "payment_unavailable", { detail: err.message });
        }
        res.json({
          ok: true,
          registration: publicRegistration(result.registration),
          expiresAt: result.expiresAt,
          holdMinutes: result.holdMinutes,
          payment: session
        });
      });
      app.get("/api/admin/classes/:id/roster", requireAdmin, (req, res) => {
        const classId = Number(req.params.id);
        const cls = seats.getClass(classId);
        if (!cls) return bad(res, 404, "no_such_class");
        res.json({
          ok: true,
          class: { id: cls.id, title: cls.title, startsAt: cls.starts_at },
          seats: seats.availability(classId),
          roster: seats.roster(classId)
        });
      });
      function readDaySettings(body) {
        const {
          courseCode,
          title,
          location = "",
          capacity,
          priceCents,
          pricingTiers,
          zoneLimits
        } = body || {};
        if (!courseCode || !title) return { error: "courseCode and title are required" };
        if (!Number.isInteger(capacity) || capacity < 1) return { error: "capacity_invalid" };
        const price = seats.coursePrice(courseCode) ?? priceCents;
        if (!Number.isInteger(price) || price < 0) return { error: "priceCents_invalid" };
        const tierError = validateTiers(pricingTiers);
        if (tierError) return { error: "pricing_invalid", message: tierError };
        const limits = cleanZoneLimits(zoneLimits);
        if (limits.error) return { error: "zone_limits_invalid", message: limits.error };
        return {
          values: {
            courseCode,
            title,
            location,
            capacity,
            priceCents: price,
            pricingTiers: pricingTiers ? JSON.stringify(pricingTiers) : null,
            zoneLimits: storeZoneLimits(limits.value)
          }
        };
      }
      function insertDay(v, startsAt, endsAt) {
        const info = getDb().prepare(
          `INSERT INTO classes
         (course_code, title, starts_at, ends_at, location, capacity, price_cents,
          pricing_tiers, zone_limits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          v.courseCode,
          v.title,
          startsAt,
          endsAt,
          v.location,
          v.capacity,
          v.priceCents,
          v.pricingTiers,
          v.zoneLimits
        );
        return Number(info.lastInsertRowid);
      }
      app.post("/api/admin/classes", requireAdmin, (req, res) => {
        const { startsAt, endsAt } = req.body || {};
        if (!startsAt || !endsAt) {
          return bad(res, 400, "courseCode, title, startsAt and endsAt are required");
        }
        const settings = readDaySettings(req.body);
        if (settings.error) return bad(res, 400, settings.error, { message: settings.message });
        const hoursError = dayHoursProblem(startsAt, endsAt);
        if (hoursError) return bad(res, 400, "hours_invalid", { message: hoursError });
        if (seats.isTimeOff(seats.localDate(startsAt))) {
          return bad(res, 400, "time_off", {
            message: "That date is marked as time off. Remove the time off first."
          });
        }
        const classId = insertDay(settings.values, startsAt, endsAt);
        res.status(201).json({ ok: true, classId });
      });
      var MAX_BULK_DAYS = 200;
      app.post("/api/admin/classes/bulk", requireAdmin, (req, res) => {
        const { days } = req.body || {};
        if (!Array.isArray(days) || !days.length) {
          return bad(res, 400, "days_required", { message: "Pick at least one open day." });
        }
        if (days.length > MAX_BULK_DAYS) {
          return bad(res, 400, "too_many_days", {
            message: `That's ${days.length} days \u2014 add at most ${MAX_BULK_DAYS} at a time.`
          });
        }
        const courseList = Array.isArray(req.body.courses) && req.body.courses.length ? req.body.courses : [{ code: req.body.courseCode, title: req.body.title, priceCents: req.body.priceCents }];
        const perCourse = [];
        for (const c of courseList) {
          const settings = readDaySettings({
            ...req.body,
            courseCode: c.code,
            title: c.title,
            priceCents: c.priceCents
          });
          if (settings.error) return bad(res, 400, settings.error, { message: settings.message });
          perCourse.push(settings.values);
        }
        for (const [i, d] of days.entries()) {
          const problem = d && d.startsAt && d.endsAt ? dayHoursProblem(d.startsAt, d.endsAt) : "Each day needs opening and closing times.";
          if (problem) {
            return bad(res, 400, "hours_invalid", { day: i + 1, message: `Day ${i + 1}: ${problem}` });
          }
        }
        const open = days.filter((d) => !seats.isTimeOff(seats.localDate(d.startsAt)));
        const ids = getDb().transaction(() => open.flatMap((d) => perCourse.map((v) => insertDay(v, d.startsAt, d.endsAt))))();
        res.status(201).json({
          ok: true,
          created: ids.length,
          classIds: ids,
          skippedTimeOff: days.length - open.length
        });
      });
      app.post("/api/admin/classes/:id/cancel", requireAdmin, (req, res) => {
        const classId = Number(req.params.id);
        getDb().prepare(`UPDATE classes SET status = 'cancelled' WHERE id = ?`).run(classId);
        const deleted = seats.purgeEmptyCancelledDays().includes(classId);
        res.json({ ok: true, deleted });
      });
      app.get("/api/courses", (req, res) => {
        res.json({ ok: true, courses: seats.courses() });
      });
      app.get("/api/admin/schedules", requireAdmin, (req, res) => {
        res.json({
          ok: true,
          schedules: schedule.listSchedules(),
          timeOff: schedule.listTimeOff(),
          courses: seats.courses(),
          defaultTrainers: seats.defaultTrainers(),
          // Dates with a different number of trainers from the usual.
          trainerDays: Object.fromEntries(getDb().prepare("SELECT day, trainers FROM trainer_days WHERE day >= ?").all(seats.localDate(new Date(Date.now() - 864e5).toISOString())).map((r) => [r.day, r.trainers])),
          minNoticeHours: seats.minNoticeHours(),
          bufferMinutes: seats.bufferMinutes(),
          sessionMinutes: seats.SESSION_MINUTES,
          maxWeeksAhead: schedule.MAX_WEEKS_AHEAD
        });
      });
      function scheduleExtras(body) {
        const tierError = validateTiers(body.pricingTiers);
        if (tierError) return { error: "pricing_invalid", message: tierError };
        const limits = cleanZoneLimits(body.zoneLimits);
        if (limits.error) return { error: "zone_limits_invalid", message: limits.error };
        return {
          value: {
            pricingTiers: body.pricingTiers ? JSON.stringify(body.pricingTiers) : null,
            zoneLimits: storeZoneLimits(limits.value)
          }
        };
      }
      app.post("/api/admin/schedules", requireAdmin, (req, res) => {
        const v = schedule.cleanSchedule(req.body, { sessionMinutes: seats.SESSION_MINUTES });
        if (v.error) return bad(res, 400, "schedule_invalid", { message: v.error });
        const extras = scheduleExtras(req.body || {});
        if (extras.error) return bad(res, 400, extras.error, { message: extras.message });
        const out = schedule.createSchedule(v.value, extras.value);
        res.status(201).json({ ok: true, scheduleId: out.id, created: out.created });
      });
      app.post("/api/admin/schedules/:id/update", requireAdmin, (req, res) => {
        const id = Number(req.params.id);
        if (!schedule.getSchedule(id)) return bad(res, 404, "no_such_schedule");
        const v = schedule.cleanSchedule(req.body, { sessionMinutes: seats.SESSION_MINUTES });
        if (v.error) return bad(res, 400, "schedule_invalid", { message: v.error });
        const extras = scheduleExtras(req.body || {});
        if (extras.error) return bad(res, 400, extras.error, { message: extras.message });
        res.json({ ok: true, ...schedule.updateSchedule(id, v.value, extras.value) });
      });
      app.post("/api/admin/schedules/:id/pause", requireAdmin, (req, res) => {
        const id = Number(req.params.id);
        if (!schedule.getSchedule(id)) return bad(res, 404, "no_such_schedule");
        schedule.setScheduleActive(id, false);
        res.json({ ok: true });
      });
      app.post("/api/admin/schedules/:id/resume", requireAdmin, (req, res) => {
        const id = Number(req.params.id);
        if (!schedule.getSchedule(id)) return bad(res, 404, "no_such_schedule");
        res.json({ ok: true, created: schedule.setScheduleActive(id, true) });
      });
      app.post("/api/admin/schedules/:id/delete", requireAdmin, (req, res) => {
        const id = Number(req.params.id);
        if (!schedule.getSchedule(id)) return bad(res, 404, "no_such_schedule");
        res.json({ ok: true, ...schedule.deleteSchedule(id) });
      });
      var YMD = /^\d{4}-\d{2}-\d{2}$/;
      app.post("/api/admin/time-off", requireAdmin, (req, res) => {
        const { startsOn, endsOn = startsOn, note = "" } = req.body || {};
        if (!YMD.test(String(startsOn || "")) || !YMD.test(String(endsOn || ""))) {
          return bad(res, 400, "dates_invalid", { message: "Pick the first and last day off." });
        }
        if (endsOn < startsOn) {
          return bad(res, 400, "dates_invalid", { message: "The last day off is before the first." });
        }
        res.status(201).json({ ok: true, ...schedule.addTimeOff({ startsOn, endsOn, note }) });
      });
      app.post("/api/admin/time-off/:id/delete", requireAdmin, (req, res) => {
        res.json({ ok: true, created: schedule.removeTimeOff(Number(req.params.id)) });
      });
      app.post("/api/admin/courses/:code/price", requireAdmin, (req, res) => {
        const priceCents = Number(req.body?.priceCents);
        if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 1e6) {
          return bad(res, 400, "price_invalid", { message: "Enter a valid price." });
        }
        const r = seats.setCoursePrice(req.params.code, priceCents);
        if (!r.ok) return bad(res, 404, r.reason);
        res.json({ ok: true, daysUpdated: r.daysUpdated, courses: seats.courses() });
      });
      app.post("/api/admin/trainers", requireAdmin, (req, res) => {
        const { days, trainers } = req.body || {};
        if (!Array.isArray(days) || !days.length || !days.every((d) => YMD.test(String(d)))) {
          return bad(res, 400, "days_invalid", { message: "Pick the dates." });
        }
        if (trainers !== null && (!Number.isInteger(trainers) || trainers < 0 || trainers > 20)) {
          return bad(res, 400, "trainers_invalid", { message: "Enter 0 to 20 trainers." });
        }
        res.json({ ok: true, overbooked: seats.setTrainers(days, trainers) });
      });
      app.post("/api/admin/settings", requireAdmin, (req, res) => {
        const { minNoticeHours, defaultTrainers, bufferMinutes } = req.body || {};
        if (bufferMinutes !== void 0) {
          const n = Number(bufferMinutes);
          if (!Number.isInteger(n) || n < 0 || n > 240) {
            return bad(res, 400, "buffer_invalid", { message: "Pick a travel time." });
          }
          seats.setSetting("buffer_minutes", n);
        }
        if (defaultTrainers !== void 0) {
          const n = Number(defaultTrainers);
          if (!Number.isInteger(n) || n < 0 || n > 20) {
            return bad(res, 400, "trainers_invalid", { message: "Enter 0 to 20 trainers." });
          }
          seats.setSetting("default_trainers", n);
        }
        if (minNoticeHours !== void 0) {
          const n = Number(minNoticeHours);
          if (!Number.isFinite(n) || n < 0 || n > 24 * 30) {
            return bad(res, 400, "notice_invalid", { message: "Pick a notice period." });
          }
          seats.setSetting("min_notice_hours", n);
        }
        res.json({
          ok: true,
          minNoticeHours: seats.minNoticeHours(),
          defaultTrainers: seats.defaultTrainers(),
          bufferMinutes: seats.bufferMinutes()
        });
      });
      app.get("/api/admin/records", requireAdmin, (req, res) => {
        const type = req.query.type === "renewals" ? "renewals" : "billing";
        const within = req.query.within !== void 0 ? Number(req.query.within) : null;
        res.json({
          ok: true,
          type,
          reminderDays: records.REMINDER_DAYS,
          retentionDays: records.RETENTION_DAYS,
          rows: type === "renewals" ? records.renewals({ withinDays: Number.isFinite(within) ? within : null }) : records.billing()
        });
      });
      app.get("/api/admin/outbox", requireAdmin, (req, res) => {
        const rows = getDb().prepare("SELECT * FROM outbox ORDER BY created_at DESC LIMIT 100").all();
        res.json({ ok: true, outbox: rows });
      });
      app.post("/api/admin/sweep", requireAdmin, (req, res) => {
        res.json({ ok: true, ...seats.sweepExpired() });
      });
      app.get("/api/admin/classes", requireAdmin, (req, res) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        seats_.purgeEmptyCancelledDays(now);
        const rows = getDb().prepare(`SELECT * FROM classes WHERE archived = 0
               ORDER BY (ends_at < ?) ASC, starts_at ASC`).all(now);
        res.json({
          ok: true,
          sessionMinutes: seats_.SESSION_MINUTES,
          classes: rows.map((c) => {
            const seats2 = seats_.availability(c.id);
            return {
              id: c.id,
              courseCode: c.course_code,
              title: c.title,
              startsAt: c.starts_at,
              endsAt: c.ends_at,
              location: c.location,
              capacity: c.capacity,
              priceCents: c.price_cents,
              status: c.status,
              pricingTiers: seats_.tiersFor(c),
              zoneLimits: seats_.zoneLimitsFor(c),
              scheduleId: c.schedule_id || null,
              day: seats_.localDate(c.starts_at),
              trainers: seats_.trainersOn(seats_.localDate(c.starts_at)),
              // Where and when the instructor is going that day, for the list view.
              visits: seats_.dayVisits(c.id),
              // Trips already taken into each zone on this day's date.
              zoneTrips: Object.fromEntries(zones.ZONES.map((z) => {
                const t = seats_.zoneTripsLeft(c.id, z.zone);
                return [z.zone, { used: t.used, limit: t.limit }];
              })),
              taken: seats2.taken,
              available: seats2.available,
              waitlist: seats2.waitlist,
              confirmed: getDb().prepare(`SELECT COUNT(*) AS n FROM registrations
                     WHERE class_id = ? AND status = 'confirmed'`).get(c.id).n,
              ...(() => {
                const d = seats_.daySlots(c.id);
                return {
                  availableSlots: d ? d.availableSlots : 0,
                  // Slots lost to bookings, not to the day simply being over.
                  bookedSlots: d ? d.slots.filter((s) => s.reason === "booked").length : 0
                };
              })(),
              groups: getDb().prepare(`SELECT COUNT(DISTINCT group_ref) AS n FROM registrations
                     WHERE class_id = ? AND group_ref IS NOT NULL
                       AND status IN ('confirmed','held','offered')`).get(c.id).n
            };
          })
        });
      });
      app.post("/api/admin/classes/:id/update", requireAdmin, (req, res) => {
        const classId = Number(req.params.id);
        const cls = seats_.getClass(classId);
        if (!cls) return bad(res, 404, "no_such_class");
        const {
          title,
          courseCode,
          startsAt,
          endsAt,
          location,
          capacity,
          priceCents,
          status,
          pricingTiers,
          zoneLimits
        } = req.body || {};
        if (capacity !== void 0) {
          if (!Number.isInteger(capacity) || capacity < 1) return bad(res, 400, "capacity_invalid");
          const taken = seats_.availability(classId).taken;
          if (capacity < taken) {
            return bad(res, 409, "capacity_below_booked", {
              taken,
              message: `${taken} seat${taken === 1 ? " is" : "s are"} already taken. Capacity cannot go below that.`
            });
          }
        }
        if (priceCents !== void 0 && (!Number.isInteger(priceCents) || priceCents < 0)) {
          return bad(res, 400, "price_invalid");
        }
        const coursePriceNow = seats.coursePrice(courseCode || cls.course_code);
        if (status !== void 0 && !["open", "cancelled"].includes(status)) {
          return bad(res, 400, "status_invalid");
        }
        if (startsAt || endsAt) {
          const hoursError = dayHoursProblem(startsAt || cls.starts_at, endsAt || cls.ends_at);
          if (hoursError) {
            return bad(
              res,
              400,
              hoursError.includes("after opening") ? "end_before_start" : "hours_invalid",
              { message: hoursError }
            );
          }
        }
        const tierError = validateTiers(pricingTiers);
        if (tierError) return bad(res, 400, "pricing_invalid", { message: tierError });
        const limits = cleanZoneLimits(zoneLimits);
        if (limits.error) return bad(res, 400, "zone_limits_invalid", { message: limits.error });
        const fields = {
          title,
          course_code: courseCode,
          starts_at: startsAt,
          ends_at: endsAt,
          location,
          capacity,
          price_cents: coursePriceNow ?? priceCents,
          status,
          pricing_tiers: pricingTiers === void 0 ? void 0 : JSON.stringify(pricingTiers),
          zone_limits: limits.value === void 0 ? void 0 : storeZoneLimits(limits.value)
        };
        const setters = [];
        const values = {};
        for (const [col, val] of Object.entries(fields)) {
          if (val !== void 0) {
            setters.push(`${col} = @${col}`);
            values[col] = val;
          }
        }
        if (!setters.length) return bad(res, 400, "nothing_to_update");
        getDb().prepare(`UPDATE classes SET ${setters.join(", ")} WHERE id = @id`).run({ ...values, id: classId });
        const promoted = seats_.promoteWaitlist(classId);
        res.json({ ok: true, promoted: promoted.length });
      });
      app.post("/api/admin/registrations/:ref/cancel", requireAdmin, (req, res) => {
        const result = seats_.cancelRegistration(req.params.ref, {
          reason: String(req.body?.reason || "cancelled by staff")
        });
        if (!result.ok) return bad(res, 404, result.reason);
        res.json({ ok: true, promoted: (result.promoted || []).length });
      });
      app.post("/api/admin/groups/:groupRef/cancel", requireAdmin, (req, res) => {
        const result = seats_.cancelGroup(req.params.groupRef, {
          reason: String(req.body?.reason || "cancelled by staff")
        });
        if (!result.ok) return bad(res, 404, result.reason);
        res.json({ ok: true, cancelled: result.cancelled, promoted: (result.promoted || []).length });
      });
      app.post("/api/admin/registrations/:ref/mark-paid", requireAdmin, (req, res) => {
        const ref = req.params.ref;
        const note = String(req.body?.note || "manual");
        const result = seats_.confirmPayment({
          publicRef: ref,
          provider: "manual",
          paymentRef: `MANUAL_${ref}_${Date.now()}`,
          raw: { manual: true, note, at: (/* @__PURE__ */ new Date()).toISOString() }
        });
        if (!result.ok) return bad(res, 409, result.reason, result);
        res.json({ ok: true, registration: publicRegistration(result.registration) });
      });
      app.get("/api/admin/summary", requireAdmin, (req, res) => {
        const db = getDb();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const upcoming = db.prepare(`SELECT COUNT(*) AS n FROM classes WHERE status='open' AND ends_at >= ?`).get(now).n;
        const confirmed = db.prepare(`SELECT COUNT(*) AS n FROM registrations r
                JOIN classes c ON c.id = r.class_id
               WHERE r.status='confirmed' AND c.ends_at >= ?`).get(now).n;
        const waiting = db.prepare(`SELECT COUNT(*) AS n FROM registrations r
                JOIN classes c ON c.id = r.class_id
               WHERE r.status='waitlist' AND c.ends_at >= ?`).get(now).n;
        const revenue = db.prepare(`SELECT COALESCE(SUM(r.amount_cents + r.travel_cents),0) AS c FROM registrations r
                JOIN classes c ON c.id = r.class_id
               WHERE r.status='confirmed' AND c.ends_at >= ?`).get(now).c;
        res.json({
          ok: true,
          upcomingClasses: upcoming,
          confirmedStudents: confirmed,
          waitlisted: waiting,
          expectedRevenueCents: revenue
        });
      });
      app.get("/api/address/suggest", async (req, res) => {
        const result = await address.suggest(req.query.q);
        res.json({ ok: true, ...result });
      });
      app.get("/api/address/zip", async (req, res) => {
        const found = await address.lookupZip(req.query.zip);
        if (!found) return bad(res, 404, "zip_not_found");
        res.json({ ok: true, ...found });
      });
      app.get("/api/address/details", async (req, res) => {
        const placeId = String(req.query.placeId || "");
        if (!placeId) return bad(res, 400, "place_id_required");
        const result = await address.details(placeId);
        if (!result) return bad(res, 404, "not_found");
        res.json({ ok: true, address: result });
      });
      app.get("/api/registrations/:ref/calendar.ics", (req, res) => {
        const reg = seats.findByRef(req.params.ref);
        if (!reg) return bad(res, 404, "not_found");
        if (reg.status !== "confirmed") return bad(res, 409, "not_confirmed");
        const cls = seats.getClass(reg.class_id);
        const ics = calendar.buildIcs({
          cls,
          registration: reg,
          orgName: ORG_NAME,
          sessionMinutes: seats.SESSION_MINUTES
        });
        res.set("Content-Type", "text/calendar; charset=utf-8");
        res.set("Content-Disposition", `attachment; filename="${reg.public_ref}.ics"`);
        res.send(ics);
      });
      app.get("/api/registrations/:ref/calendar-links", (req, res) => {
        const reg = seats.findByRef(req.params.ref);
        if (!reg) return bad(res, 404, "not_found");
        if (reg.status !== "confirmed") return bad(res, 409, "not_confirmed");
        const cls = seats.getClass(reg.class_id);
        res.json({
          ok: true,
          google: calendar.buildGoogleUrl({
            cls,
            registration: reg,
            orgName: ORG_NAME,
            sessionMinutes: seats.SESSION_MINUTES
          }),
          ics: `/api/registrations/${reg.public_ref}/calendar.ics`
        });
      });
      if (payments.isMock) {
        app.get("/mock-checkout", (req, res) => {
          const reg = seats.findByRef(String(req.query.ref || ""));
          if (!reg) return res.status(404).send("Unknown registration.");
          const cls = seats.getClass(reg.class_id);
          const amount = (seats.bookingTotals(reg).totalCents / 100).toFixed(2);
          res.type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock checkout</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:460px;margin:8vh auto;padding:0 24px;color:#141821}
  .warn{background:#fff8e1;border:1px solid #e8cf7a;color:#5c4a10;padding:12px 16px;border-radius:2px;font-size:14px}
  h1{font-size:22px;margin:24px 0 4px}
  .muted{color:#4a5261;font-size:14px}
  .amt{font-size:34px;font-weight:700;margin:18px 0}
  button{font:inherit;font-weight:600;padding:12px 20px;border:0;border-radius:2px;cursor:pointer;margin-right:8px}
  .go{background:#d8202f;color:#fff}
  .no{background:none;border:1.5px solid #141821;color:#141821}
  #out{margin-top:20px;font-size:14px}
</style></head><body>
  <div class="warn"><b>Mock checkout.</b> No card is charged. This page disappears when Elavon Converge goes live.</div>
  <h1>${cls.title}</h1>
  <div class="muted">${cls.starts_at} \xB7 ${cls.location}</div>
  <div class="amt">$${amount}</div>
  <div class="muted">Reference ${reg.public_ref}<br>Seat held until ${reg.hold_expires_at}</div>
  <p style="margin-top:24px">
    <button class="go" onclick="done('approve')">Simulate approval</button>
    <button class="no" onclick="done('decline')">Simulate decline</button>
  </p>
  <div id="out"></div>
<script>
async function done(outcome){
  const r = await fetch('/api/registrations/${reg.public_ref}/confirm', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ outcome })
  });
  const data = await r.json();
  document.getElementById('out').innerHTML = data.ok
    ? '<b style="color:#2a9d4e">Confirmed.</b> Reference ' + data.registration.ref
    : '<b style="color:#d8202f">Not confirmed:</b> ' + (data.detail || data.reason);
}
<\/script></body></html>`);
        });
      }
      var FEATURES = ["calendar", "admin", "groups", "attendee-contacts", "slots", "travel", "address-lookup", "group-pricing", "zones", "bulk-days", "schedules", "records", "payment-webhook"];
      app.get("/health", (req, res) => {
        res.json({
          ok: true,
          provider: payments.name,
          mock: payments.isMock,
          features: FEATURES
        });
      });
      app.use((err, req, res, _next) => {
        if (err?.type === "entity.parse.failed") {
          return bad(res, 400, "invalid_json", {
            hint: "Request body was not valid JSON."
          });
        }
        if (err?.type === "entity.too.large") return bad(res, 413, "body_too_large");
        console.error("[unhandled]", err);
        bad(res, 500, "server_error");
      });
      function checkBuild() {
        const db = require_db();
        const problems = [];
        if (typeof seats.holdSeats !== "function") {
          problems.push("src/seats.js is out of date (no holdSeats \u2014 group bookings missing)");
        }
        if (typeof db.transaction !== "function") {
          problems.push("src/db.js is out of date (no transaction helper)");
        }
        if (typeof seats.cancelGroup !== "function") {
          problems.push("src/seats.js is out of date (no cancelGroup)");
        }
        if (typeof seats.daySlots !== "function") {
          problems.push("src/seats.js is out of date (no daySlots \u2014 time slots missing)");
        }
        try {
          const cols = getDb().prepare("PRAGMA table_info(registrations)").all().map((c) => c.name);
          if (!cols.includes("group_ref")) {
            problems.push("the database is missing group columns \u2014 src/db.js did not migrate it");
          }
          if (!cols.includes("slot_start")) {
            problems.push("the database is missing slot columns \u2014 src/db.js did not migrate it");
          }
        } catch (err) {
          problems.push(`could not read the database: ${err.message}`);
        }
        if (problems.length) {
          console.error("\n  \u2717 This copy is only half updated:\n");
          for (const p of problems) console.error(`      - ${p}`);
          console.error("\n  Copy the latest src/db.js, src/seats.js and src/server.js together,");
          console.error("  then start again. They change as a set.\n");
          process.exit(1);
        }
      }
      if (__require.main === module) {
        getDb();
        checkBuild();
        const filled = schedule.fillSchedules();
        if (filled) console.log(`[schedules] added ${filled} days`);
        const sweepMs = Number(process.env.SWEEP_INTERVAL_MS || 6e4);
        setInterval(() => {
          try {
            const added = schedule.fillSchedules();
            if (added) console.log(`[schedules] added ${added} days`);
            const reminded = records.queueRenewalReminders();
            if (reminded) console.log(`[records] queued ${reminded} renewal reminders`);
            const cleared = records.anonymizeExpired();
            if (cleared) console.log(`[records] cleared details on ${cleared} bookings over 2 years old`);
            const r = seats.sweepExpired();
            if (r.expiredHolds || r.expiredOffers || r.promoted) {
              console.log("[sweep]", r);
            }
          } catch (err) {
            console.error("[sweep] failed:", err.message);
          }
        }, sweepMs).unref();
        app.listen(PORT, () => {
          console.log(`Spectrum booking API on http://localhost:${PORT}`);
          console.log(`Serving the site from: ${SITE_DIR}`);
          console.log(`Payment provider: ${payments.name}`);
          console.log(`Address lookup:   ${address.PROVIDER}` + (address.PROVIDER === "census" ? " (free; set GOOGLE_PLACES_KEY for type-ahead)" : ""));
          console.log(`Hold window: ${seats.HOLD_MINUTES} minutes`);
        });
      }
      module.exports = app;
    }
  });

  // ../vlottiz/spectrumcpr_web/src/seed.js
  var require_seed = __commonJS({
    "../vlottiz/spectrumcpr_web/src/seed.js"(exports, module) {
      "use strict";
      var { getDb } = require_db();
      function daysFromNow(n, hour, minute = 0) {
        const d = /* @__PURE__ */ new Date();
        d.setUTCDate(d.getUTCDate() + n);
        d.setUTCHours(hour, minute, 0, 0);
        return d.toISOString();
      }
      var WORKDAY = { open: 16, close: 26 };
      var CLASSES = [
        {
          course_code: "CPR",
          title: "CPR / AED",
          starts_at: daysFromNow(5, WORKDAY.open),
          ends_at: daysFromNow(5, WORKDAY.close),
          location: "",
          capacity: 20,
          price_cents: 8500
        },
        {
          course_code: "HEARTSAVER",
          title: "Heartsaver CPR / AED / First Aid",
          starts_at: daysFromNow(8, WORKDAY.open),
          ends_at: daysFromNow(8, WORKDAY.close),
          location: "",
          capacity: 24,
          price_cents: 9500
        },
        {
          course_code: "BABYSIT",
          title: "Babysitter Safety",
          starts_at: daysFromNow(12, WORKDAY.open),
          ends_at: daysFromNow(12, WORKDAY.close),
          location: "",
          capacity: 24,
          price_cents: 5500
        },
        // A second CPR day, so "another day" suggestions have somewhere to point.
        {
          course_code: "CPR",
          title: "CPR / AED",
          starts_at: daysFromNow(19, WORKDAY.open),
          ends_at: daysFromNow(19, WORKDAY.close),
          location: "",
          capacity: 20,
          price_cents: 8500
        }
      ];
      function seed() {
        const db = getDb();
        const existing = db.prepare("SELECT COUNT(*) AS n FROM classes").get().n;
        if (existing > 0 && !process.argv.includes("--force")) {
          console.log(`${existing} training days already exist. Use --force to add the sample set anyway.`);
          return;
        }
        const insert = db.prepare(
          `INSERT INTO classes
       (course_code, title, starts_at, ends_at, location, capacity, price_cents)
     VALUES (@course_code, @title, @starts_at, @ends_at, @location, @capacity, @price_cents)`
        );
        const many = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
        many(CLASSES);
        console.log(`Seeded ${CLASSES.length} training days.`);
        for (const c of db.prepare("SELECT id, title, starts_at, ends_at FROM classes").all()) {
          const day = new Date(c.starts_at).toISOString().slice(0, 10);
          const open = new Date(c.starts_at).toISOString().slice(11, 16);
          const close = new Date(c.ends_at).toISOString().slice(11, 16);
          console.log(`  ${c.id}  ${day}  ${open}-${close} UTC  ${c.title}`);
        }
      }
      if (__require.main === module) seed();
      module.exports = { seed, CLASSES };
    }
  });

  // entry.js
  var require_entry = __commonJS({
    "entry.js"(exports) {
      exports.start = async function start({ SQL, bytes }) {
        globalThis.__SQL = SQL;
        globalThis.__SQL_BYTES = bytes || null;
        const address = require_address();
        const zipTable = require_zip_centroids();
        const onlineZip = address.lookupZip;
        address.lookupZip = async (zip) => {
          const z = String(zip || "").trim().slice(0, 5);
          const row = zipTable[z];
          if (row) return { city: row[2], state: row[3], zip: z };
          return onlineZip(zip);
        };
        const app = require_server();
        const { getDb } = require_db();
        const schedule = require_schedule();
        getDb();
        try {
          schedule.fillSchedules();
        } catch (e) {
          console.warn("[demo] fillSchedules", e);
        }
        return {
          app,
          getDb,
          fresh: !bytes,
          exportBytes: () => globalThis.__SQL_DB.exportBytes(),
          seed: () => require_seed().seed()
        };
      };
    }
  });
  return require_entry();
})();
// Demo seeding through the real API. Shared by the browser runtime and the Node check.
async function seedDemo(be, call) {
  const db = be.getDb();
  const ins = db.prepare(`INSERT INTO classes (course_code, title, starts_at, ends_at, location, capacity, price_cents)
    VALUES (@course_code, @title, @starts_at, @ends_at, @location, @capacity, @price_cents)`);
  const day = (n, h) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); d.setUTCHours(h, 0, 0, 0); return d.toISOString(); };
  const extra = [[2,'CPR','CPR / AED',8500],[3,'HEARTSAVER','Heartsaver CPR / AED / First Aid',9500],[10,'HEARTSAVER','Heartsaver CPR / AED / First Aid',9500],[15,'BABYSIT','Babysitter Safety',5500],[22,'CPR','CPR / AED',8500]];
  for (const [n, code, title, cents] of extra) ins.run({ course_code: code, title, starts_at: day(n, 16), ends_at: day(n, 26), location: '', capacity: code === 'CPR' ? 20 : 24, price_cents: cents });
  const people = [
    ['Little Oaks Daycare', ['Maya Alvarez','Jordan Brooks','Priya Chen','Luis Duarte'], '97116', '100 Example St'],
    ['Westside Youth Soccer', ['Hannah Ellis','Marcus Foster','Elena Garcia'], '97123', '200 Sample Ave'],
    ['', ['Theo Hughes'], '97113', '300 Demo Rd'],
    ['Cedar Mill Dental', ['Grace Ibarra','Owen Jensen','Sofia Kim','Daniel Lopez','Ava Morgan','Noah Nguyen'], '97006', '400 Test Blvd'],
    ['', ['Isla Ortiz','Ethan Patel'], '97116', '500 Placeholder Ln'],
    ['Valley Swim Club', ['Lena Reyes','Caleb Shaw'], '97113', '600 Example Way'],
  ];
  const classes = (await call('GET', '/api/classes')).classes || [];
  let k = 0;
  for (const cls of classes.slice(0, 7)) {
    if (k >= people.length) break;
    const slots = (await call('GET', `/api/classes/${cls.id}/slots`)).slots || [];
    const open = slots.filter((s) => s.available);
    for (const pick of [open[0], open[open.length - 1]]) {
      if (!pick || k >= people.length) continue;
      const [org, names, zip, street] = people[k++];
      const email = (n) => n.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com';
      const body = { attendees: names.map((n) => ({ name: n, email: email(n), phone: '' })), name: names[0], email: email(names[0]), phone: '',
        organiserName: org || undefined, slotStart: pick.start, address: `${street}, OR ${zip}`, zip, consent: true };
      const held = await call('POST', `/api/classes/${cls.id}/hold`, body);
      const ref = held.registration && held.registration.ref;
      if (!ref) { console.warn('[demo] hold failed', held); continue; }
      if (k % 3 !== 0) await call('POST', `/api/registrations/${ref}/confirm`, { outcome: 'approve' });
      // the third of each set stays unpaid so the admin page has something to mark paid
      else await call('POST', `/api/admin/registrations/${ref}/mark-paid`, {}).catch(() => {});
      break;
    }
  }
}

/* Demo runtime: starts the real booking server in this tab and answers the page's API calls. */
(function () {
  'use strict';
  var KEY = 'spectrum_demo_db_v3';
  var here = (document.currentScript && document.currentScript.src) || location.href;
  var BASE = here.replace(/[^/]*$/, '');
  var realFetch = window.fetch.bind(window);
  var be = null;

  function save() {
    try {
      var b = be.exportBytes(), s = '';
      for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      localStorage.setItem(KEY, btoa(s));
    } catch (e) { /* storage unavailable: the demo still works for this visit */ }
  }
  function load() {
    try { var s = localStorage.getItem(KEY); if (s) return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); } catch (e) {}
    return null;
  }
  async function call(method, url, body) {
    var r = await be.app.handle({ method: method, url: url, body: body ? JSON.stringify(body) : '', headers: { 'content-type': 'application/json', 'x-admin-token': 'demo' } });
    try { return JSON.parse(r.body); } catch (e) { return r.body; }
  }

  var ready = (async function () {
    var SQL = await initSqlJs({ locateFile: function (f) { return BASE + 'vendor/' + f; } });
    var bytes = load();
    try { be = await SpectrumBackend.start({ SQL: SQL, bytes: bytes }); }
    catch (e) { console.warn('[demo] saved data unreadable, starting fresh', e); bytes = null; be = await SpectrumBackend.start({ SQL: SQL, bytes: null }); }
    if (!bytes) { be.seed(); await seedDemo(be, call); save(); }
    return be;
  })();

  window.fetch = async function (input, init) {
    init = init || {};
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var u = new URL(url, location.href);
    var path = typeof input === 'string' && input.charAt(0) === '/' ? input : null;
    var isApi = path && (/^\/api\//.test(path) || /^\/health\b/.test(path) || /^\/mock-checkout\b/.test(path));
    if (!isApi) return realFetch(input, init);
    await ready;
    var headers = {};
    var h = init.headers || {};
    if (typeof Headers !== 'undefined' && h instanceof Headers) h.forEach(function (v, k) { headers[k] = v; }); else Object.assign(headers, h);
    var method = (init.method || 'GET').toUpperCase();
    var out = await be.app.handle({ method: method, url: path, body: typeof init.body === 'string' ? init.body : '', headers: headers });
    if (method !== 'GET') save();
    await new Promise(function (r) { setTimeout(r, 120); }); // a little network feel
    return new Response(out.body, { status: out.status, headers: out.headers });
  };

  window.SpectrumDemo = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
    ready: ready,
  };
})();
