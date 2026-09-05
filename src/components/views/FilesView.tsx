import React, { useState, useRef, useEffect } from 'react';
import { usePanel } from '../../context/PanelContext';
import { FileItem } from '../../types';
import {
  FolderTree,
  Folder,
  FileCode,
  File,
  Upload,
  RefreshCw,
  Trash2,
  Download,
  Edit3,
  ChevronRight,
  FolderPlus,
  FilePlus,
  X,
  AlertTriangle,
  Save,
  Check,
  Archive,
  FolderArchive,
  CornerUpLeft,
  Move,
  CheckSquare,
  Square,
  PackageOpen,
  ArrowRight,
  Info,
} from 'lucide-react';

export const FilesView: React.FC = () => {
  const {
    files,
    currentDir,
    setCurrentDir,
    fetchFiles,
    isFilesLoading,
    readFile,
    saveFile,
    uploadFile,
    createFolder,
    deleteFile,
    deleteMultipleFiles,
    deleteAllFiles,
    downloadFile,
    unarchiveFile,
    moveItems,
    moveAllToRoot,
  } = usePanel();

  // Modals & States
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  const [editorSuccess, setEditorSuccess] = useState(false);

  // Selection states
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Modals
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Unarchive modal & state
  const [unarchiveItem, setUnarchiveItem] = useState<FileItem | null>(null);
  const [unarchiveDestType, setUnarchiveDestType] = useState<'current' | 'root' | 'folder'>('current');
  const [customUnarchiveFolder, setCustomUnarchiveFolder] = useState('');
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  // Move modal & state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDestination, setMoveDestination] = useState('/');
  const [isMoving, setIsMoving] = useState(false);

  // Move All to Root modal & state
  const [showMoveAllToRootModal, setShowMoveAllToRootModal] = useState(false);
  const [deleteFolderAfterMoveAll, setDeleteFolderAfterMoveAll] = useState(true);
  const [isMovingAll, setIsMovingAll] = useState(false);

  // Upload & Drag-Drop states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear selection on folder change
  useEffect(() => {
    setSelectedPaths(new Set());
  }, [currentDir]);

  // Check if a file is an unarchiveable archive
  const isArchiveFile = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return (
      lower.endsWith('.zip') ||
      lower.endsWith('.tar') ||
      lower.endsWith('.tar.gz') ||
      lower.endsWith('.tgz') ||
      lower.endsWith('.gz')
    );
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) => {
    setStatusNotification({ text, type });
    setTimeout(() => {
      setStatusNotification(null);
    }, duration);
  };

  // Toggle single item selection
  const handleToggleSelect = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Toggle select all items in current folder
  const handleToggleSelectAll = () => {
    if (selectedPaths.size === files.length && files.length > 0) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(files.map((f) => f.path)));
    }
  };

  const isAllSelected = files.length > 0 && selectedPaths.size === files.length;
  const isSomeSelected = selectedPaths.size > 0 && selectedPaths.size < files.length;

  // Open file in editor or enter directory
  const handleItemClick = async (item: FileItem) => {
    if (item.isDirectory) {
      setCurrentDir(item.path);
      fetchFiles(item.path);
      return;
    }

    try {
      const content = await readFile(item.path);
      setEditingFile({
        path: item.path,
        name: item.name,
        content,
      });
    } catch (err: any) {
      showNotification(`Gagal membuka file: ${err.message}`, 'error');
    }
  };

  // Save edited file
  const handleSaveEditedFile = async () => {
    if (!editingFile) return;
    setIsEditorSaving(true);
    try {
      await saveFile(editingFile.path, editingFile.content);
      setEditorSuccess(true);
      setTimeout(() => setEditorSuccess(false), 2000);
    } catch (err: any) {
      showNotification(`Gagal menyimpan file: ${err.message}`, 'error');
    } finally {
      setIsEditorSaving(false);
    }
  };

  // Efficient file reader using DataURL / FileReader to prevent browser freezing
  const readFileAsBase64 = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIndex = result.indexOf(',');
        resolve(commaIndex !== -1 ? result.substring(commaIndex + 1) : result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle file uploads (both drag-drop and picker)
  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadStatus(`Mengunggah ${fileList.length} file...`);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatus(`Mengunggah (${i + 1}/${fileList.length}) ${file.name}...`);

        const isText =
          file.type.startsWith('text/') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.env') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.css');

        if (isText) {
          const text = await file.text();
          await uploadFile(file.name, text, false);
        } else {
          // Fast native base64 without loop
          const base64 = await readFileAsBase64(file);
          await uploadFile(file.name, base64, true);
        }
      }
      setUploadStatus('Upload selesai!');
      showNotification(`Berhasil mengunggah ${fileList.length} file.`, 'success');
      setTimeout(() => setUploadStatus(null), 2500);
    } catch (err: any) {
      showNotification(`Gagal mengunggah: ${err.message}`, 'error');
      setUploadStatus(null);
    }
  };

  // Trigger unarchive modal for an item
  const openUnarchiveModal = (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnarchiveItem(item);
    setUnarchiveDestType('current');
    setCustomUnarchiveFolder('');
  };

  // Execute unarchive action
  const handleExecuteUnarchive = async () => {
    if (!unarchiveItem) return;
    setIsUnarchiving(true);
    try {
      let targetDestination = currentDir;
      if (unarchiveDestType === 'root') {
        targetDestination = '/';
      } else if (unarchiveDestType === 'folder') {
        const cleaned = customUnarchiveFolder.trim();
        targetDestination = cleaned.startsWith('/') ? cleaned : `${currentDir === '/' ? '' : currentDir}/${cleaned}`;
      }

      const res = await unarchiveFile(unarchiveItem.path, targetDestination);
      showNotification(res.message || 'File arsip berhasil diekstrak!', 'success');
      setUnarchiveItem(null);
    } catch (err: any) {
      showNotification(`Ekstraksi gagal: ${err.message}`, 'error');
    } finally {
      setIsUnarchiving(false);
    }
  };

  // Move selected items to Root (/)
  const handleMoveSelectedToRoot = async () => {
    if (selectedPaths.size === 0) return;
    setIsMoving(true);
    try {
      await moveItems(Array.from(selectedPaths), '/');
      showNotification(`Berhasil memindahkan ${selectedPaths.size} item langsung ke root project (/).`, 'success');
      setSelectedPaths(new Set());
    } catch (err: any) {
      showNotification(`Gagal memindahkan item: ${err.message}`, 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // Execute custom move for selected items
  const handleExecuteMoveSelected = async () => {
    if (selectedPaths.size === 0) return;
    setIsMoving(true);
    try {
      await moveItems(Array.from(selectedPaths), moveDestination);
      showNotification(`Berhasil memindahkan ${selectedPaths.size} item ke ${moveDestination}.`, 'success');
      setSelectedPaths(new Set());
      setShowMoveModal(false);
    } catch (err: any) {
      showNotification(`Gagal memindahkan item: ${err.message}`, 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // Move all items from current subfolder directly to root
  const handleExecuteMoveAllToRoot = async () => {
    if (currentDir === '/') return;
    setIsMovingAll(true);
    try {
      const res = await moveAllToRoot(currentDir, deleteFolderAfterMoveAll);
      showNotification(res.message || `Berhasil memindahkan seluruh file ke root! Bot siap dijalankan.`, 'success', 5000);
      setShowMoveAllToRootModal(false);
    } catch (err: any) {
      showNotification(`Gagal memindahkan file ke root: ${err.message}`, 'error');
    } finally {
      setIsMovingAll(false);
    }
  };

  // Confirm batch delete
  const handleConfirmBatchDelete = async () => {
    if (selectedPaths.size === 0) return;
    setIsBatchDeleting(true);
    try {
      await deleteMultipleFiles(Array.from(selectedPaths));
      showNotification(`Berhasil menghapus ${selectedPaths.size} item terpilih.`, 'success');
      setSelectedPaths(new Set());
      setShowBatchDeleteModal(false);
    } catch (err: any) {
      showNotification(`Gagal menghapus item: ${err.message}`, 'error');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Confirm single item delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteFile(itemToDelete.path);
      showNotification(`Berhasil menghapus ${itemToDelete.name}.`, 'success');
      setItemToDelete(null);
    } catch (err: any) {
      showNotification(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  // Confirm Delete All
  const handleConfirmDeleteAll = async () => {
    try {
      await deleteAllFiles();
      showNotification('Seluruh file dalam project root berhasil dikosongkan.', 'success');
      setShowDeleteAllModal(false);
    } catch (err: any) {
      showNotification(`Gagal mengosongkan project: ${err.message}`, 'error');
    }
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderModal(false);
      showNotification('Folder baru berhasil dibuat.', 'success');
    } catch (err: any) {
      showNotification(`Gagal membuat folder: ${err.message}`, 'error');
    }
  };

  // Create new empty file
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    const filePath = currentDir === '/' ? `/${cleanName}` : `${currentDir}/${cleanName}`;
    try {
      await saveFile(filePath, '');
      setNewFileName('');
      setShowNewFileModal(false);
      // Open editor directly
      setEditingFile({
        path: filePath,
        name: cleanName,
        content: '',
      });
    } catch (err: any) {
      showNotification(`Gagal membuat file: ${err.message}`, 'error');
    }
  };

  // Breadcrumbs calculation
  const pathParts = currentDir === '/' ? [] : currentDir.split('/').filter(Boolean);

  return (
    <div
      className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4 relative min-h-[calc(100vh-80px)]"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleUploadFiles(e.dataTransfer.files);
      }}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-4 z-40 bg-rose-950/80 border-2 border-dashed border-rose-500 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
          <Upload className="w-12 h-12 text-rose-400 animate-bounce mb-2" />
          <p className="text-lg font-bold text-slate-100">Drop files here to upload</p>
          <p className="text-xs text-slate-400">File akan disimpan langsung ke folder aktif ({currentDir})</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />

      {/* Notification Banner */}
      {statusNotification && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium animate-fadeIn ${
            statusNotification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : statusNotification.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{statusNotification.text}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Special Banner: When user is inside subfolder, explain that bot runs from Root */}
      {currentDir !== '/' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl p-3.5 px-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs text-amber-200">
            <CornerUpLeft className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Anda sedang berada di subfolder <b className="font-mono text-amber-300">{currentDir}</b>. Agar bot dapat terbaca saat dijalankan di Dashboard, seluruh file bot harus berada di <b>root (/)</b>.
            </span>
          </div>
          <button
            onClick={() => setShowMoveAllToRootModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>Pindahkan Seluruh File ke Root</span>
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f1523] border border-slate-800 rounded-2xl p-4 shadow-md">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono overflow-x-auto py-1">
          <button
            onClick={() => {
              setCurrentDir('/');
              fetchFiles('/');
            }}
            className={`hover:text-rose-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-md ${
              currentDir === '/' ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>root</span>
          </button>
          {pathParts.map((part, index) => {
            const pathUpTo = '/' + pathParts.slice(0, index + 1).join('/');
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={pathUpTo}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <button
                  onClick={() => {
                    setCurrentDir(pathUpTo);
                    fetchFiles(pathUpTo);
                  }}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    isLast ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {uploadStatus && (
            <span className="text-xs text-emerald-400 font-medium animate-pulse px-2">
              {uploadStatus}
            </span>
          )}

          {/* Upload Button */}
          <button
            id="files-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {/* New File Button */}
          <button
            id="files-new-file-btn"
            onClick={() => setShowNewFileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-rose-400" />
            <span>New File</span>
          </button>

          {/* New Folder Button */}
          <button
            id="files-new-folder-btn"
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchFiles(currentDir)}
            disabled={isFilesLoading}
            title="Refresh List"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFilesLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* DELETE ALL Button */}
          <button
            id="files-delete-all-btn"
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer ml-auto sm:ml-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>DELETE ALL</span>
          </button>
        </div>
      </div>

      {/* MULTI-SELECT ACTION BAR (Appears when items are selected) */}
      {selectedPaths.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-950/60 border border-indigo-700/70 rounded-2xl p-3 px-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">{selectedPaths.size}</span> item terpilih
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Move to Root Button */}
            <button
              onClick={handleMoveSelectedToRoot}
              disabled={isMoving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
              <span>Pindahkan ke Root (/)</span>
            </button>

            {/* Move to Folder Button */}
            <button
              onClick={() => {
                setMoveDestination('/');
                setShowMoveModal(true);
              }}
              disabled={isMoving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            >
              <Move className="w-3.5 h-3.5 text-amber-400" />
              <span>Pindahkan ke Folder...</span>
            </button>

            {/* Batch Delete Button */}
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedPaths(new Set())}
              className="px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Files Table / List */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                {/* Master Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua file'}
                    className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center w-full"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                    ) : isSomeSelected ? (
                      <div className="w-4 h-4 rounded border border-rose-400 flex items-center justify-center bg-rose-950/60">
                        <div className="w-2 h-0.5 bg-rose-400" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span>Name</span>
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-normal normal-case border border-slate-800 rounded px-1.5 py-0.5"
                    >
                      {isAllSelected ? 'Deselect Semua' : 'Select Semua'}
                    </button>
                  </div>
                </th>
                <th className="py-3 px-4 w-28">Size</th>
                <th className="py-3 px-4 w-40">Last Modified</th>
                <th className="py-3 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* If in subfolder, show ".." back button */}
              {currentDir !== '/' && (
                <tr
                  onClick={() => {
                    const parent = '/' + pathParts.slice(0, -1).join('/');
                    setCurrentDir(parent);
                    fetchFiles(parent);
                  }}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    <CornerUpLeft className="w-3.5 h-3.5 mx-auto" />
                  </td>
                  <td colSpan={4} className="py-2.5 px-3 text-slate-400 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-slate-300">.. (Kembali ke folder sebelumnya)</span>
                  </td>
                </tr>
              )}

              {files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    Folder ini kosong. Gunakan tombol <b>Upload File</b> atau <b>New File</b> untuk menambahkan skrip bot.
                  </td>
                </tr>
              ) : (
                files.map((item) => {
                  const isSelected = selectedPaths.has(item.path);
                  const isArchive = isArchiveFile(item.name);

                  return (
                    <tr
                      key={item.path}
                      onClick={() => handleItemClick(item)}
                      className={`hover:bg-slate-850/50 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Selection Checkbox Column */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => handleToggleSelect(item.path, e)}
                      >
                        <button
                          type="button"
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* File Name & Icon Column */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 text-left text-slate-200 hover:text-rose-400 transition-colors w-full truncate">
                          {item.isDirectory ? (
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : isArchive ? (
                            <FolderArchive className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : item.name.endsWith('.js') || item.name.endsWith('.ts') ? (
                            <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.isDirectory
                                ? 'font-semibold text-amber-300'
                                : isArchive
                                ? 'font-bold text-emerald-300'
                                : ''
                            }`}
                          >
                            {item.name}
                          </span>
                          {isArchive && (
                            <span className="text-[10px] uppercase font-sans font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded shrink-0">
                              ARCHIVE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {item.isDirectory ? '—' : formatSize(item.size)}
                      </td>

                      {/* Modified Date */}
                      <td className="py-2.5 px-4 text-slate-400 text-[11px] font-sans">
                        {formatDate(item.modified)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* UNARCHIVE BUTTON for Zip / Tar / Gz */}
                          {isArchive && !item.isDirectory && (
                            <button
                              onClick={(e) => openUnarchiveModal(item, e)}
                              title="Unarchive / Ekstrak File Ini"
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-sans text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              <Archive className="w-3 h-3 text-emerald-400" />
                              <span>Ekstrak</span>
                            </button>
                          )}

                          {/* Edit Text File Button */}
                          {!item.isDirectory && !isArchive && (
                            <button
                              onClick={() => handleItemClick(item)}
                              title="Edit File"
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Download Button */}
                          {!item.isDirectory && (
                            <button
                              onClick={() => downloadFile(item.path)}
                              title="Download File"
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Item Button */}
                          <button
                            onClick={() => setItemToDelete(item)}
                            title="Delete"
                            className="p-1.5 rounded-md hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* MODAL 1: Unarchive Modal */}
      {unarchiveItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Unarchive File</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{unarchiveItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setUnarchiveItem(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pilih tujuan ekstraksi untuk arsip <span className="font-mono text-emerald-300 font-bold">{unarchiveItem.name}</span>:
            </p>

            <div className="space-y-2.5 text-xs">
              {/* Option 1: Current Directory */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="unarchiveDest"
                  checked={unarchiveDestType === 'current'}
                  onChange={() => setUnarchiveDestType('current')}
                  className="mt-0.5 text-rose-500 focus:ring-rose-500"
                />
                <div>
                  <span className="font-semibold text-slate-200">Ekstrak di folder saat ini ({currentDir})</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    File akan diekstrak langsung ke folder di mana file arsip ini berada.
                  </p>
                </div>
              </label>

              {/* Option 2: Directly to Root (/) */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-950/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="unarchiveDest"
                  checked={unarchiveDestType === 'root'}
                  onChange={() => setUnarchiveDestType('root')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CornerUpLeft className="w-3.5 h-3.5 text-emerald-400" />
                    Ekstrak langsung ke Root project (/)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sangat disarankan jika arsip berisi file bot utama (seperti index.js & package.json) agar bisa langsung terbaca saat bot dijalankan.
                  </p>
                </div>
              </label>

              {/* Option 3: Custom folder */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="unarchiveDest"
                  checked={unarchiveDestType === 'folder'}
                  onChange={() => setUnarchiveDestType('folder')}
                  className="mt-0.5 text-rose-500 focus:ring-rose-500"
                />
                <div className="flex-1">
                  <span className="font-semibold text-slate-200">Ekstrak ke folder kustom</span>
                  {unarchiveDestType === 'folder' && (
                    <input
                      type="text"
                      value={customUnarchiveFolder}
                      onChange={(e) => setCustomUnarchiveFolder(e.target.value)}
                      placeholder="Nama folder (misal: bot_extracted)"
                      className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUnarchiveItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteUnarchive}
                disabled={isUnarchiving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <PackageOpen className="w-4 h-4" />
                <span>{isUnarchiving ? 'Mengekstrak...' : 'Mulai Ekstrak'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Move Selected Items Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
                <Move className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Pindahkan {selectedPaths.size} Item</h3>
                <p className="text-xs text-slate-400">Pindahkan item terpilih ke folder lain</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Folder Tujuan:</label>
              <input
                type="text"
                value={moveDestination}
                onChange={(e) => setMoveDestination(e.target.value)}
                placeholder="Contoh: / atau /lib atau /src"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMoveDestination('/')}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                >
                  Root (/)
                </button>
                {currentDir !== '/' && (
                  <button
                    type="button"
                    onClick={() => {
                      const parent = '/' + pathParts.slice(0, -1).join('/');
                      setMoveDestination(parent || '/');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Folder Induk (..)
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteMoveSelected}
                disabled={isMoving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Move className="w-3.5 h-3.5" />
                <span>{isMoving ? 'Memindahkan...' : 'Pindahkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Move All to Root Modal */}
      {showMoveAllToRootModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-amber-600/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center">
                <CornerUpLeft className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Pindahkan Seluruh File ke Root?</h3>
                <p className="text-xs text-amber-400 font-mono">{currentDir} → /</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh file dan subfolder di dalam folder <span className="font-mono text-amber-300 font-bold">{currentDir}</span> akan dipindahkan ke <b>root project (/)</b>.
              Hal ini memastikan skrip bot utama (seperti <code className="text-rose-300 font-mono">index.js</code> atau <code className="text-rose-300 font-mono">package.json</code>) dapat langsung terbaca saat bot dijalankan.
            </p>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={deleteFolderAfterMoveAll}
                onChange={(e) => setDeleteFolderAfterMoveAll(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>Hapus folder kosong <span className="font-mono text-amber-300">{currentDir}</span> setelah selesai</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowMoveAllToRootModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteMoveAllToRoot}
                disabled={isMovingAll}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <CornerUpLeft className="w-4 h-4" />
                <span>{isMovingAll ? 'Memindahkan...' : 'Pindahkan Semua ke Root'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-rose-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Hapus {selectedPaths.size} Item Terpilih?</h3>
                <p className="text-xs text-rose-400 font-semibold">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus {selectedPaths.size} file atau folder yang dipilih?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                disabled={isBatchDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                {isBatchDeleting ? 'Menghapus...' : 'Ya, Hapus Semua Terpilih'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Single Item Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus {itemToDelete.isDirectory ? 'folder' : 'file'}{' '}
              <span className="font-mono font-bold text-rose-400">{itemToDelete.name}</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE ALL Confirmation */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border-2 border-rose-600/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Hapus Seluruh File Project?</h3>
                <p className="text-xs text-rose-400 font-semibold">TINDAKAN BERBAHAYA (DELETE ALL)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anda akan <b>mengosongkan seluruh file dan folder</b> di dalam root project bot.
              Semua skrip, node_modules, package.json, dan session akan dihapus permanen dari disk.
            </p>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                id="confirm-delete-all-btn"
                type="button"
                onClick={handleConfirmDeleteAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                KOSONGKAN SELURUH PROJECT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Code Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-rose-400" />
                <span className="font-mono text-xs font-semibold text-slate-200 truncate max-w-md">
                  {editingFile.path}
                </span>
                {editorSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEditedFile}
                  disabled={isEditorSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditorSaving ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 relative bg-slate-950">
              <textarea
                value={editingFile.content}
                onChange={(e) =>
                  setEditingFile((prev) => (prev ? { ...prev, content: e.target.value } : null))
                }
                className="w-full h-full p-4 bg-transparent text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-rose-600/40"
                placeholder="Empty file..."
                spellCheck={false}
              />
            </div>

            {/* Editor Footer */}
            <div className="px-5 py-2 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Lines: {editingFile.content.split('\n').length}</span>
              <span>Characters: {editingFile.content.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                Buat Folder Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Contoh: src atau lib"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
              >
                Buat Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 9: New File Modal */}
      {showNewFileModal && (
        <form
          onSubmit={handleCreateFile}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-rose-400" />
                Buat File Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Contoh: bot.js atau config.json"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-400 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Buat File
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
