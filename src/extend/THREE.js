import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';

/**
 * Returns the angle in radians of the vector (p1,p2). In other words, imagine
 * putting the base of the vector at coordinates (0,0) and finding the angle
 * from vector (1,0) to (p1,p2).
 * @param  {Object} p1 start point of the vector
 * @param  {Object} p2 end point of the vector
 * @return {Number} the angle
 */
THREE.Math.angle2 = function(p1, p2) {
  let v1 = new THREE.Vector2(p1.x, p1.y);
  let v2 = new THREE.Vector2(p2.x, p2.y);
  v2.sub(v1); // sets v2 to be our chord
  v2.normalize();
  if (v2.y < 0) return -Math.acos(v2.x);
  return Math.acos(v2.x);
};

THREE.Math.polar = function(point, distance, angle) {
  let result = {};
  result.x = point.x + distance * Math.cos(angle);
  result.y = point.y + distance * Math.sin(angle);
  return result;
};

/**
 * Calculates points for a curve between two points
 * @param startPoint - the starting point of the curve
 * @param endPoint - the ending point of the curve
 * @param bulge - a value indicating how much to curve
 * @param segments - number of segments between the two given points
 */
const BulgeGeometry = (startPoint, endPoint, bulge, segments) => {
  let vertex, i, center, p0, p1, angle, radius, startAngle, thetaAngle;

  THREE.Geometry.call(this);

  this.startPoint = p0 = startPoint
    ? new THREE.Vector2(startPoint.x, startPoint.y)
    : new THREE.Vector2(0, 0);
  this.endPoint = p1 = endPoint
    ? new THREE.Vector2(endPoint.x, endPoint.y)
    : new THREE.Vector2(1, 0);
  this.bulge = bulge = bulge || 1;

  angle = 4 * Math.atan(bulge);
  radius = p0.distanceTo(p1) / 2 / Math.sin(angle / 2);
  center = THREE.Math.polar(
    startPoint,
    radius,
    THREE.Math.angle2(p0, p1) + (Math.PI / 2 - angle / 2)
  );

  this.segments = segments =
    segments || Math.max(Math.abs(Math.ceil(angle / (Math.PI / 18))), 6); // By default want a segment roughly every 10 degrees
  startAngle = THREE.Math.angle2(center, p0);
  thetaAngle = angle / segments;

  this.vertices.push(new THREE.Vector3(p0.x, p0.y, 0));

  for (i = 1; i <= segments - 1; i++) {
    vertex = THREE.Math.polar(
      center,
      Math.abs(radius),
      startAngle + thetaAngle * i
    );
    this.vertices.push(new THREE.Vector3(vertex.x, vertex.y, 0));
  }
};

export * from 'three';
export { BulgeGeometry, LegacyJSONLoader };
