function Path() {}

Path.prototype = [];
Path.prototype.toJSON = function() {
  return this.map(v => ({
    x: v.x,
    y: v.y,
    z: v.z,
    parentUuid: v.parent.uuid
  }));
};

export default Path;
