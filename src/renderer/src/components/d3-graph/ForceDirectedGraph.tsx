import React, { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { zoom, ZoomBehavior } from "d3-zoom";
import {
  NodeData,
  LinkData,
  ForceDirectedGraphProps,
  ForceDirectedD3ToolTip,
} from "./type";
import { DEFAULT_D3_CONFIG } from "./constants";
import { Fullscreen } from "lucide-react";

// Helper for legend display
const NODE_TYPE_LABELS: Record<string, string> = {
  FILE: 'File',
  CLASS: 'Class',
  FUNCTION: 'Function',
  METHOD: 'Method',
  COMPONENT: 'Component',
  MODULE: 'Module',
  PACKAGE: 'Package',
  INTERFACE: 'Interface',
  SERVICE: 'Service',
  CONTROLLER: 'Controller',
  REPOSITORY: 'Repository',
  DIRECTIVE: 'Directive',
  PIPE: 'Pipe',
  HOOK: 'Hook',
};

const NODE_COLOR_MAP: Record<string, string> = {
  FILE: '#8ecae6',        // Light blue
  CLASS: '#8ac926',       // Green
  FUNCTION: '#ffb703',    // Yellow
  METHOD: '#ffb703',      // Yellow (same as function)
  COMPONENT: '#fb8500',   // Orange
  MODULE: '#023047',      // Dark blue
  PACKAGE: '#9c89b8',     // Purple
  INTERFACE: '#70d6ff',   // Light blue
  SERVICE: '#606c38',     // Olive green
  CONTROLLER: '#bc6c25',  // Brown
  REPOSITORY: '#219ebc',  // Teal
  DIRECTIVE: '#588157',   // Forest green
  PIPE: '#457b9d',        // Steel blue
  HOOK: '#e56b6f',        // Rose

  // database-related types
  TABLE: '#4a4e69',         // Slate Gray
  COLUMN: '#9a8c98',        // Dusty Mauve
  INDEX: '#f4a261',         // Sandy Orange
  FOREIGN_KEY: '#2a9d8f',   // Desaturated Teal
  PRIMARY_KEY: '#e76f51',   // Coral Red
  PROCEDURE: '#264653',     // Deep Blue
  SCHEMA: '#6d597a',        // Muted Purple

  // Vue/reactivity types
  COMPOSABLE: '#84a59d',    // Soft Sage
  COMPUTED: '#ffcad4',      // Light Pink
  DATA: '#f7ede2',          // Cream
  STORE: '#d6ccc2',         // Taupe
  WATCHER: '#f28482',       // Salmon
  LIFECYCLE: '#9e2a2b',     // Crimson
};

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({
  data,
  config = DEFAULT_D3_CONFIG,
  setOpen,
  setSelectedNode,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );

  const nodeSelectionRef = useRef<d3.Selection<
    SVGCircleElement,
    NodeData,
    SVGGElement,
    unknown
  > | null>(null);
  const [tooltip, setTooltip] = useState<ForceDirectedD3ToolTip>({
    x: 0,
    y: 0,
    content: "",
  });

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);

  // Search and legend state
  const [searchTerm, setSearchTerm] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);
  // Filtered nodes for search dropdown
  const filteredNodes = data.nodes.filter((node) => {
    const name = (node.name || node.id || "").toLowerCase();
    return searchTerm.trim() === "" || name.includes(searchTerm.toLowerCase());
  });
  // Handler for node search selection
  const handleNodeSearchSelect = (nodeId: string) => {
    centerNode(nodeId);
    setSearchTerm("");
  };

  const centerNode = useCallback(
    (nodeId: string) => {
      const node = data.nodes.find((n) => n.id === nodeId);

      if (
        !node ||
        !svgRef.current ||
        !zoomBehavior.current ||
        !nodeSelectionRef.current
      )
        return;
      const { x = 0, y = 0 } = node;
      const svgElement = svgRef.current;
      const width = svgElement.clientWidth;
      const height = svgElement.clientHeight;

      const zoomScaleFactor = 2;
      const tx_new = width / 2 - x * zoomScaleFactor;
      const ty_new = height / 2 - y * zoomScaleFactor;

      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call((selection) => {
          if (zoomBehavior.current) {
            zoomBehavior.current.transform(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              d3.zoomIdentity.translate(tx_new, ty_new).scale(zoomScaleFactor)
            );
          }
        });

      nodeSelectionRef.current
        .transition()
        .duration(750)
        .attr("r", (d) =>
          d.id === nodeId ? config.node.enlargedRadius : config.node.radius
        );
    },
    [data.nodes, config.node.radius, config.node.enlargedRadius]
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (!svgRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      widthRef.current = width;
      heightRef.current = height;

      const svg = d3
        .select<SVGSVGElement, unknown>(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .style("background-color", config.backgroundColor);

      svg.selectAll("*").remove();

      const g = svg.append("g");

      zoomBehavior.current = zoom<SVGSVGElement, unknown>()
        .scaleExtent(config.zoom.scaleExtent)
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr("transform", event.transform.toString());
        });

      svg.call(zoomBehavior.current);

      const handleKeyDown = (event: KeyboardEvent) => {
        const { key } = event;

        if (!zoomBehavior.current) return;

        const svgSelection = svg.transition();

        if (key === "+") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.scaleBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              config.zoom.zoomFactor
            )
          );
        } else if (key === "-") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.scaleBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              1 / config.zoom.zoomFactor
            )
          );
        } else if (key === "ArrowUp") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.translateBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              0,
              config.zoom.translation
            )
          );
        } else if (key === "ArrowDown") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.translateBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              0,
              -config.zoom.translation
            )
          );
        } else if (key === "ArrowLeft") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.translateBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              config.zoom.translation,
              0
            )
          );
        } else if (key === "ArrowRight") {
          svgSelection.call((selection) =>
            zoomBehavior.current?.translateBy(
              selection as unknown as d3.Selection<
                SVGSVGElement,
                unknown,
                null,
                undefined
              >,
              -config.zoom.translation,
              0
            )
          );
        } else if (key === " ") {
          svgSelection
            .duration(750)
            .call((selection) =>
              zoomBehavior.current?.transform(
                selection as unknown as d3.Selection<
                  SVGSVGElement,
                  unknown,
                  null,
                  undefined
                >,
                d3.zoomIdentity
              )
            );
        }
      };

      d3.select(window).on("keydown", handleKeyDown);

      const simulation = d3
        .forceSimulation<NodeData>(data.nodes)
        .force(
          "link",
          d3
            .forceLink<NodeData, LinkData>(data.links)
            .id((d: NodeData) => d.id)
            .distance(config.link.linkDistance)
        )
        .force(
          "charge",
          d3.forceManyBody<NodeData>().strength(config.force.chargeStrength)
        )
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll<SVGLineElement, LinkData>("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke-width", (d) =>
          d.score
            ? Math.max(
                d.score * config.link.thicknessScaleFactor,
                config.link.defaultStrokeWidth
              )
            : config.link.defaultStrokeWidth
        )
        .attr("stroke", config.link.strokeColor)
        .attr("stroke-dasharray", (d) =>
          d.score < config.link.dashedThreshold ? config.link.dashArray : "none"
        );

      const nodeGroup = g.append("g").attr("class", "nodes");

      const nodeSelection = nodeGroup
        .selectAll<SVGCircleElement, NodeData>("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", config.node.radius)
        .attr("fill", (d) => {
          const type = (d.type || '').toUpperCase();
          return NODE_COLOR_MAP[type] || '#fb851e';
        })
        .on("mouseover", (event, d) => {
          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: `Node ID: ${d.id}`,
          });
        })
        .on("mousemove", (event) => {
          setTooltip((prev) => ({ ...prev, x: event.pageX, y: event.pageY }));
        })
        .on("mouseout", () => {
          setTooltip({ x: 0, y: 0, content: "" });
        })
        .on("click", (event, d) => {
          setSelectedNode(d.id);
          setOpen((prev: boolean) => !prev);
          centerNode(d.id);
        })
        .call(
          d3
            .drag<SVGCircleElement, NodeData>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      nodeGroup
        .selectAll<SVGTextElement, NodeData>("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .attr("x", (d) => (d.x ?? 0) + config.node.nameOffsetX)
        .attr("y", (d) => (d.y ?? 0) + config.node.nameOffsetY)
        .attr("font-size", config.node.nameFontSize)
        .attr("fill", config.node.nameFontColor)
        .text((d) => `${d.id}: ${d.name}`);

      nodeSelectionRef.current = nodeSelection;

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => {
            const source = d.source as unknown as NodeData;
            return source.x ?? 0;
          })
          .attr("y1", (d) => {
            const source = d.source as unknown as NodeData;
            return source.y ?? 0;
          })
          .attr("x2", (d) => {
            const target = d.target as unknown as NodeData;
            return target.x ?? 0;
          })
          .attr("y2", (d) => {
            const target = d.target as unknown as NodeData;
            return target.y ?? 0;
          });

        nodeSelection.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

        svg
          .selectAll<SVGTextElement, NodeData>("text")
          .attr("x", (d) => (d.x ?? 0) + config.node.nameOffsetX)
          .attr("y", (d) => (d.y ?? 0) + config.node.nameOffsetY);
      });

      function dragstarted(
        event: d3.D3DragEvent<SVGCircleElement, NodeData, unknown>,
        d: NodeData
      ) {
        if (!event.active)
          simulation.alphaTarget(config.drag.alphaTarget).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(
        event: d3.D3DragEvent<SVGCircleElement, NodeData, unknown>,
        d: NodeData
      ) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(
        event: d3.D3DragEvent<SVGCircleElement, NodeData, unknown>,
        d: NodeData
      ) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      d3.select(window).on("keydown", null);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [data, config, centerNode, setSelectedNode, setOpen]);


  // --- Zoom Controls ---
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call((selection) => {
        zoomBehavior.current?.scaleBy(
          selection as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>,
          factor
        );
      });
  };

  // Fit all nodes in view
  const handleFitAll = () => {
    if (!svgRef.current || !zoomBehavior.current) return;
    const svg = d3.select(svgRef.current);
    const circles = svg.selectAll('circle');
    if (circles.empty()) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    circles.each(function () {
      const cx = +d3.select(this).attr('cx');
      const cy = +d3.select(this).attr('cy');
      const r = +d3.select(this).attr('r');
      minX = Math.min(minX, cx - r);
      minY = Math.min(minY, cy - r);
      maxX = Math.max(maxX, cx + r);
      maxY = Math.max(maxY, cy + r);
    });
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) return;
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const scale = Math.min(width / (nodesWidth * 1.2), height / (nodesHeight * 1.2), 2);
    const tx = width / 2 - ((minX + maxX) / 2) * scale;
    const ty = height / 2 - ((minY + maxY) / 2) * scale;
    svg.transition().duration(500).call((selection) => {
      zoomBehavior.current?.transform(
        selection as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
    });
  };

  return (
    <>
      {/* Floating Controls, Search, and Legend */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, minWidth: 260 }}>
        {/* Zoom Controls */}
        <div className="flex justify-end gap-2 mb-2">
          <button
            className="bg-white border border-gray-300 rounded shadow px-2 py-1 text-xs hover:bg-orange-50"
            title="Zoom In"
            onClick={() => handleZoom(1.2)}
          >
            +
          </button>
          <button
            className="bg-white border border-gray-300 rounded shadow px-2 py-1 text-xs hover:bg-orange-50"
            title="Zoom Out"
            onClick={() => handleZoom(1 / 1.2)}
          >
            –
          </button>
          <button
            className="bg-white border border-gray-300 rounded shadow px-2 py-1 text-xs hover:bg-orange-50"
            title="Fit All Nodes"
            onClick={handleFitAll}
          >
            <Fullscreen size={16} />
          </button>
        </div>
        {/* Searchable Node Dropdown */}
        <div className="bg-white shadow-lg rounded p-3 mb-2 border border-gray-200">
          <input
            type="text"
            placeholder="Search node by name or id..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="max-h-48 overflow-y-auto mt-2 border border-gray-100 rounded bg-white shadow">
              {filteredNodes.length > 0 ? (
                filteredNodes.map(node => (
                  <div
                    key={node.id}
                    className="px-3 py-2 cursor-pointer hover:bg-orange-100 text-xs text-gray-700 flex items-center"
                    onClick={() => handleNodeSearchSelect(node.id)}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ background: NODE_COLOR_MAP[(node.type || '').toUpperCase()] || '#fb851e' }}
                    />
                    {node.name || node.id}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400">No nodes found.</div>
              )}
            </div>
          )}
        </div>
        {/* Collapsible Legend */}
        <div className="bg-white shadow-lg rounded border border-gray-200">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-orange-50 focus:outline-none"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
          >
            <span>Node Color Legend</span>
            <span className="ml-2">{legendOpen ? '▲' : '▼'}</span>
          </button>
          {legendOpen && (
            <div className="p-2 grid grid-cols-2 gap-2">
              {Object.entries(NODE_COLOR_MAP).map(([type, color]) => (
                <div key={type} className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ background: color }} />
                  <span className="text-xs text-gray-700">{NODE_TYPE_LABELS[type] || type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute bg-white text-gray-800 p-2 rounded shadow-md pointer-events-none text-xs whitespace-nowrap z-10 transform -translate-x-1/2 -translate-y-full transition-opacity duration-200 border border-gray-200`}
        style={{
          left: tooltip.x,
          top: tooltip.y,
          opacity: tooltip.content ? 1 : 0,
        }}
      >
        {tooltip.content}
      </div>
      <svg ref={svgRef} />
    </>
  );
};

export default ForceDirectedGraph;
