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
  clone: source => source.filter(() => true),
  isEqual: (arr1 = [], arr2 = []) => {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (var item1 of arr1) {
      if (!arr2.includes(item1)) {
        return false;
      }
    }
    return true;
  },
  // deepCopy
};

function isPrimitive(arg) {
    var type = typeof arg;
    return arg == null || (type !== "object" && type !== "function");
}

// function deepCopy (data) {
//     if (isPrimitive(data)) {
//         return data;
//     }
//
//
//     if (Array.isArray(data)) {
//         return data.map(data => deepCopy(data));
//     }
//
//     if (isPlainObject(data)) {
//         let result = {};
//         for (let key in data) {
//             result[key] = deepCopy(data[key]);
//         }
//         return result
//     } else {
//         console.log('hard case', data);
//     }
//
//
// }
//
// function isPlainObject(o) {
//     return typeof o === 'object' && o.constructor === Object;
// }