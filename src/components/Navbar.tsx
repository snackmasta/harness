import React, { useRef, useState, useEffect } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Upload,
  Image as ImageIcon,
  Ruler,
  FileSpreadsheet,
  Download,
  FileDown,
  ChevronDown,
  History,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Layers,
} from 'lucide-react';
import type { Unit, HarnessProject } from '../types/harness';
import { SAMPLE_PROJECTS, type SampleImage } from '../utils/sampleImages';
import { downloadFile } from '../utils/export';
import { getRecentProjects, type RecentProjectItem } from '../utils/storage';

interface NavbarProps {
  project: HarnessProject;
  onUpdateProjectName: (name: string) => void;
  onUnitChange: (unit: Unit) => void;
  onUploadImage: (file: File) => void;
  onSelectSample: (sample: SampleImage) => void;
  onOpenCalibration: () => void;
  onOpenCutSheet: () => void;
  onExportPng: () => void;
  onExportCsv: () => void;
  onLoadProjectJson: (loaded: HarnessProject) => void;
  onOpenNewModal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarTab: 'layers' | 'inspector';
  onSetSidebarTab: (tab: 'layers' | 'inspector') => void;
  hasSelectedWire: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onUpdateProjectName,
  onUnitChange,
  onUploadImage,
  onSelectSample,
  onOpenCalibration,
  onOpenCutSheet,
  onExportPng,
  onExportCsv,
  onLoadProjectJson,
  onOpenNewModal,
  isSidebarOpen,
  onToggleSidebar,
  sidebarTab,
  onSetSidebarTab,
  hasSelectedWire,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProjectItem[]>([]);

  const ref = project.referenceLine;

  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, [project]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.wires && parsed.referenceLine) {
            onLoadProjectJson(parsed);
          } else {
            alert('Invalid harness project file. Missing wire routes or scale data.');
          }
        } catch (err) {
          alert('Failed to parse project JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    downloadFile(
      jsonStr,
      `${project.name.toLowerCase().replace(/\s+/g, '_')}_project.harness.json`,
      'application/json'
    );
  };

  const handleLoadRecent = (item: RecentProjectItem) => {
    try {
      const parsed = JSON.parse(item.projectJson);
      if (parsed) {
        onLoadProjectJson(parsed);
        setShowFileMenu(false);
      }
    } catch (e) {
      alert('Unable to load recent project.');
    }
  };

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 px-2 sm:px-3 flex items-center justify-between z-30 select-none shrink-0 gap-2">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,.harness.json"
        onChange={handleJsonUpload}
        className="hidden"
      />

      {/* LEFT SECTION: Brand, File Menu, Quick Actions, Project Name */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0">
        {/* Brand Icon & Name */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h16" />
              <path d="M4 14h16" />
              <path d="M4 8h16" />
              <circle cx="8" cy="8" r="2" fill="#ef4444" stroke="none" />
              <circle cx="16" cy="14" r="2" fill="#10b981" stroke="none" />
              <circle cx="12" cy="20" r="2" fill="#f59e0b" stroke="none" />
            </svg>
          </div>
          <span className="text-xs font-bold tracking-tight text-white hidden md:inline">
            HarnessScale
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        {/* CAD File Menu */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-semibold text-slate-200 hover:bg-slate-800 transition border border-slate-700/80"
          >
            <span>File</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFileMenu && (
            <div
              className="absolute left-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 space-y-0.5"
              onMouseLeave={() => setShowFileMenu(false)}
            >
              <button
                onClick={() => {
                  onOpenNewModal();
                  setShowFileMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <div className="flex items-center space-x-2">
                  <FilePlus className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-medium">New Plan...</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+N</span>
              </button>

              <button
                onClick={() => {
                  jsonInputRef.current?.click();
                  setShowFileMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">Open Project (.json)...</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+O</span>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowFileMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Open / Upload Photo...</span>
              </button>

              <button
                onClick={() => {
                  handleSaveJson();
                  setShowFileMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <div className="flex items-center space-x-2">
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Save Project (.json)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+S</span>
              </button>

              {/* Recent Projects Submenu */}
              {recentProjects.length > 0 && (
                <>
                  <div className="h-[1px] bg-slate-800 my-1" />
                  <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Recent Projects</span>
                  </div>
                  {recentProjects.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleLoadRecent(rec)}
                      className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-slate-800 transition flex items-center justify-between group"
                    >
                      <span className="text-slate-300 group-hover:text-sky-300 truncate max-w-[130px]">
                        {rec.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {rec.wireCount}w
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Compact Quick Action Icons */}
        <button
          onClick={onOpenNewModal}
          title="New Project (Ctrl+N)"
          className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
        >
          <FilePlus className="w-3.5 h-3.5 text-sky-400" />
        </button>
        <button
          onClick={() => jsonInputRef.current?.click()}
          title="Open / Load File (Ctrl+O)"
          className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
        </button>
        <button
          onClick={handleSaveJson}
          title="Save Project (Ctrl+S)"
          className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
        >
          <Save className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Project Name editable */}
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdateProjectName(e.target.value)}
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-950 border border-transparent focus:border-slate-700 rounded px-1.5 py-0.5 text-xs font-medium text-slate-200 focus:outline-none transition w-28 sm:w-40 truncate"
          placeholder="Harness Plan Name"
        />
      </div>

      {/* CENTER SECTION: Unified Calibration & Unit Pill */}
      <div className="flex items-center shrink-0">
        <div
          className={`flex items-center rounded-lg border text-xs overflow-hidden ${
            ref.calibrated
              ? 'bg-slate-950/80 border-slate-700'
              : 'bg-amber-500/10 border-amber-500/40 animate-pulse'
          }`}
        >
          {/* Scale Trigger Button */}
          <button
            onClick={onOpenCalibration}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium transition ${
              ref.calibrated
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'text-amber-300 hover:bg-amber-500/20 font-semibold'
            }`}
            title="Click to calibrate reference scale distance"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="font-mono">
              {ref.calibrated ? `${ref.realDistance}` : 'Set Scale'}
            </span>
          </button>

          {/* Unit Dropdown Selector */}
          <div className="border-l border-slate-800 bg-slate-900/90 px-1 py-0.5">
            <select
              value={ref.unit}
              onChange={(e) => onUnitChange(e.target.value as Unit)}
              className="bg-transparent text-slate-300 text-xs font-mono font-semibold focus:outline-none cursor-pointer pr-1"
              title="Change measurement units"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Upload Photo, Templates, Cut Sheet, Export, Sidebar Toggle */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        {/* Upload Photo Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          title="Upload or change background photo/blueprint"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Photo</span>
        </button>

        {/* Sample Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Choose demo template boards"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Templates</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {showSamplesMenu && (
            <div
              className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowSamplesMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Sample Formboards
              </div>
              {SAMPLE_PROJECTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition flex flex-col group"
                >
                  <span className="font-semibold text-slate-200 group-hover:text-sky-300">
                    {sample.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cut Sheet / BOM Modal Button */}
        <button
          onClick={onOpenCutSheet}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          title="Open Harness Cut Sheet & BOM Schedule"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Cut Sheet</span>
          <span className="px-1 py-0.2 rounded-full bg-emerald-950/70 text-emerald-200 text-[10px] font-mono">
            {project.wires.length}
          </span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm"
            title="Export Plan Image or Cut Sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-2.5 h-2.5 text-sky-200" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 space-y-0.5"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  onExportPng();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <FileDown className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-medium block">Export Image (PNG)</span>
                  <span className="text-[10px] text-slate-400">High-res plan with title block</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportCsv();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium block">Export BOM (CSV)</span>
                  <span className="text-[10px] text-slate-400">Cut lengths, gauges, colors</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Layers Panel Toggle Button */}
        <button
          onClick={() => {
            if (!isSidebarOpen) {
              onToggleSidebar();
              onSetSidebarTab('layers');
            } else if (sidebarTab !== 'layers') {
              onSetSidebarTab('layers');
            } else {
              onToggleSidebar();
            }
          }}
          title={isSidebarOpen && sidebarTab === 'layers' ? 'Hide Layers List' : 'Show Photoshop-style Layer List'}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
            isSidebarOpen && sidebarTab === 'layers'
              ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Layers</span>
          <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${
            isSidebarOpen && sidebarTab === 'layers'
              ? 'bg-slate-950/40 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400'
          }`}>
            {project.wires.length + project.connectors.length}
          </span>
        </button>

        {/* Inspector Sidebar Toggle Button (if wire selected) */}
        {hasSelectedWire && (
          <button
            onClick={() => {
              if (!isSidebarOpen) {
                onToggleSidebar();
                onSetSidebarTab('inspector');
              } else if (sidebarTab !== 'inspector') {
                onSetSidebarTab('inspector');
              } else {
                onToggleSidebar();
              }
            }}
            title={isSidebarOpen && sidebarTab === 'inspector' ? 'Hide Wire Inspector' : 'Show Wire Inspector'}
            className={`p-1.5 rounded-md transition border ${
              isSidebarOpen && sidebarTab === 'inspector'
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700/60'
            }`}
          >
            {isSidebarOpen && sidebarTab === 'inspector' ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
