export default class Geo {
  constructor(tileSize = 256) {
    this.tileSize = tileSize;
    this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize;
    this.originShift = 2 * Math.PI * 6378137 / 2.0;
  }

  getTileLatLngBounds(x, y, zoom) {
    let bounds = this.getTileBounds(x, y, zoom);
    let [ minLat, minLon ] = this.metersToLatLon(bounds[0], bounds[1]);
    let [ maxLat, maxLon ] = this.metersToLatLon(bounds[2], bounds[3]);

    return [ minLat, minLon, maxLat, maxLon ];
  }

  getTileBounds(x, y, zoom) {
    let [ minx, miny ] = this.pixelsToMeters(x * this.tileSize, y * this.tileSize, zoom);
    let [ maxx, maxy ] = this.pixelsToMeters((x+1) * this.tileSize, (y+1) * this.tileSize, zoom);
    return [ minx, miny, maxx, maxy ];
  }

  pixelsToMeters(x, y, zoom) {
    let res = this.getResolution(zoom);
    let mx = x * res - this.originShift;
    let my = y * res - this.originShift;
    return [ mx, my ];
  }

  getResolution(zoom) {
    return this.initialResolution / Math.pow(2, zoom);
  }

  metersToLatLon(mx, my) {
    let lon = (mx / this.originShift) * 180.0;
    let lat = (my / this.originShift) * 180.0;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);

    return [ lat, lon ];
  }
}
