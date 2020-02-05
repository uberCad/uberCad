import React from 'react';

let previewInConsole = (url, ...text) => {
  // Create a new `Image` instance
  let image = new window.Image();

  image.onload = function() {
    // Inside here we already have the dimensions of the loaded image
    let style = [
      // Hacky way of forcing image's viewport using `font-size` and `line-height`
      'font-size: 1px;',
      // 'line-height: ' + this.height * 0.5 + 'px;',

      // Hacky way of forcing a middle/center anchor point for the image
      'padding: ' + this.height * 0.5 + 'px ' + this.width * 0.5 + 'px;',

      // Set image dimensions
      'background-size: ' + this.width + 'px ' + this.height + 'px;',

      // Set image URL
      'background: url(' + url + ');'
    ].join(' ');
    console.log('%c ', style, ...text);
  };
  // Actually loads the image
  image.src = url;
};

let previewObjectInConsole = (object, ...textData) => {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${
                              object.userData.edgeModel.svgData.viewBox.width
                            }m" height="${
    object.userData.edgeModel.svgData.viewBox.height
  }m" viewBox="${object.userData.edgeModel.svgData.viewBox.x} ${
    object.userData.edgeModel.svgData.viewBox.y
  } ${object.userData.edgeModel.svgData.viewBox.width} ${
    object.userData.edgeModel.svgData.viewBox.height
  }">
                            <desc>
                                <schema desc="BuildingSVG" version="1.1"></schema>
                                <constr id="Dummy" scale="1"></constr>
                            </desc>
                            <g id="group_d">
                                ${`<path d="${
                                  object.userData.edgeModel.svgData.pathD
                                } " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001">
                                     <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"></matprop>
                                     <area value="0.002" />
                                   </path>
                                   <circle cx="${(
                                     object.userData.edgeModel.svgData
                                       .insidePoint.x / 1000
                                   ).toFixed(4)}" cy="${(
                                  object.userData.edgeModel.svgData.insidePoint
                                    .y / 1000
                                ).toFixed(
                                  4
                                )}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /> ` +
                                  object.userData.edgeModel.svgData.subRegionsPathD
                                    .map(pathD => {
                                      return `<path d="${pathD} " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001">
                                                        <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"></matprop>
                                                        <area value="0.01" />
                                                    </path>`;
                                    })
                                    .join('')}
                            </g>
                            </svg>`;

  previewInConsole(
    'data:image/svg+xml;base64,' + window.btoa(svg),
    ...textData
  );
};

let previewPathInConsole = (path, vertex, ...textData) => {
  let minX = Math.min(...path.map(v => v.x));
  let minY = Math.min(...path.map(v => v.y));
  let width = Math.max(...path.map(v => v.x)) - minX;
  let height = Math.max(...path.map(v => v.y)) - minY;

  // console.log('previewPathInConsole = (path, vertex)', path, vertex)

  let vertexData = '';
  if (vertex) {
    if (!Array.isArray(vertex)) {
      minX = Math.min(...path.map(v => v.x), vertex.x);
      minY = Math.min(...path.map(v => v.y), vertex.y);
      width = Math.max(...path.map(v => v.x), vertex.x) - minX;
      height = Math.max(...path.map(v => v.y), vertex.y) - minY;
      vertexData = `<circle cx="${(vertex.x / 1000).toFixed(4)}" cy="${(
        vertex.y / 1000
      ).toFixed(
        4
      )}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />`;
    } else {
      vertex.forEach(vertex => {
        vertexData += `<circle cx="${(vertex.x / 1000).toFixed(4)}" cy="${(
          vertex.y / 1000
        ).toFixed(
          4
        )}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />`;
      });
    }
  }

  let viewBox = {
    width: (width / 1000).toFixed(4),
    height: (height / 1000).toFixed(4),
    x: (minX / 1000).toFixed(4),
    y: (minY / 1000).toFixed(4)
  };

  let vertexList = [];

  let last = path[path.length - 1];
  let lastVertex = `${(last.x / 1000).toFixed(4)}, ${(last.y / 1000).toFixed(
    4
  )}`;

  let pathD = `M${lastVertex} L`;

  path.forEach(v => {
    let vertex = `${(v.x / 1000).toFixed(4)}, ${(v.y / 1000).toFixed(4)}`;
    if (vertex !== lastVertex && vertexList.indexOf(vertex) < 0) {
      pathD += `${vertex} `;
      lastVertex = vertex;
      vertexList.push(vertex);
    }
  });

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${viewBox.width}m" height="${viewBox.height}m" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">
                            <desc>
                                <schema desc="BuildingSVG" version="1.1"></schema>
                                <constr id="Dummy" scale="1"></constr>
                            </desc>
                            <g id="group_d">
                                <path d="${pathD} " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001"></path>
    ${vertexData}
                            </g>
                            </svg>`;
  previewInConsole(
    'data:image/svg+xml;base64,' + window.btoa(svg),
    ...textData
  );
};

let getSvg = object => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${object.userData.edgeModel.svgData.viewBox.x}
         ${object.userData.edgeModel.svgData.viewBox.y}
         ${object.userData.edgeModel.svgData.viewBox.width}
         ${object.userData.edgeModel.svgData.viewBox.height}
        `}
    >
      <path fill="#9F9F9F" d={object.userData.edgeModel.svgData.pathD} />
    </svg>
  );
};

export default {
  previewInConsole,
  previewPathInConsole,
  previewObjectInConsole,
  getSvg
};
