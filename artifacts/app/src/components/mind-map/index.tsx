import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnalysisNode } from '@workspace/api-client-react';
import { CustomNode } from './custom-node';
import dagre from 'dagre';

const nodeTypes = {
  custom: CustomNode,
};

function getLayoutedElements(nodes: any[], edges: any[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 125,
      y: nodeWithPosition.y - 60,
    };
  });

  return { nodes, edges };
}

export function MindMap({ data }: { data: AnalysisNode[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ReturnType<typeof getLayoutedElements>["nodes"][number]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ReturnType<typeof getLayoutedElements>["edges"][number]>([]);

  useEffect(() => {
    const rfNodes: any[] = [];
    const rfEdges: any[] = [];

    function traverse(node: AnalysisNode, parentId?: string) {
      rfNodes.push({
        id: node.id,
        type: 'custom',
        data: {
          label: node.label,
          type: node.type,
          value: node.value,
        },
        position: { x: 0, y: 0 },
      });

      if (parentId) {
        rfEdges.push({
          id: `e-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          animated: node.type === 'metric' || node.type === 'insight',
          style: { stroke: 'hsl(var(--primary) / 0.5)', strokeWidth: 1.5 },
        });
      }

      if (node.children) {
        node.children.forEach((child) => traverse(child, node.id));
      }
    }

    data.forEach((n) => traverse(n));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      rfNodes,
      rfEdges,
      'TB'
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [data, setNodes, setEdges]);

  return (
    <div className="w-full h-full" data-testid="mind-map-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        className="dark"
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="hsl(var(--muted-foreground) / 0.2)" />
        <Controls className="bg-card border-border fill-foreground" />
        <MiniMap 
          nodeColor={(node: any) => {
            switch (node.data?.type) {
              case 'root': return 'hsl(var(--primary))';
              case 'topic': return 'hsl(var(--secondary))';
              case 'metric': return '#10b981';
              case 'insight': return '#f59e0b';
              default: return 'hsl(var(--muted))';
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="bg-card border-border"
        />
      </ReactFlow>
    </div>
  );
}