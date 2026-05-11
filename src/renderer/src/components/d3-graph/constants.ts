import { D3NodeChartConfig } from "./type";

export const DEFAULT_D3_CONFIG: D3NodeChartConfig = {
  node: {
    radius: 30,
    enlargedRadius: 50,
    nameOffsetX: 25,
    nameOffsetY: 25,
    nameFontSize: "15px",
    nameFontColor: "grey",
  },
  link: {
    defaultStrokeWidth: 1,
    strokeColor: "#999",
    thicknessScaleFactor: 10,
    dashedThreshold: 0.3,
    dashArray: "5,5",
    linkDistance: 200,
  },
  zoom: {
    scaleExtent: [0.1, 10],
    zoomFactor: 1.2,
    translation: 100,
  },
  drag: {
    alphaTarget: 0.3,
  },
  force: {
    chargeStrength: -1000,
  },
  backgroundColor: "white",
};
