import React, { useEffect, useState, useRef, useCallback } from 'react';
import { worldMapStore } from '../../systems/navigation/WorldMapStore';
import { roadNetworkStore, RoadType, ROAD_TYPES, ShortestPathTestResult } from '../../systems/navigation/RoadNetworkStore';
import { LocationRegistry, CanonicalLocation } from '../../systems/ai/LocationRegistry';
import { HALF_WORLD_SIZE, WORLD_SIZE } from '../../systems/navigation/CoordinateConverter';

export type EditorTool = 'select' | 'draw_road' | 'delete_road' | 'connect' | 'add_location' | 'test_path';

export const MapEditorModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(worldMapStore.getIsMapEditorOpen());
  const [activeTool, setActiveTool] = useState<EditorTool>('draw_road');
  const [selectedRoadType, setSelectedRoadType] = useState<RoadType>('normal');
  const [showAdvancedGrid, setShowAdvancedGrid] = useState<boolean>(false);

  // Locations & Start/Target Testing
  const locations: CanonicalLocation[] = LocationRegistry.getInstance().getAllLocations();
  const [startLocId, setStartLocId] = useState<string>('bens_farm');
  const [targetLocId, setTargetLocId] = useState<string>('village_center');
  const [pathResult, setPathResult] = useState<ShortestPathTestResult | null>(null);

  // Mouse world telemetry
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [statusMessage, setStatusMessage] = useState<string>('Ready. Select [🛣 DRAW ROAD] to draw paths.');

  // Canvas Pan & Zoom state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(0.8); // 1 = 1px per meter
  const [panOffset, setPanOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 }); // offset in world meters
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Road drawing temp nodes
  const [draftNodes, setDraftNodes] = useState<{ x: number; z: number }[]>([]);

  useEffect(() => {
    const unsub = worldMapStore.subscribe(() => {
      setIsOpen(worldMapStore.getIsMapEditorOpen());
    });
    return () => unsub();
  }, []);

  // Convert World meters (x, z) to Canvas Pixel coordinates
  const worldToCanvas = useCallback(
    (wx: number, wz: number, width: number, height: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const px = centerX + (wx - panOffset.x) * zoom;
      const py = centerY + (wz - panOffset.z) * zoom;
      return { px, py };
    },
    [panOffset, zoom]
  );

  // Convert Canvas Pixel coordinates to World meters (x, z)
  const canvasToWorld = useCallback(
    (px: number, py: number, width: number, height: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const wx = (px - centerX) / zoom + panOffset.x;
      const wz = (py - centerY) / zoom + panOffset.z;
      return { wx, wz };
    },
    [panOffset, zoom]
  );

  // Auto-run initial path test
  useEffect(() => {
    if (isOpen) {
      handleRunShortestPath();
    }
  }, [isOpen]);

  const handleRunShortestPath = () => {
    const startLoc = locations.find((l: CanonicalLocation) => l.id === startLocId);
    const targetLoc = locations.find((l: CanonicalLocation) => l.id === targetLocId);

    if (!startLoc || !targetLoc) return;

    const res = roadNetworkStore.findShortestPath(
      { x: startLoc.position[0], z: startLoc.position[2] },
      { x: targetLoc.position[0], z: targetLoc.position[2] }
    );
    setPathResult(res);
    if (res.success) {
      setStatusMessage(`Path Found ✓ (${res.distance}m, ${res.nodeCount} nodes, ~${res.estimatedTimeSec}s travel time)`);
    } else {
      setStatusMessage(`⚠️ ${res.error || 'No path found'}`);
    }
  };

  const handleAutoConnect = () => {
    const count = roadNetworkStore.autoConnectIntersections();
    setStatusMessage(count > 0 ? `Connected ${count} new road intersection junctions!` : 'No new intersections detected.');
  };

  const handleFitWorld = () => {
    setZoom(0.75);
    setPanOffset({ x: 0, z: 0 });
  };

  const handleExport = () => {
    const jsonStr = roadNetworkStore.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civigensis_roads_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Exported navigation road network JSON!');
  };

  // Canvas render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Fill background terrain (Grasslands)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // World Boundary Box (-500, -500 to +500, +500)
    const topLeft = worldToCanvas(-HALF_WORLD_SIZE, -HALF_WORLD_SIZE, width, height);
    const bottomRight = worldToCanvas(HALF_WORLD_SIZE, HALF_WORLD_SIZE, width, height);
    const worldW = bottomRight.px - topLeft.px;
    const worldH = bottomRight.py - topLeft.py;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(topLeft.px, topLeft.py, worldW, worldH);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft.px, topLeft.py, worldW, worldH);

    // 2. Draw Natural Terrain Features (River Basin, Farms, Forests)
    // River
    const r1 = worldToCanvas(-300, -65, width, height);
    const r2 = worldToCanvas(300, -65, width, height);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 14 * zoom;
    ctx.beginPath();
    ctx.moveTo(r1.px, r1.py);
    ctx.lineTo(r2.px, r2.py);
    ctx.stroke();

    // Ben's Farm Zone
    const f1 = worldToCanvas(120 - 40, -160 - 40, width, height);
    const f2 = worldToCanvas(120 + 40, -160 + 40, width, height);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.fillRect(f1.px, f1.py, f2.px - f1.px, f2.py - f1.py);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.strokeRect(f1.px, f1.py, f2.px - f1.px, f2.py - f1.py);

    // 3. Optional Advanced Grid View (20x20 Sectors)
    if (showAdvancedGrid) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      for (let x = -500; x <= 500; x += 50) {
        const pStart = worldToCanvas(x, -500, width, height);
        const pEnd = worldToCanvas(x, 500, width, height);
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }
      for (let z = -500; z <= 500; z += 50) {
        const pStart = worldToCanvas(-500, z, width, height);
        const pEnd = worldToCanvas(500, z, width, height);
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }
    }

    // 4. Render Road Network Segments
    const segments = roadNetworkStore.getSegments();
    segments.forEach((seg) => {
      if (seg.nodes.length < 2) return;
      const config = ROAD_TYPES[seg.type] || ROAD_TYPES.normal;

      ctx.strokeStyle = config.color;
      ctx.lineWidth = Math.max(2, config.width * zoom);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      seg.nodes.forEach((node, idx) => {
        const { px, py } = worldToCanvas(node.x, node.z, width, height);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    // Render Draft Line (While drawing)
    if (draftNodes.length > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * zoom;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      draftNodes.forEach((node, idx) => {
        const { px, py } = worldToCanvas(node.x, node.z, width, height);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      const mousePt = worldToCanvas(mouseWorldPos.x, mouseWorldPos.z, width, height);
      ctx.lineTo(mousePt.px, mousePt.py);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Render Road Nodes & Intersections
    const nodes = roadNetworkStore.getNodes();
    nodes.forEach((node) => {
      const { px, py } = worldToCanvas(node.x, node.z, width, height);
      ctx.fillStyle = node.id.startsWith('junction') ? '#f97316' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(px, py, node.id.startsWith('junction') ? 5 * zoom : 3 * zoom, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Render Active Shortest Path Route (Glowing Gold/Emerald)
    if (pathResult && pathResult.success && pathResult.pathNodes.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6 * zoom;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      pathResult.pathNodes.forEach((node, idx) => {
        const { px, py } = worldToCanvas(node.x, node.z, width, height);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Start Dot (Blue)
      if (pathResult.startNode) {
        const s = worldToCanvas(pathResult.startNode.x, pathResult.startNode.z, width, height);
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(s.px, s.py, 8 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Target Dot (Red)
      if (pathResult.targetNode) {
        const t = worldToCanvas(pathResult.targetNode.x, pathResult.targetNode.z, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(t.px, t.py, 8 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 7. Render 3D World Locations
    locations.forEach((loc: CanonicalLocation) => {
      const { px, py } = worldToCanvas(loc.position[0], loc.position[2], width, height);

      const isStart = loc.id === startLocId;
      const isTarget = loc.id === targetLocId;

      ctx.fillStyle = isStart ? '#3b82f6' : isTarget ? '#ef4444' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 ${loc.name}`, px, py - 10);
    });
  }, [worldToCanvas, panOffset, zoom, showAdvancedGrid, draftNodes, mouseWorldPos, pathResult, locations, startLocId, targetLocId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        renderCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Canvas Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      // Middle or right click or shift drag = Pan
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { wx, wz } = canvasToWorld(px, py, canvas.width, canvas.height);

    if (activeTool === 'draw_road') {
      const newNodes = [...draftNodes, { x: Math.round(wx * 10) / 10, z: Math.round(wz * 10) / 10 }];
      setDraftNodes(newNodes);
      setStatusMessage(`Road point added (${newNodes.length}). Double-click or select another tool to finish.`);
    } else if (activeTool === 'delete_road') {
      const nearestNode = roadNetworkStore.findNearestNode(wx, wz, 15);
      if (nearestNode) {
        const segs = roadNetworkStore.getSegments();
        const found = segs.find((s) => s.nodes.some((n) => n.id === nearestNode.id));
        if (found) {
          roadNetworkStore.deleteSegment(found.id);
          setStatusMessage(`Deleted road segment ${found.id}`);
          handleRunShortestPath();
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const { wx, wz } = canvasToWorld(px, py, canvas.width, canvas.height);
    setMouseWorldPos({ x: Math.round(wx * 10) / 10, z: Math.round(wz * 10) / 10 });

    if (isPanning) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dz = (e.clientY - dragStart.y) / zoom;
      setPanOffset((prev) => ({ x: prev.x - dx, z: prev.z - dz }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDoubleClick = () => {
    if (activeTool === 'draw_road' && draftNodes.length >= 2) {
      roadNetworkStore.addRoadSegment(draftNodes, selectedRoadType);
      setDraftNodes([]);
      setStatusMessage(`Road created successfully (${selectedRoadType})!`);
      handleRunShortestPath();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.2, Math.min(3.5, prev * factor)));
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        {/* Top Header Bar */}
        <div style={styles.headerBar}>
          <div style={styles.headerTitle}>
            <span>🛣 2D GTA-STYLE WORLD ROAD MAP EDITOR</span>
            <span style={styles.subTitle}>1000m × 1000m Navigation Network Authoring</span>
          </div>
          <button style={styles.closeBtn} onClick={() => worldMapStore.setIsMapEditorOpen(false)}>
            ✕ CLOSE EDITOR
          </button>
        </div>

        {/* Toolbar Bar */}
        <div style={styles.toolbar}>
          <div style={styles.toolGroup}>
            <button
              style={activeTool === 'draw_road' ? styles.toolBtnActive : styles.toolBtn}
              onClick={() => setActiveTool('draw_road')}
            >
              🛣 DRAW ROAD
            </button>
            <button
              style={activeTool === 'select' ? styles.toolBtnActive : styles.toolBtn}
              onClick={() => {
                setActiveTool('select');
                setDraftNodes([]);
              }}
            >
              🖱 SELECT
            </button>
            <button
              style={activeTool === 'delete_road' ? styles.toolBtnActive : styles.toolBtn}
              onClick={() => {
                setActiveTool('delete_road');
                setDraftNodes([]);
              }}
            >
              ✂ DELETE ROAD
            </button>
            <button style={styles.actionBtn} onClick={handleAutoConnect}>
              🔗 CONNECT INTERSECTION
            </button>
          </div>

          <div style={styles.toolGroup}>
            <span style={styles.groupLabel}>ROAD TYPE:</span>
            {(Object.keys(ROAD_TYPES) as RoadType[]).map((rt) => (
              <button
                key={rt}
                style={{
                  ...styles.typeBtn,
                  backgroundColor: selectedRoadType === rt ? ROAD_TYPES[rt].color : '#334155',
                  color: selectedRoadType === rt ? '#ffffff' : '#94a3b8',
                }}
                onClick={() => setSelectedRoadType(rt)}
              >
                {ROAD_TYPES[rt].name.toUpperCase()} ({ROAD_TYPES[rt].costMultiplier}x)
              </button>
            ))}
          </div>

          <div style={styles.toolGroup}>
            <button style={styles.utilityBtn} onClick={() => roadNetworkStore.undo()}>
              ↩ UNDO
            </button>
            <button style={styles.utilityBtn} onClick={() => roadNetworkStore.redo()}>
              ↪ REDO
            </button>
            <button style={styles.utilityBtn} onClick={handleFitWorld}>
              ⌂ FIT WORLD
            </button>
            <button
              style={showAdvancedGrid ? styles.toggleActive : styles.toggleInactive}
              onClick={() => setShowAdvancedGrid(!showAdvancedGrid)}
            >
              {showAdvancedGrid ? 'GRID: ON' : 'ADVANCED GRID VIEW'}
            </button>
            <button style={styles.exportBtn} onClick={handleExport}>
              📤 EXPORT JSON
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={styles.mainContent}>
          {/* 2D Interactive Canvas */}
          <div style={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              style={styles.canvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onWheel={handleWheel}
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Floating Legend */}
            <div style={styles.legendBox}>
              <div style={styles.legendTitle}>MAP LEGEND</div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#94a3b8' }} /> Normal Road
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#475569' }} /> Main Road
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} /> Farm Road
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#15803d' }} /> Forest Path
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#78350f' }} /> Bridge
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#0284c7' }} /> River Basin
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} /> Shortest Path
              </div>
            </div>
          </div>

          {/* Right Control & Test Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sideHeader}>🧪 SHORTEST PATH A* TEST</div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>START LOCATION:</label>
              <select
                style={styles.selectInput}
                value={startLocId}
                onChange={(e) => setStartLocId(e.target.value)}
              >
                {locations.map((l: CanonicalLocation) => (
                  <option key={l.id} value={l.id}>
                    📍 {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>TARGET LOCATION:</label>
              <select
                style={styles.selectInput}
                value={targetLocId}
                onChange={(e) => setTargetLocId(e.target.value)}
              >
                {locations.map((l: CanonicalLocation) => (
                  <option key={l.id} value={l.id}>
                    📍 {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button style={styles.testBtn} onClick={handleRunShortestPath}>
              ⚡ FIND SHORTEST PATH
            </button>

            {/* Test Results Card */}
            {pathResult && (
              <div style={styles.resultCard}>
                <div style={{ fontWeight: 700, color: pathResult.success ? '#10b981' : '#ef4444' }}>
                  {pathResult.success ? 'Path Found ✓' : 'Pathfinding Failed'}
                </div>
                {pathResult.success ? (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <strong>Total Distance:</strong> {pathResult.distance} m
                    </div>
                    <div>
                      <strong>Waypoints:</strong> {pathResult.nodeCount} nodes
                    </div>
                    <div>
                      <strong>Est. Travel Time:</strong> {pathResult.estimatedTimeSec} s
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '6px', color: '#cbd5e1' }}>{pathResult.error}</div>
                )}
              </div>
            )}

            <div style={{ ...styles.sideHeader, marginTop: '20px' }}>🗺 WORLD LOCATIONS ({locations.length})</div>
            <div style={styles.locationList}>
              {locations.map((loc: CanonicalLocation) => (
                <div key={loc.id} style={styles.locRow}>
                  <span>📍 {loc.name}</span>
                  <span style={styles.coordText}>
                    ({loc.position[0]}, {loc.position[2]})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Telemetry Status Bar */}
        <div style={styles.statusBar}>
          <div style={{ color: '#10b981', fontWeight: 600 }}>{statusMessage}</div>
          <div style={styles.mousePos}>
            <span>World X: <strong>{mouseWorldPos.x.toFixed(1)}m</strong></span>
            <span style={{ marginLeft: '16px' }}>World Z: <strong>{mouseWorldPos.z.toFixed(1)}m</strong></span>
            <span style={{ marginLeft: '16px' }}>Zoom: <strong>{(zoom * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },
  headerBar: {
    height: '48px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: '#f8fafc',
    fontWeight: 700,
    fontSize: '15px',
  },
  subTitle: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 400,
  },
  closeBtn: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
  },
  toolbar: {
    height: '52px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    gap: '12px',
    overflowX: 'auto',
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  groupLabel: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 700,
    marginRight: '4px',
  },
  toolBtn: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toolBtnActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: '1px solid #60a5fa',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  actionBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  typeBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  utilityBtn: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  toggleInactive: {
    backgroundColor: '#1e293b',
    color: '#64748b',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  toggleActive: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  exportBtn: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'crosshair',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  legendBox: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backdropFilter: 'blur(4px)',
  },
  legendTitle: {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e2e8f0',
    fontSize: '11px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1e293b',
    borderLeft: '1px solid #334155',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  sideHeader: {
    color: '#38bdf8',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 600,
  },
  selectInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '12px',
  },
  testBtn: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  resultCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    color: '#e2e8f0',
  },
  locationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  locRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: '6px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#cbd5e1',
  },
  coordText: {
    color: '#64748b',
    fontSize: '10px',
  },
  statusBar: {
    height: '32px',
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    fontSize: '11px',
  },
  mousePos: {
    color: '#94a3b8',
  },
};
