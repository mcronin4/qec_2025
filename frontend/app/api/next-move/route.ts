import { NextResponse } from 'next/server';
import { Node, Edge, SnowplowState } from '@/lib/types';
import { getCurrentNodeId } from '@/lib/simulation';

export async function POST(req: Request) {
  try {
    const { graph, plow } = await req.json();
    const { nodes, edges }: { nodes: Node[]; edges: Edge[] } = graph;

    // Find current node
    const currentNodeId = getCurrentNodeId(plow as SnowplowState, edges);

    if (!currentNodeId) {
      return NextResponse.json({ nextEdgeId: null });
    }

    // Find all adjacent edges from current node
    const candidateEdges = edges.filter(
      (e: Edge) => e.from === currentNodeId || e.to === currentNodeId
    );

    if (candidateEdges.length === 0) {
      return NextResponse.json({ nextEdgeId: null });
    }

    // Pick edge with max snowDepth (simple heuristic)
    const best = candidateEdges.reduce((best: Edge, e: Edge) =>
      e.snowDepth > best.snowDepth ? e : best
    , candidateEdges[0]);

    return NextResponse.json({ nextEdgeId: best.id });
  } catch (error) {
    console.error('Error in next-move API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

