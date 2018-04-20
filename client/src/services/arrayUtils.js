export default {
  union: (target, source) => {
    source.forEach(item => {
      if (target.indexOf(item) === -1) {
        target.push(item);
      }
    });

    return target;
  },
  intersection: (arr1, arr2) => {
    let res = [];
    arr1.forEach(item => {
      if (arr2.indexOf(item) > -1) {
        res.push(item);
      }
    });
    return res;
  },
  subtract: (arr1, arr2) => {
    let res = [];
    arr1.forEach(item => {
      if (arr2.indexOf(item) === -1) {
        res.push(item);
      }
    });
    return res;
  },
  /**
   * @param source
   * @return []
   */
  clone: source => source.filter(() => true)
}