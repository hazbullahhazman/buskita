# Lingkaran Ilmu road data

Source: OpenStreetMap contributors, downloaded 2026-10-17 from https://api.openstreetmap.org/api/0.6/map?bbox=103.630,1.555,103.645,1.568 . Licence: Open Database Licence (ODbL), https://www.openstreetmap.org/copyright . The extracted route data and derived coordinates are distributed under ODbL. This licence applies to the geographic data, not automatically to the application code.

`utm-map.osm` retains the source extract. `lingkaran-ilmu-route.json` records ordered way IDs, node IDs, one-way tags and coordinates. `shared/road-data.ts` contains the same coordinates for the application. All 86 route edges come from named tertiary-road ways; no straight connector, cycleway or guessed closing segment was added. Ten ways join by identical node IDs into a closed loop. Follow their stored order; eight ways are tagged oneway=yes and two have no explicit one-way tag. This is an OSM road interpretation, not confirmation of UTM bus service direction or access permissions.

Mapped stops: Centre Point node 6430105391; E01 13710334948; D01 3067842529; D05 14159741605; D06 13710334947. Node/platform coordinates can be alongside the road rather than at its centre. Meranti and PSZ/MSI access stops are explicitly proposed and projected onto the road; additional gap-filling stops remain proposed, not real shelters.

Place points: MSI centroid from way 207409192; PSZ centroid from 207409194; FKM centroid from 206806882; Arked Meranti centroid from 686051868; FABU node 6430105421; Centre Point node 6430105391. Building-centre coordinates are not validated walking entrances. E01 is named as a bus stop, not asserted to be the FKE building. For buildings not listed, pin the intended location.

All three demo buses currently share this road loop. Each real bus service's separate route, operating direction, schedule and stop accessibility must still be verified with UTM. Suggested stop distance calculations are straight-line proximity; they do not account for fences or accessible walking paths.
