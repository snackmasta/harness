import React, { useState } from 'react';
import type {
  HarnessProject,
  Wire,
  Connector,
  ReferenceLine,
  LayerFolder,
} from '../types/harness';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Ruler,
  Cable,
  Cpu,
  ArrowRightLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  FolderInput,
  AlertTriangle,
  X,
} from 'lucide-react';
import { polylineLength, pixelsToReal, formatMeasurement } from '../utils/geometry';

interface LayerPanelProps {
  project: HarnessProject;
  selectedWireId: string | null;
  onSelectWire: (wireId: string | null) => void;
  onUpdateWire: (wire: Wire) => void;
  onDeleteWire: (wireId: string) => void;
  onAddWireClick: () => void;
  onUpdateConnector: (connector: Connector) => void;
  onDeleteConnector: (connectorId: string) => void;
  onAddConnectorClick: () => void;
  onUpdateReferenceLine: (ref: ReferenceLine) => void;
  onOpenCalibration: () => void;
  onDeleteDimension: (dimId: string) => void;
  onToggleDimensionVisibility: (dimId: string) => void;
  showPhoto: boolean;
  setShowPhoto: (val: boolean) => void;
  bgOpacity: number;
  setBgOpacity: (val: number) => void;
  // Folder Actions
  onAddFolder: (name?: string) => void;
  onUpdateFolder: (folder: LayerFolder) => void;
  onDeleteFolder: (folderId: string, deleteChildren?: boolean) => void;
  onMoveWireToFolder: (wireId: string, folderId?: string) => void;
}

const FOLDER_COLORS = ['#38bdf8', '#10b981', '#fbbf24', '#a855f7', '#f43f5e', '#f97316'];

export const LayerPanel: React.FC<LayerPanelProps> = ({
  project,
  selectedWireId,
  onSelectWire,
  onUpdateWire,
  onDeleteWire,
  onAddWireClick,
  onUpdateConnector,
  onDeleteConnector,
  onAddConnectorClick,
  onUpdateReferenceLine,
  onOpenCalibration,
  onDeleteDimension,
  onToggleDimensionVisibility,
  showPhoto,
  setShowPhoto,
  bgOpacity,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveWireToFolder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [connectorsExpanded, setConnectorsExpanded] = useState(true);
  const [dimensionsExpanded, setDimensionsExpanded] = useState(true);

  // Inline rename states
  const [editingWireId, setEditingWireId] = useState<string | null>(null);
  const [editingWireName, setEditingWireName] = useState('');

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Dropdown menus
  const [activeWireMenuId, setActiveWireMenuId] = useState<string | null>(null);
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);

  // Delete folder confirmation modal state
  const [folderToDelete, setFolderToDelete] = useState<LayerFolder | null>(null);

  const ref = project.referenceLine;
  const folders = project.folders || [];

  // Filtered wires
  const filteredWires = project.wires.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.gauge.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered wires by folder
  const wiresByFolder = new Map<string, Wire[]>();
  const ungroupedWires: Wire[] = [];

  filteredWires.forEach((wire) => {
    if (wire.folderId && folders.some((f) => f.id === wire.folderId)) {
      const list = wiresByFolder.get(wire.folderId) || [];
      list.push(wire);
      wiresByFolder.set(wire.folderId, list);
    } else {
      ungroupedWires.push(wire);
    }
  });

  // Calculate folder total cut lengths
  const getFolderLength = (folderId: string): number => {
    const list = project.wires.filter((w) => w.folderId === folderId);
    return list.reduce((acc, w) => {
      const rawPx = polylineLength(w.points);
      const measured = pixelsToReal(rawPx, ref);
      const slack = w.slackAllowance || 0;
      const pct = w.slackPercent || 0;
      return acc + (measured + slack) * (1 + pct / 100);
    }, 0);
  };

  // Toggle all wires visibility
  const allWiresVisible = project.wires.every((w) => w.visible !== false);
  const toggleAllWires = () => {
    const nextState = !allWiresVisible;
    project.wires.forEach((w) => {
      onUpdateWire({ ...w, visible: nextState });
    });
    folders.forEach((f) => {
      onUpdateFolder({ ...f, visible: nextState });
    });
  };

  // Wire inline rename
  const startWireRename = (w: Wire) => {
    setEditingWireId(w.id);
    setEditingWireName(w.name);
  };

  const commitWireRename = (w: Wire) => {
    if (editingWireName.trim()) {
      onUpdateWire({ ...w, name: editingWireName.trim() });
    }
    setEditingWireId(null);
  };

  // Folder inline rename
  const startFolderRename = (f: LayerFolder) => {
    setEditingFolderId(f.id);
    setEditingFolderName(f.name);
  };

  const commitFolderRename = (f: LayerFolder) => {
    if (editingFolderName.trim()) {
      onUpdateFolder({ ...f, name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
  };

  // Render an individual wire row
  const renderWireRow = (wire: Wire, isInsideFolder = false) => {
    const isSelected = selectedWireId === wire.id;
    const isVisible = wire.visible !== false;
    const isLocked = wire.locked === true;

    const rawPx = polylineLength(wire.points);
    const measured = pixelsToReal(rawPx, ref);
    const slack = wire.slackAllowance || 0;
    const pct = wire.slackPercent || 0;
    const totalCut = (measured + slack) * (1 + pct / 100);

    return (
      <div
        key={wire.id}
        onClick={() => onSelectWire(wire.id)}
        className={`group relative flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition ${
          isInsideFolder ? 'ml-4' : ''
        } ${
          isSelected
            ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
            : 'bg-slate-950/40 border-slate-800/70 hover:border-slate-700 text-slate-300'
        }`}
      >
        {/* Left: Eye, Lock, Color Swatch, Title */}
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {/* Eye Visibility Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateWire({ ...wire, visible: !isVisible });
            }}
            title={isVisible ? 'Hide Wire' : 'Show Wire'}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
            )}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateWire({ ...wire, locked: !isLocked });
            }}
            title={isLocked ? 'Unlock Wire' : 'Lock Wire'}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
          >
            {isLocked ? (
              <Lock className="w-3 h-3 text-amber-400" />
            ) : (
              <Unlock className="w-3 h-3 opacity-30 group-hover:opacity-100 text-slate-500" />
            )}
          </button>

          {/* Color Swatch */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
            style={{
              background: wire.color.stripe
                ? `repeating-linear-gradient(45deg, ${wire.color.primary}, ${wire.color.primary} 3px, ${wire.color.stripe} 3px, ${wire.color.stripe} 6px)`
                : wire.color.primary,
            }}
          />

          {/* Wire ID & Name */}
          <div className="min-w-0 flex-1">
            {editingWireId === wire.id ? (
              <input
                type="text"
                autoFocus
                value={editingWireName}
                onChange={(e) => setEditingWireName(e.target.value)}
                onBlur={() => commitWireRename(wire)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitWireRename(wire);
                  if (e.key === 'Escape') setEditingWireId(null);
                }}
                className="w-full bg-slate-900 border border-sky-400 rounded px-1 text-xs text-white"
              />
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startWireRename(wire);
                }}
                className="truncate font-medium text-xs flex items-baseline space-x-1"
              >
                <span className="font-mono text-sky-400 font-bold shrink-0">
                  {wire.id}
                </span>
                <span className={`truncate ${!isVisible ? 'text-slate-600 line-through' : ''}`}>
                  {wire.name}
                </span>
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-mono block">
              {wire.gauge} &bull; {wire.points.length} pts
            </span>
          </div>
        </div>

        {/* Right: Length Badge, Folder Move, Delete */}
        <div className="flex items-center space-x-1 shrink-0 pl-1">
          <span className="font-mono text-[11px] font-bold text-emerald-400">
            {formatMeasurement(totalCut, ref.unit)}
          </span>

          {/* Move to Folder Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveWireMenuId(activeWireMenuId === wire.id ? null : wire.id);
              }}
              title="Move wire to a folder group"
              className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition opacity-0 group-hover:opacity-100"
            >
              <FolderInput className="w-3.5 h-3.5" />
            </button>

            {activeWireMenuId === wire.id && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWireMenuId(null);
                  }}
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 text-xs animate-in fade-in"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Move to Folder
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveWireToFolder(wire.id, undefined);
                      setActiveWireMenuId(null);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition flex items-center space-x-1.5 ${
                      !wire.folderId ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>(Ungrouped / Root)</span>
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveWireToFolder(wire.id, f.id);
                        setActiveWireMenuId(null);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition flex items-center space-x-1.5 ${
                        wire.folderId === f.id ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Folder className="w-3 h-3 shrink-0" style={{ color: f.color }} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete Wire */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteWire(wire.id);
            }}
            title="Delete Wire"
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none overflow-hidden text-xs">
      {/* Header */}
      <div className="p-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-slate-100 text-xs">Photoshop Layers</h3>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
            {project.wires.length + project.connectors.length + folders.length + 2}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* New Folder Quick Action */}
          <button
            onClick={() => onAddFolder()}
            title="Create New Folder Group"
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 transition text-[11px] font-medium border border-slate-700"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          {/* Toggle All Wires Visibility */}
          <button
            onClick={toggleAllWires}
            title={allWiresVisible ? 'Hide all wires' : 'Show all wires'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {allWiresVisible ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search layers and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Layer List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
        {/* 1. BACKGROUND PHOTO LAYER */}
        <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 hover:border-slate-700 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <button
                onClick={() => setShowPhoto(!showPhoto)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
                title={showPhoto ? 'Hide Background Photo' : 'Show Background Photo'}
              >
                {showPhoto ? (
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {project.imageSrc ? (
                  <img src={project.imageSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-slate-500" />
                )}
              </div>

              <div className="min-w-0">
                <span
                  className={`font-semibold text-xs truncate block ${
                    showPhoto ? 'text-slate-200' : 'text-slate-500 line-through'
                  }`}
                >
                  Background Blueprint
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {project.imageDimensions.width}&times;{project.imageDimensions.height}px
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {Math.round(bgOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* 2. SCALE CALIBRATION LAYER */}
        <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/80 hover:border-slate-700 transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <button
                onClick={() =>
                  onUpdateReferenceLine({
                    ...ref,
                    visible: ref.visible === false ? true : false,
                  })
                }
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition shrink-0"
                title={ref.visible !== false ? 'Hide Scale Reference' : 'Show Scale Reference'}
              >
                {ref.visible !== false ? (
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Ruler className="w-3 h-3 text-amber-400" />
              </div>

              <div
                className="min-w-0 cursor-pointer"
                onClick={onOpenCalibration}
                title="Click to calibrate scale"
              >
                <span
                  className={`font-semibold text-xs truncate block ${
                    ref.visible !== false ? 'text-amber-300' : 'text-slate-500 line-through'
                  }`}
                >
                  Reference Scale Line
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {ref.calibrated ? `${ref.realDistance} ${ref.unit}` : 'Uncalibrated'}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenCalibration}
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition font-mono border border-slate-700 shrink-0"
            >
              Calibrate
            </button>
          </div>
        </div>

        {/* 3. CABLE HARNESS FOLDERS & GROUPS */}
        <div className="pt-2 space-y-1.5">
          <div className="flex items-center justify-between px-1 text-slate-300 font-bold text-xs uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Cable className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cable Groups ({project.wires.length})</span>
            </div>
            <button
              onClick={() => onAddFolder()}
              title="Add New Cable Folder"
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition text-[11px]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Folder</span>
            </button>
          </div>

          {/* RENDER EACH FOLDER (Photoshop Layer Group) */}
          {folders.map((folder, folderIdx) => {
            const folderWires = wiresByFolder.get(folder.id) || [];
            const isFolderExpanded = folder.expanded !== false;
            const isFolderVisible = folder.visible !== false;
            const isFolderLocked = folder.locked === true;
            const folderCutLength = getFolderLength(folder.id);
            const isNearBottom = folderIdx >= folders.length - 2 && folders.length > 2;

            return (
              <div
                key={folder.id}
                className="bg-slate-950/60 rounded-xl border border-slate-800/90 shadow-sm transition"
              >
                {/* Folder Header Row */}
                <div
                  className={`p-2 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between transition group ${
                    isFolderExpanded ? 'rounded-t-xl' : 'rounded-xl'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    {/* Expand/Collapse Chevron */}
                    <button
                      onClick={() =>
                        onUpdateFolder({ ...folder, expanded: !isFolderExpanded })
                      }
                      className="p-0.5 text-slate-400 hover:text-slate-100 transition shrink-0"
                    >
                      {isFolderExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Eye Visibility Toggle for whole folder */}
                    <button
                      onClick={() =>
                        onUpdateFolder({ ...folder, visible: !isFolderVisible })
                      }
                      title={isFolderVisible ? 'Hide all wires in folder' : 'Show folder'}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
                    >
                      {isFolderVisible ? (
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>

                    {/* Lock Toggle for whole folder */}
                    <button
                      onClick={() =>
                        onUpdateFolder({ ...folder, locked: !isFolderLocked })
                      }
                      title={isFolderLocked ? 'Unlock folder' : 'Lock folder'}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
                    >
                      {isFolderLocked ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Unlock className="w-3 h-3 opacity-30 group-hover:opacity-100 text-slate-500" />
                      )}
                    </button>

                    {/* Folder Icon with Color accent */}
                    {isFolderExpanded ? (
                      <FolderOpen
                        className="w-4 h-4 shrink-0 transition"
                        style={{ color: folder.color || '#38bdf8' }}
                      />
                    ) : (
                      <Folder
                        className="w-4 h-4 shrink-0 transition"
                        style={{ color: folder.color || '#38bdf8' }}
                      />
                    )}

                    {/* Folder Name (double click to edit) */}
                    <div className="min-w-0 flex-1">
                      {editingFolderId === folder.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onBlur={() => commitFolderRename(folder)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitFolderRename(folder);
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                          className="w-full bg-slate-950 border border-sky-400 rounded px-1.5 py-0.5 text-xs text-white"
                        />
                      ) : (
                        <div
                          onDoubleClick={() => startFolderRename(folder)}
                          className="font-bold text-xs text-slate-200 truncate cursor-pointer hover:text-sky-300"
                          title="Double-click to rename folder"
                        >
                          {folder.name}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {folderWires.length} {folderWires.length === 1 ? 'wire' : 'wires'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Folder Total Length, Delete Button, and Menu */}
                  <div className="flex items-center space-x-1 shrink-0 pl-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-400">
                      {formatMeasurement(folderCutLength, ref.unit)}
                    </span>

                    {/* Direct Delete Folder Button (Always accessible) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFolderToDelete(folder);
                      }}
                      title="Delete Folder"
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Folder Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFolderMenuId(
                            activeFolderMenuId === folder.id ? null : folder.id
                          );
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                        title="Folder Settings"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeFolderMenuId === folder.id && (
                        <>
                          {/* Invisible backdrop to close on outside click */}
                          <div
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFolderMenuId(null);
                            }}
                          />
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-0 ${
                              isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                            } w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 text-xs animate-in fade-in`}
                          >
                            <button
                              onClick={() => {
                                startFolderRename(folder);
                                setActiveFolderMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 transition font-medium"
                            >
                              Rename Folder
                            </button>

                            {/* Color accents */}
                            <div className="px-2 py-1.5 border-t border-slate-800 mt-1">
                              <span className="text-[10px] text-slate-400 block mb-1">
                                Folder Color
                              </span>
                              <div className="flex space-x-1.5">
                                {FOLDER_COLORS.map((col) => (
                                  <button
                                    key={col}
                                    onClick={() => {
                                      onUpdateFolder({ ...folder, color: col });
                                      setActiveFolderMenuId(null);
                                    }}
                                    className="w-5 h-5 rounded-full border border-white/20 transition hover:scale-110"
                                    style={{ backgroundColor: col }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="h-[1px] bg-slate-800 my-1" />

                            <button
                              onClick={() => {
                                setFolderToDelete(folder);
                                setActiveFolderMenuId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-red-500/20 text-red-400 transition font-medium flex items-center space-x-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Folder...</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Folder Children Wires */}
                {isFolderExpanded && (
                  <div className="p-1 space-y-1 bg-slate-950/30 rounded-b-xl border-t border-slate-800/60">
                    {folderWires.length === 0 ? (
                      <div className="py-2 px-4 text-center text-slate-500 text-[10px] italic">
                        Empty folder. Move cables here using the folder icon.
                      </div>
                    ) : (
                      folderWires.map((wire) => renderWireRow(wire, true))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* UNGROUPED WIRES SECTION */}
          {ungroupedWires.length > 0 && (
            <div className="space-y-1 pt-1">
              {folders.length > 0 && (
                <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ungrouped Cables ({ungroupedWires.length})
                </div>
              )}
              {ungroupedWires.map((wire) => renderWireRow(wire, false))}
            </div>
          )}
        </div>

        {/* 4. CONNECTORS GROUP */}
        <div className="pt-2">
          <div
            className="flex items-center justify-between py-1 px-1 cursor-pointer hover:bg-slate-800/40 rounded transition"
            onClick={() => setConnectorsExpanded(!connectorsExpanded)}
          >
            <div className="flex items-center space-x-1.5 text-slate-300">
              {connectorsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Connectors ({project.connectors.length})
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddConnectorClick();
              }}
              title="Add New Connector"
              className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {connectorsExpanded && (
            <div className="space-y-1 mt-1 pl-1">
              {project.connectors.length === 0 ? (
                <div className="p-2 text-center text-slate-500 text-[11px]">
                  No connectors added.
                </div>
              ) : (
                project.connectors.map((conn) => {
                  const isVisible = conn.visible !== false;
                  const isLocked = conn.locked === true;

                  return (
                    <div
                      key={conn.id}
                      className="group flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800/70 hover:border-slate-700 text-slate-300 transition"
                    >
                      <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                        <button
                          onClick={() =>
                            onUpdateConnector({ ...conn, visible: !isVisible })
                          }
                          title={isVisible ? 'Hide Connector' : 'Show Connector'}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
                        >
                          {isVisible ? (
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            onUpdateConnector({ ...conn, locked: !isLocked })
                          }
                          title={isLocked ? 'Unlock Connector' : 'Lock Connector'}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition shrink-0"
                        >
                          {isLocked ? (
                            <Lock className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Unlock className="w-3 h-3 opacity-30 group-hover:opacity-100 text-slate-500" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <span
                            className={`font-semibold text-xs truncate block ${
                              isVisible ? 'text-slate-200' : 'text-slate-600 line-through'
                            }`}
                          >
                            {conn.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {conn.type} &bull; {conn.pinCount} pins
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteConnector(conn.id)}
                        title="Delete Connector"
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 5. QUICK DIMENSIONS GROUP */}
        {project.dimensions.length > 0 && (
          <div className="pt-2">
            <div
              className="flex items-center justify-between py-1 px-1 cursor-pointer hover:bg-slate-800/40 rounded transition"
              onClick={() => setDimensionsExpanded(!dimensionsExpanded)}
            >
              <div className="flex items-center space-x-1.5 text-slate-300">
                {dimensionsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Dimensions ({project.dimensions.length})
                </span>
              </div>
            </div>

            {dimensionsExpanded && (
              <div className="space-y-1 mt-1 pl-1">
                {project.dimensions.map((dim) => {
                  const isVisible = dim.visible !== false;
                  return (
                    <div
                      key={dim.id}
                      className="group flex items-center justify-between p-1.5 rounded-lg border bg-slate-950/40 border-slate-800/70 text-slate-300 text-xs"
                    >
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onToggleDimensionVisibility(dim.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>
                        <span className="font-mono text-slate-300">
                          {dim.id}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteDimension(dim.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Strip */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 space-x-1.5">
        <button
          onClick={() => onAddFolder()}
          className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs transition border border-slate-700/80"
          title="Create New Folder Group"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Folder</span>
        </button>
        <button
          onClick={onAddWireClick}
          className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs transition border border-slate-700/80"
          title="Draw New Cable"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Wire</span>
        </button>
        <button
          onClick={onAddConnectorClick}
          className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs transition border border-slate-700/80"
          title="Place New Connector"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Conn</span>
        </button>
      </div>

      {/* Dedicated Delete Folder Confirmation Modal */}
      {folderToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setFolderToDelete(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100 text-sm">Delete Folder</h3>
                  <button
                    onClick={() => setFolderToDelete(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Are you sure you want to delete folder{' '}
                  <span className="font-semibold text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
                    {folderToDelete.name}
                  </span>
                  ?
                </p>
                {(() => {
                  const count = project.wires.filter(
                    (w) => w.folderId === folderToDelete.id
                  ).length;
                  if (count > 0) {
                    return (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        This folder contains{' '}
                        <span className="font-bold">
                          {count} {count === 1 ? 'cable' : 'cables'}
                        </span>
                        . What would you like to do?
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-slate-400 mt-2">
                      This folder is empty and safe to delete.
                    </p>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-800">
              {project.wires.some((w) => w.folderId === folderToDelete.id) ? (
                <>
                  <button
                    onClick={() => {
                      onDeleteFolder(folderToDelete.id, false);
                      setFolderToDelete(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-sky-300 transition">
                        Ungroup Cables (Keep all wires)
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Delete folder only, wires become ungrouped
                      </div>
                    </div>
                    <span className="text-[10px] text-sky-400 font-mono font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      Keep
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onDeleteFolder(folderToDelete.id, true);
                      setFolderToDelete(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold transition border border-red-500/30 text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-red-200 group-hover:text-red-100 transition">
                        Delete Folder &amp; All Cables
                      </div>
                      <div className="text-[10px] text-red-300/70 font-normal">
                        Permanently remove folder and all its cables
                      </div>
                    </div>
                    <span className="text-[10px] text-red-400 font-mono font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                      Delete All
                    </span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onDeleteFolder(folderToDelete.id, false);
                    setFolderToDelete(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Empty Folder</span>
                </button>
              )}

              <button
                onClick={() => setFolderToDelete(null)}
                className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition border border-slate-700/60 text-center font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
