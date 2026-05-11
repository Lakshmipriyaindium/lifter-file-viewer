import React, { useState } from "react";
import { GraphData } from "./type";
import ForceDirectedGraph from "./ForceDirectedGraph";

interface ForceDirectedGraphChartProps {
  data: GraphData;
}

const ForceDirectedGraphChart: React.FC<ForceDirectedGraphChartProps> = ({ data }) => {
  const [, setSelectedNode] = useState<string>("");
  const [, setOpen] = useState<boolean>(false);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden">
      <ForceDirectedGraph
        data={data}
        setOpen={setOpen}
        setSelectedNode={setSelectedNode}
      />
    </div>
  );
};

export default ForceDirectedGraphChart;
