import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  HarnessProject,
  ToolMode,
  CanvasTransform,
  Point,
  Unit,
  Wire,
  Connector,
  ReferenceLine,
  LayerFolder,
} from './types/harness';
import { SAMPLE_PROJECTS, type SampleImage } from './utils/sampleImages';
import { distance, convertUnit } from './utils/geometry';
import { exportPlanAsImage, generateCutSheetCsv, downloadFile } from './utils/export';
import { saveCurrentProjectToStorage, loadCurrentProjectFromStorage } from './utils/storage';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { LayerPanel } from './components/LayerPanel';
import { WirePropertyEditor } from './components/WirePropertyEditor';
import { CalibrationModal } from './components/CalibrationModal';
import { CutSheetModal } from './components/CutSheetModal';
import { NewProjectModal } from './components/NewProjectModal';
import { ViewControls } from './components/ViewControls';
import { Layers, Zap, X, Cable } from 'lucide-react';

const FOLDER_COLORS = ['#38bdf8', '#10b981', '#fbbf24', '#a855f7', '#f43f5e', '#f97316'];

// Default initial project with Photoshop-style Folders
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
    visible: true,
  },
  folders: [
    { id: 'f-pwr', name: 'Main Power Feeds', color: '#ef4444', visible: true, locked: false, expanded: true },
    { id: 'f-can', name: 'CAN Bus Data Trunk', color: '#38bdf8', visible: true, locked: false, expanded: true },
    { id: 'f-act', name: 'Actuator PWM Branch', color: '#a855f7', visible: true, locked: false, expanded: true },
  ],
  connectors: [
    { id: 'J1', name: 'J1 - ECU Main', type: '12P Automotive', position: { x: 160, y: 440 }, pinCount: 12, visible: true },
    { id: 'P1', name: 'P1 - Battery / GND', type: 'Power Studs', position: { x: 160, y: 780 }, pinCount: 2, visible: true },
    { id: 'S1', name: 'S1 - Wheel Speed', type: 'DT04-2P', position: { x: 1360, y: 240 }, pinCount: 2, visible: true },
    { id: 'A1', name: 'A1 - Throttle Actuator', type: 'DT06-4S', position: { x: 1360, y: 680 }, pinCount: 4, visible: true },
    { id: 'GW', name: 'GW - J1939 Bus', type: 'Deutsch 3P', position: { x: 860, y: 880 }, pinCount: 3, visible: true },
  ],
  wires: [
    {
      id: 'W01',
      name: '12V Main Feed',
      folderId: 'f-pwr',
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
      bundleGroup: 'Main Power Feeds',
      routingStyle: 'rounded',
      notes: 'Main 25A battery line with protective split loom.',
      visible: true,
    },
    {
      id: 'W02',
      name: 'Chassis Ground 0V',
      folderId: 'f-pwr',
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
      bundleGroup: 'Main Power Feeds',
      routingStyle: 'rounded',
      notes: 'Primary grounding circuit to master stud.',
      visible: true,
    },
    {
      id: 'W03',
      name: 'CAN-High Signal',
      folderId: 'f-can',
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
      bundleGroup: 'CAN Bus Data Trunk',
      routingStyle: 'rounded',
      notes: 'Twisted pair 33 twists/meter with W04.',
      visible: true,
    },
    {
      id: 'W04',
      name: 'CAN-Low Signal',
      folderId: 'f-can',
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
      bundleGroup: 'CAN Bus Data Trunk',
      routingStyle: 'rounded',
      notes: 'CAN Low 500kbps bus line.',
      visible: true,
    },
    {
      id: 'W05',
      name: 'Actuator PWM Drive',
      folderId: 'f-act',
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
      bundleGroup: 'Actuator PWM Branch',
      routingStyle: 'rounded',
      notes: 'High frequency PWM drive wire.',
      visible: true,
    },
  ],
  dimensions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const App: React.FC = () => {
  // Load from localStorage or default
  const [project, setProject] = useState<HarnessProject>(() => {
    const saved = loadCurrentProjectFromStorage();
    if (saved) {
      if (!saved.folders) {
        saved.folders = INITIAL_PROJECT.folders;
      }
      return saved;
    }
    return INITIAL_PROJECT;
  });

  const [history, setHistory] = useState<HarnessProject[]>([]);
  const [future, setFuture] = useState<HarnessProject[]>([]);

  // Active Tool Mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Sidebar: Layers vs Inspector
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'layers' | 'inspector'>('layers');

  // Drawing wire state
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  // Canvas Viewport Transform
  const [transform, setTransform] = useState<CanvasTransform>({ x: 20, y: 20, scale: 0.75 });

  // Modals
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [cutSheetOpen, setCutSheetOpen] = useState(false);
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

  // Display Adjustments
  const [bgOpacity, setBgOpacity] = useState(0.9);
  const [bgInvert, setBgInvert] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);

  // SVG ref for export
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    saveCurrentProjectToStorage(project);
  }, [project]);

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

  // Select wire
  const handleSelectWire = useCallback((wireId: string | null) => {
    setSelectedWireId(wireId);
    if (wireId) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Fit Image or Plan to Screen with accurate margins
  const handleFitToScreen = useCallback(() => {
    const w = project.imageDimensions.width || 1200;
    const h = project.imageDimensions.height || 800;
    const margin = 35;
    const sidebarWidth = isSidebarOpen ? 300 : 0;
    const availW = Math.max(300, window.innerWidth - sidebarWidth - margin * 2 - 50);
    const availH = Math.max(300, window.innerHeight - 48 - margin * 2);

    const scale = Math.min(availW / w, availH / h, 1.2);
    const x = Math.max(margin + 50, (availW - w * scale) / 2 + 50);
    const y = Math.max(margin, (availH - h * scale) / 2 + margin);

    setTransform({ scale, x, y });
  }, [project.imageDimensions, isSidebarOpen]);

  useEffect(() => {
    handleFitToScreen();
  }, []);

  // Keyboard Shortcuts: Ctrl+N (New), Ctrl+O (Open), Ctrl+S (Save), etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setNewModalOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const jsonStr = JSON.stringify(project, null, 2);
        downloadFile(
          jsonStr,
          `${project.name.toLowerCase().replace(/\s+/g, '_')}_project.harness.json`,
          'application/json'
        );
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
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
      } else if (e.key === 'l' || e.key === 'L') {
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWireId) {
        handleDeleteWire(selectedWireId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, project, handleUndo, handleRedo]);

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
      slackAllowance: 15,
      slackPercent: 0,
      routingStyle: 'straight',
      visible: true,
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
            unit: project.referenceLine.unit || 'mm',
            calibrated: false,
            visible: true,
          },
          updatedAt: new Date().toISOString(),
        };
        pushHistory(newProj);
        setToolMode('calibrate');
        setTimeout(() => handleFitToScreen(), 100);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Create Blank Board
  const handleCreateBlankProject = (name: string, unit: Unit, width: number, height: number) => {
    const newProj: HarnessProject = {
      version: '1.0',
      name: name || 'Blank Formboard',
      imageSrc: null,
      imageDimensions: { width, height },
      referenceLine: {
        p1: { x: width * 0.1, y: height * 0.1 },
        p2: { x: width * 0.3, y: height * 0.1 },
        realDistance: 100,
        unit,
        calibrated: false,
        visible: true,
      },
      connectors: [],
      wires: [],
      folders: [],
      dimensions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pushHistory(newProj);
    handleSelectWire(null);
    setToolMode('calibrate');
    setTimeout(() => handleFitToScreen(), 100);
  };

  // Create From Photo
  const handleCreateFromPhoto = (name: string, unit: Unit, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newProj: HarnessProject = {
          version: '1.0',
          name,
          imageSrc: src,
          imageDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          referenceLine: {
            p1: { x: img.naturalWidth * 0.1, y: img.naturalHeight * 0.15 },
            p2: { x: img.naturalWidth * 0.35, y: img.naturalHeight * 0.15 },
            realDistance: 100,
            unit,
            calibrated: false,
            visible: true,
          },
          connectors: [],
          wires: [],
          folders: [],
          dimensions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        pushHistory(newProj);
        handleSelectWire(null);
        setToolMode('calibrate');
        setTimeout(() => handleFitToScreen(), 100);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Create From Sample Template
  const handleCreateFromTemplate = (templateId: string) => {
    const sample = SAMPLE_PROJECTS.find((s) => s.id === templateId) || SAMPLE_PROJECTS[0];
    const isSampleA1 = sample.id === 'formboard-a1';
    const newProj: HarnessProject = {
      version: '1.0',
      name: sample.name,
      imageSrc: sample.dataUrl,
      imageDimensions: { width: sample.width, height: sample.height },
      referenceLine: {
        p1: sample.defaultRef.p1,
        p2: sample.defaultRef.p2,
        realDistance: sample.defaultRef.realDistance,
        unit: sample.defaultRef.unit,
        calibrated: true,
        visible: true,
      },
      folders: isSampleA1 ? INITIAL_PROJECT.folders : [],
      connectors: isSampleA1 ? INITIAL_PROJECT.connectors : [],
      wires: isSampleA1 ? INITIAL_PROJECT.wires : [],
      dimensions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pushHistory(newProj);
    handleSelectWire(null);
    setTimeout(() => handleFitToScreen(), 100);
  };

  // Unit Change Handler
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

  const handleUpdateReferenceLine = (newRef: ReferenceLine) => {
    setProject((prev) => ({
      ...prev,
      referenceLine: newRef,
    }));
  };

  // Folder CRUD handlers
  const handleAddFolder = useCallback((name?: string) => {
    const existing = project.folders || [];
    const num = existing.length + 1;
    const newFolder: LayerFolder = {
      id: `folder-${Date.now()}`,
      name: name || `Cable Group ${num}`,
      color: FOLDER_COLORS[existing.length % FOLDER_COLORS.length],
      visible: true,
      locked: false,
      expanded: true,
    };
    pushHistory({
      ...project,
      folders: [...existing, newFolder],
      updatedAt: new Date().toISOString(),
    });
  }, [project, pushHistory]);

  const handleUpdateFolder = useCallback((updatedFolder: LayerFolder) => {
    setProject((prev) => ({
      ...prev,
      folders: (prev.folders || []).map((f) => (f.id === updatedFolder.id ? updatedFolder : f)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleDeleteFolder = useCallback((folderId: string, deleteChildren = false) => {
    const existing = project.folders || [];
    let updatedWires = project.wires;
    if (deleteChildren) {
      updatedWires = updatedWires.filter((w) => w.folderId !== folderId);
    } else {
      updatedWires = updatedWires.map((w) => (w.folderId === folderId ? { ...w, folderId: undefined } : w));
    }
    pushHistory({
      ...project,
      folders: existing.filter((f) => f.id !== folderId),
      wires: updatedWires,
      updatedAt: new Date().toISOString(),
    });
  }, [project, pushHistory]);

  const handleMoveWireToFolder = useCallback((wireId: string, folderId?: string) => {
    const targetFolder = folderId ? project.folders?.find((f) => f.id === folderId) : undefined;
    pushHistory({
      ...project,
      wires: project.wires.map((w) =>
        w.id === wireId
          ? {
              ...w,
              folderId,
              bundleGroup: targetFolder ? targetFolder.name : w.bundleGroup,
            }
          : w
      ),
      updatedAt: new Date().toISOString(),
    });
  }, [project, pushHistory]);

  // Wire CRUD handlers
  const handleAddWire = (newWire: Wire) => {
    pushHistory({
      ...project,
      wires: [...project.wires, newWire],
      updatedAt: new Date().toISOString(),
    });
    handleSelectWire(newWire.id);
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
      handleSelectWire(null);
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
    handleSelectWire(duplicated.id);
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

  const handleDeleteConnector = (connectorId: string) => {
    pushHistory({
      ...project,
      connectors: project.connectors.filter((c) => c.id !== connectorId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Dimension handlers
  const handleDeleteDimension = (dimId: string) => {
    pushHistory({
      ...project,
      dimensions: project.dimensions.filter((d) => d.id !== dimId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleDimensionVisibility = (dimId: string) => {
    setProject((prev) => ({
      ...prev,
      dimensions: prev.dimensions.map((d) =>
        d.id === dimId ? { ...d, visible: d.visible === false ? true : false } : d
      ),
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
        onSelectSample={(sample) => handleCreateFromTemplate(sample.id)}
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
          // Backward compatibility: automatically synthesize folders from bundleGroup if missing
          let folders = loaded.folders || [];
          let wires = loaded.wires || [];
          if (folders.length === 0 && wires.length > 0) {
            const groupNames = Array.from(new Set(wires.map((w) => w.bundleGroup).filter(Boolean)));
            if (groupNames.length > 0) {
              folders = groupNames.map((name, i) => ({
                id: `folder-${Date.now()}-${i}`,
                name: name as string,
                color: FOLDER_COLORS[i % FOLDER_COLORS.length],
                visible: true,
                locked: false,
                expanded: true,
              }));
              wires = wires.map((w) => {
                const matched = folders.find((f) => f.name === w.bundleGroup);
                return matched ? { ...w, folderId: matched.id } : w;
              });
            }
          }
          pushHistory({
            ...loaded,
            folders,
            wires,
          });
          setTimeout(() => handleFitToScreen(), 100);
        }}
        onOpenNewModal={() => setNewModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sidebarTab={sidebarTab}
        onSetSidebarTab={setSidebarTab}
        hasSelectedWire={!!selectedWire}
      />

      {/* Main CAD Viewport Area */}
      <div className="flex-1 relative flex overflow-hidden min-h-0 min-w-0">
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
        <div className="flex-1 h-full w-full relative min-w-0 overflow-hidden">
          <Canvas
            project={project}
            toolMode={toolMode}
            setToolMode={setToolMode}
            transform={transform}
            setTransform={setTransform}
            selectedWireId={selectedWireId}
            onSelectWire={handleSelectWire}
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

          {/* View & Display Controls on Bottom Right OF CANVAS (never overlaps sidebar!) */}
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

        {/* Photoshop-style Layers & Inspector Dock (Right Sidebar) */}
        {isSidebarOpen && (
          <aside className="w-72 sm:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl overflow-hidden shrink-0 z-20 animate-in slide-in-from-right-4 duration-150">
            {/* Dock Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-2 py-1.5 shrink-0">
              <div className="flex space-x-1">
                <button
                  onClick={() => setSidebarTab('layers')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    sidebarTab === 'layers'
                      ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Layers</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    ({project.wires.length})
                  </span>
                </button>

                <button
                  onClick={() => setSidebarTab('inspector')}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    sidebarTab === 'inspector'
                      ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Inspector</span>
                  {selectedWire && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse Panel"
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dock Body */}
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'layers' ? (
                <LayerPanel
                  project={project}
                  selectedWireId={selectedWireId}
                  onSelectWire={handleSelectWire}
                  onUpdateWire={handleUpdateWire}
                  onDeleteWire={handleDeleteWire}
                  onAddWireClick={() => {
                    setToolMode('draw_wire');
                    setIsDrawingWire(true);
                  }}
                  onUpdateConnector={handleUpdateConnector}
                  onDeleteConnector={handleDeleteConnector}
                  onAddConnectorClick={() => setToolMode('add_connector')}
                  onUpdateReferenceLine={handleUpdateReferenceLine}
                  onOpenCalibration={() =>
                    handleTriggerCalibrationModal(
                      project.referenceLine.p1,
                      project.referenceLine.p2,
                      distance(project.referenceLine.p1, project.referenceLine.p2)
                    )
                  }
                  onDeleteDimension={handleDeleteDimension}
                  onToggleDimensionVisibility={handleToggleDimensionVisibility}
                  showPhoto={showPhoto}
                  setShowPhoto={setShowPhoto}
                  bgOpacity={bgOpacity}
                  setBgOpacity={setBgOpacity}
                  onAddFolder={handleAddFolder}
                  onUpdateFolder={handleUpdateFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveWireToFolder={handleMoveWireToFolder}
                />
              ) : selectedWire ? (
                <WirePropertyEditor
                  wire={selectedWire}
                  connectors={project.connectors}
                  folders={project.folders || []}
                  refLine={project.referenceLine}
                  onUpdate={handleUpdateWire}
                  onDelete={handleDeleteWire}
                  onDuplicate={handleDuplicateWire}
                  onClose={() => handleSelectWire(null)}
                  onAddFolder={handleAddFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-slate-500">
                  <Cable className="w-10 h-10 mb-2 opacity-40 stroke-1" />
                  <p className="font-semibold text-slate-300 text-xs">No Cable Selected</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click any cable on the canvas or in the Layers list to inspect its properties.
                  </p>
                  <button
                    onClick={() => setSidebarTab('layers')}
                    className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition border border-slate-700"
                  >
                    View Layers List
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={newModalOpen}
        hasUnsavedChanges={project.wires.length > 0}
        onClose={() => setNewModalOpen(false)}
        onCreateBlank={handleCreateBlankProject}
        onCreateFromPhoto={handleCreateFromPhoto}
        onCreateFromTemplate={handleCreateFromTemplate}
      />

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
