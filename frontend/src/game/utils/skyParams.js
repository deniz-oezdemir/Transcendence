import { MathUtils } from 'three';

export function getSunParams(lat, lon, date = new Date()) {
  const dayOfYear =
    ((date - new Date(date.getFullYear(), 0, 0)) / 86400000) | 0;

  const declinationRad = MathUtils.degToRad(
    23.44 * Math.cos(MathUtils.degToRad((360 / 365) * (dayOfYear + 10)))
  );
  const solarNoon = 12 - lon / 15;
  const hourAngleRad = MathUtils.degToRad(
    (date.getUTCHours() + date.getUTCMinutes() / 60 - solarNoon) * 15
  );
  const latRad = MathUtils.degToRad(lat);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDecl = Math.sin(declinationRad);
  const cosDecl = Math.cos(declinationRad);
  const cosHourAngle = Math.cos(hourAngleRad);

  const elevation =
    Math.asin(sinLat * sinDecl + cosLat * cosDecl * cosHourAngle) *
    (180 / Math.PI);
  const azimuth =
    Math.atan2(
      Math.sin(hourAngleRad),
      cosHourAngle * sinLat - Math.tan(declinationRad) * cosLat
    ) *
    (180 / Math.PI);

  return { elevation, azimuth };
}

export function getSkyParams(skyParams) {
  const elevationRatio = Math.max(0, skyParams.elevation / 90);

  skyParams.sunPosition.setFromSphericalCoords(
    1,
    MathUtils.degToRad(90 - skyParams.elevation),
    MathUtils.degToRad(skyParams.azimuth)
  );
  skyParams.turbidity = 10 - 8 * elevationRatio;
  skyParams.rayleigh = Math.max(0.1, 3 * elevationRatio);
  skyParams.mieCoefficient = 0.005 + 0.01 * (1 - elevationRatio);
  skyParams.mieDirectionalG = 0.8 - 0.2 * elevationRatio;
}
