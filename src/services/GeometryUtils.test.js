import GeometryUtils from './GeometryUtils';

let okTest = () => {
  return 1;
};
describe('Tobe Ok test...', () => {
  test('1 to equal 1', () => {
    expect(okTest()).toBe(1);
  });
});

describe('pointIntersect', () => {
  test('line 1, line 2 to intersecting point (1, 2)', () => {
    const line1 = [
      { x: -2, y: -1 },
      { x: 4, y: 5 }
    ];
    const line2 = [
      { x: 1, y: -1 },
      { x: 1, y: 6 }
    ];
    const testResult = {
      isIntersects: true,
      points: [{ distance: 0, point: { x: 1, y: 2 } }],
      type: 'intersecting'
    };

    expect(
      GeometryUtils.linesIntersect(line1[0], line1[1], line2[0], line2[1])
    ).toEqual(testResult);
  });
});
