import React, { useRef, useState, useEffect, useCallback } from 'react';
import type {
  HarnessProject,
  Point,
  ToolMode,
  Wire,
  CanvasTransform,
  QuickDimension,
  Connector,
} from '../types/harness';
import {
  distance,
  polylineLength,
  pixelsToReal,
  formatMeasurement,
  midpoint,
  generateSmoothPolylinePath,
  snapToPoint,
} from '../utils/geometry';
import { getStrokeWidthForGauge } from '../utils/wirePresets';
import { UploadCloud } from 'lucide-react';

interface CanvasProps {
  project: HarnessProject;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
  selectedWireId: string | null;
  onSelectWire: (wireId: string | null) => void;
  onUpdateWire: (updatedWire: Wire) => void;
  onAddWire: (newWire: Wire) => void;
  onUpdateReferenceLinePoints: (p1: Point, p2: Point) => void;
  onTriggerCalibrationModal: (p1: Point, p2: Point, pixelDistance: number) => void;
  onAddConnector: (connector: Connector) => void;
  onUpdateConnector: (connector: Connector) => void;
  onUploadImageFile: (file: File) => void;
  bgOpacity: number;
  bgInvert: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showPhoto: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  isDrawingWire: boolean;
  setIsDrawingWire: (val: boolean) => void;
  drawingPoints: Point[];
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  finishDrawingWire: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  project,
  toolMode,
  setToolMode,
  transform,
  setTransform,
  selectedWireId,
  onSelectWire,
  onUpdateWire,
  onAddWire,
  onUpdateReferenceLinePoints,
  onTriggerCalibrationModal,
  onAddConnector,
  onUpdateConnector,
  onUploadImageFile,
  bgOpacity,
  bgInvert,
  showLabels,
  showGrid,
  showPhoto,
  svgRef,
  isDrawingWire,
  setIsDrawingWire,
  drawingPoints,
  setDrawingPoints,
  finishDrawingWire,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse pan & drag states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [mouseCanvasPos, setMouseCanvasPos] = useState<Point>({ x: 0, y: 0 });
  const [isDragOverFile, setIsDragOverFile] = useState(false);

  // Scale calibration drawing state
  const [calibratingStartPoint, setCalibratingStartPoint] = useState<Point | null>(null);

  // Quick Dimension drawing state
  const [dimensionStartPoint, setDimensionStartPoint] = useState<Point | null>(null);

  // Dragging vertex or handle
  const [draggedItem, setDraggedItem] = useState<{
    type: 'wire_vertex' | 'ref_p1' | 'ref_p2' | 'connector';
    wireId?: string;
    vertexIndex?: number;
    connectorId?: string;
    offset?: Point;
  } | null>(null);

  // Magnet Snap point indicator
  const [activeSnapPoint, setActiveSnapPoint] = useState<Point | null>(null);

  // Spacebar detection for quick pan
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !e.repeat &&
        (e.target as HTMLElement).tagName !== 'INPUT' &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        setIsDrawingWire(false);
        setDrawingPoints([]);
        setCalibratingStartPoint(null);
        setDimensionStartPoint(null);
        onSelectWire(null);
      }
      if (e.key === 'Enter' && isDrawingWire && drawingPoints.length >= 2) {
        finishDrawingWire();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDrawingWire, drawingPoints, finishDrawingWire, onSelectWire, setDrawingPoints, setIsDrawingWire]);

  // Convert Screen coordinates to Canvas internal space
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - transform.x) / transform.scale,
        y: (clientY - rect.top - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  // Collect snap candidate targets (endpoints of all other wires & connector centers)
  const getSnapCandidates = useCallback((): Point[] => {
    const candidates: Point[] = [];
    project.connectors.forEach((c) => candidates.push(c.position));
    project.wires.forEach((w) => {
      if (w.points.length > 0) {
        candidates.push(w.points[0]);
        candidates.push(w.points[w.points.length - 1]);
      }
    });
    return candidates;
  }, [project.wires, project.connectors]);

  // Wheel Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.1), 15);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({
      scale: newScale,
      x: newX,
      y: newY,
    });
  };

  // Drag and drop photo onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFile(true);
  };

  const handleDragLeave = () => {
    setIsDragOverFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadImageFile(e.dataTransfer.files[0]);
    }
  };

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    // Pan trigger: Middle button OR Spacebar pressed OR Pan mode
    if (e.button === 1 || isSpacePressed || toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      return;
    }

    if (e.button !== 0) return; // Left click only for drawing & selecting

    const canvasPoint = screenToCanvas(e.clientX, e.clientY);
    const snapResult = snapToPoint(canvasPoint, getSnapCandidates(), 12 / transform.scale);
    const effectivePoint = snapResult.snapped ? snapResult.point : canvasPoint;

    // 1. Tool: CALIBRATE SCALE
    if (toolMode === 'calibrate') {
      if (!calibratingStartPoint) {
        setCalibratingStartPoint(effectivePoint);
      } else {
        const p1 = calibratingStartPoint;
        const p2 = effectivePoint;
        const pxDist = distance(p1, p2);
        if (pxDist > 5) {
          onUpdateReferenceLinePoints(p1, p2);
          onTriggerCalibrationModal(p1, p2, pxDist);
        }
        setCalibratingStartPoint(null);
      }
      return;
    }

    // 2. Tool: DRAW CABLE
    if (toolMode === 'draw_wire') {
      if (!isDrawingWire) {
        setIsDrawingWire(true);
        setDrawingPoints([effectivePoint]);
      } else {
        setDrawingPoints((prev) => [...prev, effectivePoint]);
      }
      return;
    }

    // 3. Tool: QUICK DIMENSION
    if (toolMode === 'dimension') {
      if (!dimensionStartPoint) {
        setDimensionStartPoint(effectivePoint);
      } else {
        const newDim: QuickDimension = {
          id: `dim_${Date.now()}`,
          p1: dimensionStartPoint,
          p2: effectivePoint,
        };
        project.dimensions.push(newDim);
        setDimensionStartPoint(null);
        setToolMode('select');
      }
      return;
    }

    // 4. Tool: ADD CONNECTOR
    if (toolMode === 'add_connector') {
      const connNum = project.connectors.length + 1;
      const newConnector: Connector = {
        id: `J${connNum}`,
        name: `J${connNum} Connector`,
        type: 'Standard 4P',
        position: effectivePoint,
        pinCount: 4,
      };
      onAddConnector(newConnector);
      return;
    }

    // 5. Tool: SELECT / EDIT (clicking blank canvas deselects)
    if (toolMode === 'select') {
      onSelectWire(null);
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    const canvasPoint = screenToCanvas(e.clientX, e.clientY);
    const snapResult = snapToPoint(canvasPoint, getSnapCandidates(), 14 / transform.scale);
    setActiveSnapPoint(snapResult.snapped ? snapResult.point : null);
    setMouseCanvasPos(snapResult.snapped ? snapResult.point : canvasPoint);

    // Handle Dragging items
    if (draggedItem) {
      const targetPoint = snapResult.snapped ? snapResult.point : canvasPoint;

      if (draggedItem.type === 'wire_vertex' && draggedItem.wireId && draggedItem.vertexIndex !== undefined) {
        const wire = project.wires.find((w) => w.id === draggedItem.wireId);
        if (wire) {
          const newPts = [...wire.points];
          newPts[draggedItem.vertexIndex] = targetPoint;
          onUpdateWire({ ...wire, points: newPts });
        }
      } else if (draggedItem.type === 'ref_p1') {
        onUpdateReferenceLinePoints(targetPoint, project.referenceLine.p2);
      } else if (draggedItem.type === 'ref_p2') {
        onUpdateReferenceLinePoints(project.referenceLine.p1, targetPoint);
      } else if (draggedItem.type === 'connector' && draggedItem.connectorId) {
        const conn = project.connectors.find((c) => c.id === draggedItem.connectorId);
        if (conn) {
          onUpdateConnector({ ...conn, position: targetPoint });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedItem(null);
  };

  // Double click finishes wire drawing
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isDrawingWire && drawingPoints.length >= 2) {
      e.stopPropagation();
      finishDrawingWire();
    }
  };

  // Cursor style calculation
  const getCursorClass = () => {
    if (isPanning || isSpacePressed) return isPanning ? 'canvas-grabbing' : 'canvas-grab';
    if (toolMode === 'draw_wire' || toolMode === 'calibrate' || toolMode === 'dimension')
      return 'canvas-crosshair';
    return 'cursor-default';
  };

  const ref = project.referenceLine;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full relative overflow-hidden bg-slate-950 ${getCursorClass()} select-none`}
    >
      {/* Top Banner Guide for active tool */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all duration-200 max-w-[calc(100vw-360px)] px-2">
        {!ref.calibrated ? (
          <div className="bg-amber-500/95 text-slate-950 font-semibold px-3 py-1 rounded-full shadow-lg text-[11px] flex items-center justify-center space-x-1.5 truncate">
            <span>⚠️ Scale uncalibrated: Click "Calibrate Scale (C)" to mark a known length</span>
          </div>
        ) : toolMode === 'draw_wire' ? (
          <div className="bg-sky-500/95 text-slate-950 font-semibold px-3 py-1 rounded-full shadow-lg text-[11px] flex items-center justify-center space-x-1.5 truncate">
            <span>⚡ Routing Cable: Click bends &bull; Press Enter or Double-Click to finish</span>
          </div>
        ) : toolMode === 'calibrate' ? (
          <div className="bg-amber-400/95 text-slate-950 font-semibold px-3 py-1 rounded-full shadow-lg text-[11px] flex items-center justify-center space-x-1.5 truncate">
            <span>📏 Click Point A then Point B on a known reference to calibrate</span>
          </div>
        ) : toolMode === 'dimension' ? (
          <div className="bg-indigo-500/95 text-white font-semibold px-3 py-1 rounded-full shadow-lg text-[11px] flex items-center justify-center space-x-1.5 truncate">
            <span>📐 Click two points to measure clearance / distance</span>
          </div>
        ) : null}
      </div>

      {/* Drag & Drop Overlay */}
      {isDragOverFile && (
        <div className="absolute inset-0 z-40 bg-sky-950/80 border-4 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm animate-in fade-in">
          <UploadCloud className="w-16 h-16 text-sky-300 animate-bounce" />
          <h3 className="text-xl font-bold text-white mt-3">Drop Photo Here to Load</h3>
          <p className="text-xs text-sky-200 mt-1">Formboard, nailboard, or blueprint photo</p>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <defs>
          {/* Subtle CAD Background Grid */}
          <pattern
            id="cadGrid"
            width={50 * transform.scale}
            height={50 * transform.scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${50 * transform.scale} 0 L 0 0 0 ${50 * transform.scale}`}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
          </pattern>

          {/* Quick Dimension Marker */}
          <marker
            id="arrow-dim"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 2 L 7 5 L 0 8 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Global Pan/Zoom Viewport Group */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Canvas Background Grid */}
          {showGrid && (
            <rect
              x="-50000"
              y="-50000"
              width="100000"
              height="100000"
              fill="url(#cadGrid)"
              pointerEvents="none"
              opacity="0.6"
            />
          )}

          {/* 1. PHOTO / BACKGROUND IMAGE OVERLAY */}
          {showPhoto && project.imageSrc && (
            <image
              href={project.imageSrc}
              x="0"
              y="0"
              width={project.imageDimensions.width}
              height={project.imageDimensions.height}
              style={{
                opacity: bgOpacity,
                filter: bgInvert ? 'invert(1) hue-rotate(180deg)' : 'none',
              }}
              preserveAspectRatio="xMidYMid meet"
              pointerEvents="none"
            />
          )}

          {/* 2. CONNECTORS & TERMINALS */}
          {project.connectors.map((conn) => {
            if (conn.visible === false) return null;
            return (
              <g
                key={conn.id}
                transform={`translate(${conn.position.x}, ${conn.position.y})`}
                className={conn.locked ? 'cursor-default' : 'cursor-move'}
                onMouseDown={(e) => {
                  if (toolMode === 'select' && !conn.locked) {
                    e.stopPropagation();
                    setDraggedItem({ type: 'connector', connectorId: conn.id });
                  }
                }}
              >
                {/* Connector Housing */}
                <rect
                  x="-32"
                  y="-22"
                  width="64"
                  height="44"
                  rx="6"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                />
                {/* Pin indicators */}
                <circle cx="-16" cy="0" r="4" fill="#fbbf24" />
                <circle cx="0" cy="0" r="4" fill="#fbbf24" />
                <circle cx="16" cy="0" r="4" fill="#fbbf24" />
                {/* Connector Tag Badge */}
                <text
                  x="0"
                  y="-28"
                  fill="#38bdf8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: '0 1px 3px #000' }}
                >
                  {conn.name}
                </text>
              </g>
            );
          })}

          {/* 3. DRAWN CABLES / HARNESS WIRES */}
          {project.wires.map((wire) => {
            const parentFolder = wire.folderId ? project.folders?.find((f) => f.id === wire.folderId) : null;
            if (wire.visible === false || parentFolder?.visible === false) return null;
            const isSelected = selectedWireId === wire.id;
            const isLocked = wire.locked === true || parentFolder?.locked === true;
            const strokeW = getStrokeWidthForGauge(wire.gauge);
            const pathD =
              wire.routingStyle === 'rounded'
                ? generateSmoothPolylinePath(wire.points, 18)
                : wire.points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                    ''
                  );

            const totalPx = polylineLength(wire.points);
            const totalReal = pixelsToReal(totalPx, ref);
            const slack = wire.slackAllowance || 0;
            const slackPct = wire.slackPercent || 0;
            const totalCut = (totalReal + slack) * (1 + slackPct / 100);

            return (
              <g
                key={wire.id}
                className="group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                }}
              >
                {/* Outer Selection Glow / Hit-area */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : 'transparent'}
                  strokeWidth={strokeW + (isSelected ? 10 : 16)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? 0.45 : 0}
                  className="transition duration-150"
                />

                {/* Black outline casing for maximum contrast on any background */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#020617"
                  strokeWidth={strokeW + 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Sleeving indicator (corrugated pattern or mesh if sleeve applied) */}
                {wire.sleeving && wire.sleeving !== 'None' && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#475569"
                    strokeWidth={strokeW + 6}
                    strokeDasharray={wire.sleeving === 'Split Loom' ? '4 3' : '2 2'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                )}

                {/* Primary Wire Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={wire.color.primary}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Stripe Wire Stroke (if bicolor, e.g. green/yellow earth) */}
                {wire.color.stripe && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={wire.color.stripe}
                    strokeWidth={strokeW - 0.5}
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* End terminals dots */}
                {wire.points.length > 0 && (
                  <>
                    <circle
                      cx={wire.points[0].x}
                      cy={wire.points[0].y}
                      r={strokeW / 2 + 3}
                      fill="#0f172a"
                      stroke={wire.color.primary}
                      strokeWidth="2"
                    />
                    <circle
                      cx={wire.points[wire.points.length - 1].x}
                      cy={wire.points[wire.points.length - 1].y}
                      r={strokeW / 2 + 3}
                      fill="#0f172a"
                      stroke={wire.color.primary}
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* Segment Length Labels */}
                {showLabels &&
                  wire.points.length >= 2 &&
                  wire.points.slice(0, -1).map((pA, idx) => {
                    const pB = wire.points[idx + 1];
                    const segDistPx = distance(pA, pB);
                    if (segDistPx < 30) return null; // skip tiny segment labels
                    const segReal = pixelsToReal(segDistPx, ref);
                    const mid = midpoint(pA, pB);

                    return (
                      <g key={idx} transform={`translate(${mid.x}, ${mid.y})`} pointerEvents="none">
                        <rect
                          x="-36"
                          y="-10"
                          width="72"
                          height="20"
                          rx="4"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke="rgba(148, 163, 184, 0.4)"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="4"
                          fill="#f8fafc"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {formatMeasurement(segReal, ref.unit)}
                        </text>
                      </g>
                    );
                  })}

                {/* Total Wire Tag & Cut Length Badge at End of Wire */}
                {wire.points.length >= 2 && (
                  <g
                    transform={`translate(${wire.points[wire.points.length - 1].x + 12}, ${
                      wire.points[wire.points.length - 1].y - 12
                    })`}
                    pointerEvents="none"
                  >
                    <rect
                      x="-6"
                      y="-12"
                      width="120"
                      height="24"
                      rx="5"
                      fill="#0f172a"
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                    />
                    <text x="6" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {wire.id}:
                    </text>
                    <text
                      x="36"
                      y="4"
                      fill="#10b981"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {formatMeasurement(totalCut, ref.unit)}
                    </text>
                  </g>
                )}

                {/* Vertex Bend Handles & Midpoint Add-Vertex Handles (When Selected and Unlocked) */}
                {isSelected && !isLocked && (
                  <g>
                    {/* Draggable Vertex Handles */}
                    {wire.points.map((pt, vIdx) => (
                      <g
                        key={vIdx}
                        transform={`translate(${pt.x}, ${pt.y})`}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggedItem({
                            type: 'wire_vertex',
                            wireId: wire.id,
                            vertexIndex: vIdx,
                          });
                        }}
                        onContextMenu={(e) => {
                          // Right click to remove vertex if > 2 points
                          e.preventDefault();
                          e.stopPropagation();
                          if (wire.points.length > 2) {
                            const newPts = wire.points.filter((_, i) => i !== vIdx);
                            onUpdateWire({ ...wire, points: newPts });
                          }
                        }}
                      >
                        <circle cx="0" cy="0" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                      </g>
                    ))}

                    {/* Midpoint '+' Handles to Insert New Bend Vertices */}
                    {wire.points.slice(0, -1).map((pA, idx) => {
                      const pB = wire.points[idx + 1];
                      const mid = midpoint(pA, pB);
                      return (
                        <g
                          key={`mid_${idx}`}
                          transform={`translate(${mid.x}, ${mid.y})`}
                          className="cursor-pointer group/plus"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Insert vertex at midpoint
                            const newPts = [...wire.points];
                            newPts.splice(idx + 1, 0, mid);
                            onUpdateWire({ ...wire, points: newPts });
                          }}
                        >
                          <circle
                            cx="0"
                            cy="0"
                            r="5"
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            className="group-hover/plus:fill-sky-500 transition"
                          />
                          <text
                            x="0"
                            y="3"
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            +
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            );
          })}

          {/* 4. ACTIVE WIRE BEING ROUTED (DRAWING PREVIEW) */}
          {isDrawingWire && drawingPoints.length > 0 && (
            <g pointerEvents="none">
              {/* Existing Segments */}
              {drawingPoints.length > 1 && (
                <path
                  d={drawingPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Rubberband to mouse cursor */}
              <line
                x1={drawingPoints[drawingPoints.length - 1].x}
                y1={drawingPoints[drawingPoints.length - 1].y}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* Placed Point Dots */}
              {drawingPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Cursor Tip Marker with Live Length Badge */}
              <circle cx={mouseCanvasPos.x} cy={mouseCanvasPos.y} r="5" fill="#38bdf8" />
              <g transform={`translate(${mouseCanvasPos.x + 14}, ${mouseCanvasPos.y - 14})`}>
                <rect
                  x="-4"
                  y="-12"
                  width="110"
                  height="24"
                  rx="4"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />
                <text x="6" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  +
                  {formatMeasurement(
                    pixelsToReal(
                      distance(drawingPoints[drawingPoints.length - 1], mouseCanvasPos),
                      ref
                    ),
                    ref.unit
                  )}
                </text>
              </g>
            </g>
          )}

          {/* 5. QUICK DIMENSIONS */}
          {project.dimensions.map((dim) => {
            if (dim.visible === false) return null;
            const rawPx = distance(dim.p1, dim.p2);
            const realDist = pixelsToReal(rawPx, ref);
            const mid = midpoint(dim.p1, dim.p2);
            return (
              <g key={dim.id}>
                <line
                  x1={dim.p1.x}
                  y1={dim.p1.y}
                  x2={dim.p2.x}
                  y2={dim.p2.y}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  markerStart="url(#arrow-dim)"
                  markerEnd="url(#arrow-dim)"
                />
                <g transform={`translate(${mid.x}, ${mid.y})`}>
                  <rect
                    x="-35"
                    y="-10"
                    width="70"
                    height="20"
                    rx="4"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {formatMeasurement(realDist, ref.unit)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Active Quick Dimension rubberband */}
          {dimensionStartPoint && (
            <g pointerEvents="none">
              <line
                x1={dimensionStartPoint.x}
                y1={dimensionStartPoint.y}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <circle cx={dimensionStartPoint.x} cy={dimensionStartPoint.y} r="4" fill="#38bdf8" />
              <circle cx={mouseCanvasPos.x} cy={mouseCanvasPos.y} r="4" fill="#38bdf8" />
            </g>
          )}

          {/* 6. REFERENCE LINE (CALIBRATION OVERLAY) */}
          {ref.visible !== false && (
            <g id="reference-line-group">
              {/* The Reference Line Dimension Stroke */}
            <line
              x1={ref.p1.x}
              y1={ref.p1.y}
              x2={ref.p2.x}
              y2={ref.p2.y}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            />

            {/* End Point 1 Draggable Handle */}
            <g
              transform={`translate(${ref.p1.x}, ${ref.p1.y})`}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggedItem({ type: 'ref_p1' });
              }}
            >
              <circle cx="0" cy="0" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="3" fill="#0f172a" />
              <text
                x="0"
                y="-14"
                fill="#fbbf24"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                REF A
              </text>
            </g>

            {/* End Point 2 Draggable Handle */}
            <g
              transform={`translate(${ref.p2.x}, ${ref.p2.y})`}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggedItem({ type: 'ref_p2' });
              }}
            >
              <circle cx="0" cy="0" r="9" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="3" fill="#0f172a" />
              <text
                x="0"
                y="-14"
                fill="#fbbf24"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                REF B
              </text>
            </g>

            {/* Centered Calibration Badge */}
            {(() => {
              const mid = midpoint(ref.p1, ref.p2);
              const pxDist = distance(ref.p1, ref.p2);
              return (
                <g
                  transform={`translate(${mid.x}, ${mid.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerCalibrationModal(ref.p1, ref.p2, pxDist);
                  }}
                >
                  <rect
                    x="-75"
                    y="-13"
                    width="150"
                    height="26"
                    rx="6"
                    fill="#0f172a"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))"
                  />
                  <text
                    x="0"
                    y="4"
                    fill="#fbbf24"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    REF: {ref.calibrated ? `${ref.realDistance} ${ref.unit}` : 'Uncalibrated'}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

          {/* Active Calibration rubberband when drawing reference line */}
          {calibratingStartPoint && (
            <g pointerEvents="none">
              <line
                x1={calibratingStartPoint.x}
                y1={calibratingStartPoint.y}
                x2={mouseCanvasPos.x}
                y2={mouseCanvasPos.y}
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="8 4"
              />
              <circle cx={calibratingStartPoint.x} cy={calibratingStartPoint.y} r="6" fill="#fbbf24" />
              <circle cx={mouseCanvasPos.x} cy={mouseCanvasPos.y} r="6" fill="#fbbf24" />
            </g>
          )}

          {/* 7. MAGNET SNAP INDICATOR */}
          {activeSnapPoint && (
            <g transform={`translate(${activeSnapPoint.x}, ${activeSnapPoint.y})`} pointerEvents="none">
              <circle cx="0" cy="0" r="10" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
              <circle cx="0" cy="0" r="3" fill="#10b981" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
