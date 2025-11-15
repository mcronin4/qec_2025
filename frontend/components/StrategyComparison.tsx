'use client';

import { useState } from 'react';
import { Node, Edge } from '@/lib/types';
import { initialNodes, initialEdges, initialPlow } from '@/lib/graph';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StrategyDataPoint {
  step: number;
  [key: string]: number; // Each strategy will have its own key
}

interface StrategyResult {
  policy_name: string;
  total_snow_cleared: number;
  steps_completed: number;
}

const AVAILABLE_POLICIES = [
  { id: 'naive', name: 'Naive (Random)' },
  { id: 'one_step_greedy', name: 'One-Step Greedy' },
  { id: 'finite_horizon_greedy', name: 'Finite Horizon Greedy' },
  { id: 'high_traffic_priority', name: 'High Traffic Priority' },
];

export default function StrategyComparison() {
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>(['naive', 'one_step_greedy']);
  const [maxSteps, setMaxSteps] = useState<number>(50);
  const [results, setResults] = useState<StrategyResult[]>([]);
  const [chartData, setChartData] = useState<StrategyDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Initialize edges with some snow for comparison
  const [edges] = useState<Edge[]>(() => {
    return initialEdges.map(edge => ({
      ...edge,
      snowDepth: Math.random() * 5 + 1, // Random snow depth between 1-6
    }));
  });

  const togglePolicy = (policyId: string) => {
    setSelectedPolicies(prev => {
      if (prev.includes(policyId)) {
        return prev.filter(id => id !== policyId);
      } else {
        return [...prev, policyId];
      }
    });
  };

  const runComparison = async () => {
    if (selectedPolicies.length === 0) {
      setError('Please select at least one strategy to compare');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults([]);
    setChartData([]);
    setProgress('');

    try {
      const SNOWPLOW_SPEED_MS = 20000 / 3600; // 20 km/h in m/s
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      // Run simulation for each policy
      const allResults: StrategyResult[] = [];
      const timeSeriesData: { [step: number]: { step: number; [policy: string]: number } } = {};

      // Initialize step 0 for all strategies
      timeSeriesData[0] = { step: 0 };
      selectedPolicies.forEach(policy => {
        timeSeriesData[0][policy] = 0;
      });

      for (let policyIndex = 0; policyIndex < selectedPolicies.length; policyIndex++) {
        const policy = selectedPolicies[policyIndex];
        setProgress(`Running ${policy} (${policyIndex + 1}/${selectedPolicies.length})...`);

        // Create a copy of edges for this simulation
        let currentEdges = edges.map(edge => ({
          id: edge.id,
          from_node: edge.from_node,
          to_node: edge.to_node,
          travel_time: edge.length / SNOWPLOW_SPEED_MS,
          length: edge.length,
          snow_depth: edge.snowDepth,
          streetName: edge.streetName,
        }));

        let currentNode = initialPlow.currentNodeId;
        let totalSnowCleared = 0;
        let stepsCompleted = 0;

        // Run simulation for maxSteps
        for (let step = 1; step <= maxSteps; step++) {
          try {
            // Call next_node endpoint
            const response = await fetch(`${backendUrl}/next_node`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                plow: { current_node_id: currentNode },
                nodes: initialNodes,
                edges: currentEdges,
                policy: policy,
              }),
            });

            if (!response.ok) {
              console.error(`Step ${step} failed for ${policy}`);
              break;
            }

            const data = await response.json();
            const nextNodeId = data.target_node_id;

            if (!nextNodeId) break;

            // Find the edge being traversed
            const edgeIndex = currentEdges.findIndex(edge =>
              (edge.from_node === currentNode && edge.to_node === nextNodeId) ||
              (edge.from_node === nextNodeId && edge.to_node === currentNode)
            );

            if (edgeIndex !== -1) {
              const edge = currentEdges[edgeIndex];
              // Calculate snow cleared: length × snow_depth
              if (edge.snow_depth > 0.1) {
                const snowCleared = edge.length * edge.snow_depth;
                totalSnowCleared += snowCleared;
                // Clear the edge
                currentEdges[edgeIndex] = { ...edge, snow_depth: 0 };
              }
            }

            // Record data point for this step
            if (!timeSeriesData[step]) {
              timeSeriesData[step] = { step };
            }
            timeSeriesData[step][policy] = totalSnowCleared;

            // Move to next node
            currentNode = nextNodeId;
            stepsCompleted = step;
          } catch (err) {
            console.error(`Error at step ${step} for ${policy}:`, err);
            break;
          }
        }

        allResults.push({
          policy_name: policy,
          total_snow_cleared: totalSnowCleared,
          steps_completed: stepsCompleted,
        });
      }

      // Convert time series data to array for recharts
      const chartDataArray = Object.values(timeSeriesData).sort((a, b) => a.step - b.step);
      setChartData(chartDataArray);
      setResults(allResults);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Comparison error:', err);
      setProgress('');
    } finally {
      setIsRunning(false);
    }
  };

  // Sort results by total snow cleared (descending)
  const sortedResults = [...results].sort((a, b) => b.total_snow_cleared - a.total_snow_cleared);

  // Get policy name display
  const getPolicyName = (policyId: string) => {
    const policy = AVAILABLE_POLICIES.find(p => p.id === policyId);
    return policy?.name || policyId;
  };

  // Color palette for different strategies
  const POLICY_COLORS: { [key: string]: string } = {
    naive: '#ef4444',
    one_step_greedy: '#3b82f6',
    finite_horizon_greedy: '#10b981',
    high_traffic_priority: '#f59e0b',
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Strategy Comparison</h1>
          <Link href="/snowplow">
            <Button variant="outline">
              ← Back to Simulator
            </Button>
          </Link>
        </div>
        <p className="text-gray-600">
          Compare different snowplow routing strategies based on total snow cleared.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            {/* Strategy Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Select Strategies</h3>
              <div className="space-y-2">
                {AVAILABLE_POLICIES.map(policy => (
                  <label key={policy.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPolicies.includes(policy.id)}
                      onChange={() => togglePolicy(policy.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{policy.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Steps Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Number of Steps
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxSteps}
                onChange={(e) => setMaxSteps(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many steps to simulate (1-1000)
              </p>
            </div>

            {/* Run Button */}
            <Button
              onClick={runComparison}
              disabled={isRunning || selectedPolicies.length === 0}
              className="w-full"
            >
              {isRunning ? 'Running...' : 'Run Comparison'}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {results.length === 0 && !isRunning && (
              <div className="text-center py-12 text-gray-500">
                <p>Select strategies and click "Run Comparison" to see results</p>
              </div>
            )}

            {isRunning && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-600">{progress || 'Running comparison...'}</p>
              </div>
            )}

            {sortedResults.length > 0 && chartData.length > 0 && (
              <div className="space-y-6">
                {/* Line Graph */}
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="step" 
                        label={{ value: 'Steps', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Total Snow Cleared (m³)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => value.toFixed(2) + ' m³'}
                        labelFormatter={(label) => `Step ${label}`}
                      />
                      <Legend />
                      {selectedPolicies.map(policy => (
                        <Line
                          key={policy}
                          type="monotone"
                          dataKey={policy}
                          name={getPolicyName(policy)}
                          stroke={POLICY_COLORS[policy] || '#6b7280'}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Table */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Rank</th>
                          <th className="text-left py-2 px-3">Strategy</th>
                          <th className="text-right py-2 px-3">Snow Cleared (m³)</th>
                          <th className="text-right py-2 px-3">Steps</th>
                          <th className="text-right py-2 px-3">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((result, index) => (
                          <tr key={result.policy_name} className="border-b">
                            <td className="py-2 px-3">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </td>
                            <td className="py-2 px-3 font-medium">
                              {getPolicyName(result.policy_name)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {result.total_snow_cleared.toFixed(2)}
                            </td>
                            <td className="text-right py-2 px-3">
                              {result.steps_completed}
                            </td>
                            <td className="text-right py-2 px-3">
                              {(result.total_snow_cleared / result.steps_completed).toFixed(2)} m³/step
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

