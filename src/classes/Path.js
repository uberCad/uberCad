function Path() {}

Path.prototype = [];
Path.prototype.toJSON = function() {
  return this.map(v => ({
    x: v.x,
    y: v.y,
    z: v.z,
    parentId: v.parent.id
  }));
};

export default Path;
