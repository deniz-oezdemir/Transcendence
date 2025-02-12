import { MathUtils, Vector3 } from 'three';

export function getSunParams(lat, lon, date = new Date()) {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  );

  const declination = 23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * rad);

  const solarNoon = 12 - lon / 15;
  const hourAngle =
    (date.getUTCHours() + date.getUTCMinutes() / 60 - solarNoon) * 15;

  const elevation =
    Math.asin(
      Math.sin(lat * rad) * Math.sin(declination * rad) +
        Math.cos(lat * rad) *
          Math.cos(declination * rad) *
          Math.cos(hourAngle * rad)
    ) / rad;
  const azimuth =
    Math.atan2(
      Math.sin(hourAngle * rad),
      Math.cos(hourAngle * rad) * Math.sin(lat * rad) -
        Math.tan(declination * rad) * Math.cos(lat * rad)
    ) / rad;

  return { elevation, azimuth };
}

export function getSkyParams(skyParams) {
  const phi = MathUtils.degToRad(90 - skyParams.elevation);
  const theta = MathUtils.degToRad(skyParams.azimuth);

  skyParams.sunPosition.setFromSphericalCoords(1, phi, theta);
  skyParams.turbidity = 10 - 8 * Math.max(0, skyParams.elevation / 90);
  skyParams.rayleigh = Math.max(0.1, 3 * (skyParams.elevation / 90));
  skyParams.mieCoefficient = 0.005 + 0.01 * (1 - skyParams.elevation / 90);
  skyParams.mieDirectionalG = 0.8 - 0.2 * (skyParams.elevation / 90);
}
