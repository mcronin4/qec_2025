import * as fs from "fs";
import * as path from "path";
import { parseAndFilterGeoJSON } from "./geojson-parser";
import { buildGraph } from "./graph-builder";

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: ts-node convert-geojson.ts <input.geojson> <output.json>");
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  console.log(`Reading GeoJSON from: ${inputPath}`);
  const roadSegments = parseAndFilterGeoJSON(inputPath);
  console.log(`Filtered ${roadSegments.length} road segments`);

  console.log("Building graph...");
  const graph = buildGraph(roadSegments);
  console.log(`Created ${graph.nodes.length} nodes and ${graph.edges.length} edges`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  console.log(`Graph written to: ${outputPath}`);
}

main();

