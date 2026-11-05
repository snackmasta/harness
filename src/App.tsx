import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  HarnessProject,
  ToolMode,
  CanvasTransform,
  Point,
  Unit,
  Wire,
  Connector,
} from './types/harness';
import { SAMPLE_PROJECTS, type SampleImage } from './utils/sampleImages';
import { distance, convertUnit } from './utils/geometry';
import { exportPlanAsImage, generateCutSheetCsv, downloadFile } from './utils/export';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { WirePropertyEditor } from './components/WirePropertyEditor';
import { CalibrationModal } from './components/CalibrationModal';
import { CutSheetModal } from './components/CutSheetModal';
import { ViewControls } from './components/ViewControls';

// Initialize with Automotive Formboard template & demo wires
const defaultSample = SAMPLE_PROJECTS[0];

const INITIAL_PROJECT: HarnessProject = {
  version: '1.0',
  name: 'Automotive Powertrain Harness #A1',
  imageSrc: defaultSample.dataUrl,
  imageDimensions: { width: defaultSample.width, height: defaultSample.height },
  referenceLine: {
    p1: defaultSample.defaultRef.p1,
    p2: defaultSample.defaultRef.p2,
    realDistance: defaultSample.defaultRef.realDistance,
    unit: defaultSample.defaultRef.unit,
    calibrated: true,
  },
  connectors: [
    { id: 'J1', name: 'J1 - ECU Main', type: '12P Automotive', position: { x: 160, y: 440 }, pinCount: 12 },
    { id: 'P1', name: 'P1 - Battery / GND', type: 'Power Studs', position: { x: 160, y: 780 }, pinCount: 2 },
    { id: 'S1', name: 'S1 - Wheel Speed', type: 'DT04-2P', position: { x: 1360, y: 240 }, pinCount: 2 },
    { id: 'A1', name: 'A1 - Throttle Actuator', type: 'DT06-4S', position: { x: 1360, y: 680 }, pinCount: 4 },
    { id: 'GW', name: 'GW - J1939 Bus', type: 'Deutsch 3P', position: { x: 860, y: 880 }, pinCount: 3 },
  ],
  wires: [
    {
      id: 'W01',
      name: '12V Main Feed',
      points: [
        { x: 160, y: 780 },
        { x: 360, y: 780 },
        { x: 360, y: 580 },
        { x: 560, y: 500 },
        { x: 360, y: 440 },
        { x: 160, y: 440 },
      ],
      color: { name: 'Red (+12V/VCC)', primary: '#ef4444' },
      gauge: '14 AWG',
      wireType: 'Single Core',
      slackAllowance: 25,
      slackPercent: 5,
      fromConnectorId: 'P1',
      fromPin: '1 (+)',
      toConnectorId: 'J1',
      toPin: 'PIN 1',
      sleeving: 'Split Loom',
      bundleGroup: 'Main Trunk',
      routingStyle: 'rounded',
      notes: 'Main 25A battery line with protective split loom.',
    },
    {
      id: 'W02',
      name: 'Chassis Ground 0V',
      points: [
        { x: 160, y: 780 },
        { x: 360, y: 780 },
        { x: 360, y: 580 },
        { x: 560, y: 500 },
        { x: 360, y: 440 },
        { x: 160, y: 440 },
      ],
      color: { name: 'Black (GND/0V)', primary: '#1e293b' },
      gauge: '14 AWG',
      wireType: 'Single Core',
      slackAllowance: 25,
      slackPercent: 5,
      fromConnectorId: 'P1',
      fromPin: '2 (-)',
      toConnectorId: 'J1',
      toPin: 'PIN 2',
      sleeving: 'Split Loom',
      bundleGroup: 'Main Trunk',
      routingStyle: 'rounded',
      notes: 'Primary grounding circuit to master stud.',
    },
    {
      id: 'W03',
      name: 'CAN-High Signal',
      points: [
        { x: 160, y: 440 },
        { x: 360, y: 440 },
        { x: 560, y: 500 },
        { x: 760, y: 500 },
        { x: 960, y: 500 },
        { x: 1060, y: 380 },
        { x: 1200, y: 240 },
        { x: 1360, y: 240 },
      ],
      color: { name: 'White / Blue Stripe (CAN Low)', primary: '#f8fafc', stripe: '#3b82f6' },
      gauge: '20 AWG',
      wireType: 'Twisted Pair',
      slackAllowance: 15,
      slackPercent: 3,
      fromConnectorId: 'J1',
      fromPin: 'PIN 5',
      toConnectorId: 'S1',
      toPin: 'PIN 1',
      bundleGroup: 'CAN Bus Trunk',
      routingStyle: 'rounded',
      notes: 'Twisted pair 33 twists/meter with W04.',
    },
    {
      id: 'W04',
      name: 'CAN-Low Signal',
      points: [
        { x: 160, y: 440 },
        { x: 360, y: 440 },
        { x: 560, y: 500 },
        { x: 760, y: 500 },
        { x: 960, y: 500 },
        { x: 1060, y: 380 },
        { x: 1200, y: 240 },
        { x: 1360, y: 240 },
      ],
      color: { name: 'Blue (CAN-L/Bus)', primary: '#3b82f6' },
      gauge: '20 AWG',
      wireType: 'Twisted Pair',
      slackAllowance: 15,
      slackPercent: 3,
      fromConnectorId: 'J1',
      fromPin: 'PIN 6',
      toConnectorId: 'S1',
      toPin: 'PIN 2',
      bundleGroup: 'CAN Bus Trunk',
      routingStyle: 'rounded',
      notes: 'CAN Low 500kbps bus line.',
    },
    {
      id: 'W05',
      name: 'Actuator PWM Drive',
      points: [
        { x: 160, y: 440 },
        { x: 360, y: 440 },
        { x: 560, y: 500 },
        { x: 760, y: 500 },
        { x: 960, y: 500 },
        { x: 1060, y: 620 },
        { x: 1200, y: 680 },
        { x: 1360, y: 680 },
      ],
      color: { name: 'Violet (Ignition/PWM)', primary: '#a855f7' },
      gauge: '18 AWG',
      wireType: 'Single Core',
      slackAllowance: 20,
      slackPercent: 2,
      fromConnectorId: 'J1',
      fromPin: 'PIN 9',
      toConnectorId: 'A1',
      toPin: 'PIN 1',
      sleeving: 'Heatshrink',
      bundleGroup: 'Branch 2',
      routingStyle: 'rounded',
      notes: 'High frequency PWM drive wire.',
    },
  ],
  dimensions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const App: React.FC = () => {
  // Project State & Undo/Redo History
  const [project, setProject] = useState<HarnessProject>(INITIAL_PROJECT);
  const [history, setHistory] = useState<HarnessProject[]>([]);
  const [future, setFuture] = useState<HarnessProject[]>([]);

  // Active Tool Mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedWireId, setSelectedWireId] = useState<string | null>('W01');

  // Drawing wire state
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  // Canvas Viewport Transform
  const [transform, setTransform] = useState<CanvasTransform>({ x: 20, y: 20, scale: 0.75 });

  // Calibration Modal State
  const [calibModalState, setCalibModalState] = useState<{
    isOpen: boolean;
    pixelDistance: number;
    pendingP1: Point | null;
    pendingP2: Point | null;
  }>({
    isOpen: false,
    pixelDistance: 0,
    pendingP1: null,
    pendingP2: null,
  });

  // Cut Sheet BOM Modal
  const [cutSheetOpen, setCutSheetOpen] = useState(false);

  // Display Adjustments
  const [bgOpacity, setBgOpacity] = useState(0.9);
  const [bgInvert, setBgInvert] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);

  // SVG ref for export
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Push state to undo history
  const pushHistory = useCallback(
    (newProject: HarnessProject) => {
      setHistory((prev) => [...prev.slice(-25), project]);
      setFuture([]);
      setProject(newProject);
    },
    [project]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [project, ...prev]);
    setProject(previous);
  }, [history, project]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, project]);
    setProject(next);
  }, [future, project]);

  // Fit Image or Plan to Screen
  const handleFitToScreen = useCallback(() => {
    const w = project.imageDimensions.width || 1200;
    const h = project.imageDimensions.height || 800;
    const margin = 60;
    const availW = window.innerWidth - (selectedWireId ? 320 : 0) - margin * 2;
    const availH = window.innerHeight - 56 - margin * 2; // minus navbar

    const scale = Math.min(availW / w, availH / h, 1.2);
    const x = Math.max(margin, (availW - w * scale) / 2 + margin);
    const y = Math.max(margin, (availH - h * scale) / 2 + margin);

    setTransform({ scale, x, y });
  }, [project.imageDimensions, selectedWireId]);

  useEffect(() => {
    handleFitToScreen();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v' || e.key === 'V') {
        setToolMode('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setToolMode('calibrate');
      } else if (e.key === 'w' || e.key === 'W') {
        setToolMode('draw_wire');
      } else if (e.key === 'd' || e.key === 'D') {
        setToolMode('dimension');
      } else if (e.key === 'n' || e.key === 'N') {
        setToolMode('add_connector');
      } else if (e.key === 'h' || e.key === 'H') {
        setToolMode('pan');
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWireId) {
        handleDeleteWire(selectedWireId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, handleUndo, handleRedo]);

  // Finish wire creation
  const handleFinishDrawingWire = useCallback(() => {
    if (drawingPoints.length < 2) {
      setIsDrawingWire(false);
      setDrawingPoints([]);
      return;
    }

    const wireNum = project.wires.length + 1;
    const newWire: Wire = {
      id: `W${wireNum < 10 ? '0' + wireNum : wireNum}`,
      name: `Wire ${wireNum}`,
      points: [...drawingPoints],
      color: { name: 'Red (+12V/VCC)', primary: '#ef4444' },
      gauge: '18 AWG',
      wireType: 'Single Core',
      slackAllowance: 15, // 15mm default stripping slack
      slackPercent: 0,
      routingStyle: 'straight',
    };

    handleAddWire(newWire);
    setIsDrawingWire(false);
    setDrawingPoints([]);
    setToolMode('select');
  }, [drawingPoints, project.wires.length]);

  const handleCancelDrawing = useCallback(() => {
    setIsDrawingWire(false);
    setDrawingPoints([]);
    setToolMode('select');
  }, []);

  // Photo Upload Handler
  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newProj: HarnessProject = {
          ...project,
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageSrc: src,
          imageDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          referenceLine: {
            p1: { x: img.naturalWidth * 0.1, y: img.naturalHeight * 0.15 },
            p2: { x: img.naturalWidth * 0.35, y: img.naturalHeight * 0.15 },
            realDistance: 100,
            unit: 'mm',
            calibrated: false, // Prompt user to calibrate
          },
          updatedAt: new Date().toISOString(),
        };
        pushHistory(newProj);
        setToolMode('calibrate'); // automatically prompt calibrate mode
        setTimeout(() => handleFitToScreen(), 100);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Sample Selection Handler
  const handleSelectSample = (sample: SampleImage) => {
    const newProj: HarnessProject = {
      ...project,
      name: sample.name,
      imageSrc: sample.dataUrl,
      imageDimensions: { width: sample.width, height: sample.height },
      referenceLine: {
        p1: sample.defaultRef.p1,
        p2: sample.defaultRef.p2,
        realDistance: sample.defaultRef.realDistance,
        unit: sample.defaultRef.unit,
        calibrated: true,
      },
      updatedAt: new Date().toISOString(),
    };
    pushHistory(newProj);
    setTimeout(() => handleFitToScreen(), 100);
  };

  // Unit Change Handler (with automatic value conversion)
  const handleUnitChange = (newUnit: Unit) => {
    const oldUnit = project.referenceLine.unit;
    if (oldUnit === newUnit) return;

    const convertedRealDist = convertUnit(project.referenceLine.realDistance, oldUnit, newUnit);

    const updatedWires = project.wires.map((w) => ({
      ...w,
      slackAllowance: convertUnit(w.slackAllowance || 0, oldUnit, newUnit),
    }));

    pushHistory({
      ...project,
      referenceLine: {
        ...project.referenceLine,
        unit: newUnit,
        realDistance: convertedRealDist,
      },
      wires: updatedWires,
      updatedAt: new Date().toISOString(),
    });
  };

  // Trigger Calibration Modal
  const handleTriggerCalibrationModal = (p1: Point, p2: Point, pxDist: number) => {
    setCalibModalState({
      isOpen: true,
      pixelDistance: pxDist,
      pendingP1: p1,
      pendingP2: p2,
    });
  };

  const handleSaveCalibration = (distanceVal: number, unitVal: Unit) => {
    pushHistory({
      ...project,
      referenceLine: {
        ...project.referenceLine,
        realDistance: distanceVal,
        unit: unitVal,
        calibrated: true,
      },
      updatedAt: new Date().toISOString(),
    });
    setCalibModalState((prev) => ({ ...prev, isOpen: false }));
    setToolMode('select');
  };

  const handleUpdateReferenceLinePoints = (p1: Point, p2: Point) => {
    setProject((prev) => ({
      ...prev,
      referenceLine: {
        ...prev.referenceLine,
        p1,
        p2,
      },
    }));
  };

  // Wire CRUD handlers
  const handleAddWire = (newWire: Wire) => {
    pushHistory({
      ...project,
      wires: [...project.wires, newWire],
      updatedAt: new Date().toISOString(),
    });
    setSelectedWireId(newWire.id);
  };

  const handleUpdateWire = (updatedWire: Wire) => {
    setProject((prev) => ({
      ...prev,
      wires: prev.wires.map((w) => (w.id === updatedWire.id ? updatedWire : w)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteWire = (wireId: string) => {
    pushHistory({
      ...project,
      wires: project.wires.filter((w) => w.id !== wireId),
      updatedAt: new Date().toISOString(),
    });
    if (selectedWireId === wireId) {
      setSelectedWireId(null);
    }
  };

  const handleDuplicateWire = (wireId: string) => {
    const existing = project.wires.find((w) => w.id === wireId);
    if (!existing) return;

    const nextId = `W${project.wires.length + 1 < 10 ? '0' + (project.wires.length + 1) : project.wires.length + 1}`;
    const duplicated: Wire = {
      ...existing,
      id: nextId,
      name: `${existing.name} (Copy)`,
      points: existing.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
    };

    pushHistory({
      ...project,
      wires: [...project.wires, duplicated],
      updatedAt: new Date().toISOString(),
    });
    setSelectedWireId(duplicated.id);
  };

  // Connector handlers
  const handleAddConnector = (connector: Connector) => {
    pushHistory({
      ...project,
      connectors: [...project.connectors, connector],
      updatedAt: new Date().toISOString(),
    });
    setToolMode('select');
  };

  const handleUpdateConnector = (connector: Connector) => {
    setProject((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c) => (c.id === connector.id ? connector : c)),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Export handlers
  const handleExportPng = async () => {
    if (!svgRef.current) return;
    await exportPlanAsImage(
      svgRef.current,
      project.imageSrc,
      project.imageDimensions.width,
      project.imageDimensions.height,
      project.name,
      project.referenceLine
    );
  };

  const handleExportCsv = () => {
    const csv = generateCutSheetCsv(project);
    downloadFile(csv, `${project.name.toLowerCase().replace(/\s+/g, '_')}_cutsheet.csv`, 'text/csv');
  };

  const selectedWire = project.wires.find((w) => w.id === selectedWireId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        project={project}
        onUpdateProjectName={(name) => setProject((p) => ({ ...p, name }))}
        onUnitChange={handleUnitChange}
        onUploadImage={handleUploadImage}
        onSelectSample={handleSelectSample}
        onOpenCalibration={() =>
          handleTriggerCalibrationModal(
            project.referenceLine.p1,
            project.referenceLine.p2,
            distance(project.referenceLine.p1, project.referenceLine.p2)
          )
        }
        onOpenCutSheet={() => setCutSheetOpen(true)}
        onExportPng={handleExportPng}
        onExportCsv={handleExportCsv}
        onLoadProjectJson={(loaded) => {
          pushHistory(loaded);
          setTimeout(() => handleFitToScreen(), 100);
        }}
      />

      {/* Main CAD Viewport Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Floating Toolbar on Left */}
        <Toolbar
          currentMode={toolMode}
          onSelectMode={(mode) => {
            setToolMode(mode);
            if (mode === 'draw_wire') {
              setIsDrawingWire(true);
            }
          }}
          isDrawingWire={isDrawingWire}
          drawingWirePointsCount={drawingPoints.length}
          onFinishWire={handleFinishDrawingWire}
          onCancelDrawing={handleCancelDrawing}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onFitToScreen={handleFitToScreen}
          isCalibrated={project.referenceLine.calibrated}
        />

        {/* The Interactive Canvas Area */}
        <div className="flex-1 h-full w-full relative">
          <Canvas
            project={project}
            toolMode={toolMode}
            setToolMode={setToolMode}
            transform={transform}
            setTransform={setTransform}
            selectedWireId={selectedWireId}
            onSelectWire={setSelectedWireId}
            onUpdateWire={handleUpdateWire}
            onAddWire={handleAddWire}
            onUpdateReferenceLinePoints={handleUpdateReferenceLinePoints}
            onTriggerCalibrationModal={handleTriggerCalibrationModal}
            onAddConnector={handleAddConnector}
            onUpdateConnector={handleUpdateConnector}
            onUploadImageFile={handleUploadImage}
            bgOpacity={bgOpacity}
            bgInvert={bgInvert}
            showLabels={showLabels}
            showGrid={showGrid}
            showPhoto={showPhoto}
            svgRef={svgRef}
            isDrawingWire={isDrawingWire}
            setIsDrawingWire={setIsDrawingWire}
            drawingPoints={drawingPoints}
            setDrawingPoints={setDrawingPoints}
            finishDrawingWire={handleFinishDrawingWire}
          />
        </div>

        {/* Cable Inspector Sidebar (Right) */}
        {selectedWire && (
          <WirePropertyEditor
            wire={selectedWire}
            connectors={project.connectors}
            refLine={project.referenceLine}
            onUpdate={handleUpdateWire}
            onDelete={handleDeleteWire}
            onDuplicate={handleDuplicateWire}
            onClose={() => setSelectedWireId(null)}
          />
        )}

        {/* View & Display Controls on Bottom Right */}
        <ViewControls
          scale={transform.scale}
          onZoomIn={() =>
            setTransform((t) => ({ ...t, scale: Math.min(t.scale * 1.2, 15) }))
          }
          onZoomOut={() =>
            setTransform((t) => ({ ...t, scale: Math.max(t.scale * 0.8, 0.1) }))
          }
          onResetZoom={() => setTransform((t) => ({ ...t, scale: 1 }))}
          bgOpacity={bgOpacity}
          setBgOpacity={setBgOpacity}
          bgInvert={bgInvert}
          setBgInvert={setBgInvert}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showPhoto={showPhoto}
          setShowPhoto={setShowPhoto}
        />
      </div>

      {/* Calibration Reference Scale Modal */}
      <CalibrationModal
        isOpen={calibModalState.isOpen}
        pixelDistance={calibModalState.pixelDistance}
        initialDistance={project.referenceLine.realDistance}
        initialUnit={project.referenceLine.unit}
        onSave={handleSaveCalibration}
        onCancel={() => setCalibModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Manufacturing Cut Sheet & Bill of Materials Modal */}
      <CutSheetModal
        isOpen={cutSheetOpen}
        project={project}
        onClose={() => setCutSheetOpen(false)}
      />
    </div>
  );
};

export default App;
