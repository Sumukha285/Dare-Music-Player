import React, { useState } from "react";
import { Track, Playlist, ThemeConfig } from "../types";
import { 
  Folder, 
  FolderPlus, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  Music, 
  Check, 
  X, 
  ChevronDown,
  ListMusic
} from "lucide-react";

interface PlaylistManagerProps {
  tracks: Track[];
  playlists: Playlist[];
  activePlaylistId: string;
  activeTrackId: string;
  isPlaying: boolean;
  theme: ThemeConfig;
  onSelectPlaylist: (id: string) => void;
  onSelectTrack: (trackId: string) => void;
  onCreatePlaylist: (name: string) => void;
  onRenamePlaylist: (id: string, name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onAddTrackToPlaylist: (playlistId: string, trackId: string) => void;
  onReorderTrack: (playlistId: string, trackId: string, direction: "up" | "down") => void;
}

export default function PlaylistManager({
  tracks,
  playlists,
  activePlaylistId,
  activeTrackId,
  isPlaying,
  theme,
  onSelectPlaylist,
  onSelectTrack,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onAddTrackToPlaylist,
  onReorderTrack
}: PlaylistManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];
  
  // Get tracks for active playlist
  const playlistTracks = activePlaylist.trackIds
    .map(id => tracks.find(t => t.id === id))
    .filter((t): t is Track => !!t);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      onRenamePlaylist(id, editingName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col space-y-4" id="playlist-manager-panel">
      
      {/* Playlists Selection Header & Section */}
      <div className="flex flex-col space-y-2.5" id="playlists-header-section">
        <div className="flex items-center justify-between" id="playlists-title-row">
          <div className="flex items-center space-x-2" id="playlists-label">
            <Folder className="w-4 h-4" style={{ color: theme.accentHex }} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              My Playlists
            </h3>
          </div>
          
          {!isCreating && (
            <button
              onClick={() => {
                setIsCreating(true);
                setNewPlaylistName("");
              }}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1 transition-all"
              style={{ color: theme.accentHex }}
              id="new-playlist-btn"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {/* Create Playlist Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="flex items-center gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5" id="create-playlist-form">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name..."
              autoFocus
              className="flex-1 bg-transparent border-0 text-xs text-white px-2.5 py-1 focus:ring-0 outline-none placeholder:text-slate-500 font-medium"
              id="new-playlist-input"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer transition-all"
              id="submit-new-playlist"
            >
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer transition-all"
              id="cancel-new-playlist"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Playlists Pills Grid */}
        <div className="grid grid-cols-2 gap-2" id="playlists-grid">
          {playlists.map((pl) => {
            const isSelected = pl.id === activePlaylistId;
            const isEditing = editingId === pl.id;

            return (
              <div
                key={pl.id}
                id={`playlist-pill-${pl.id}`}
                className={`flex flex-col p-2.5 rounded-2xl border transition-all duration-300 relative group select-none ${
                  isSelected
                    ? "bg-white/[0.06] shadow-sm font-semibold text-white"
                    : "bg-black/10 hover:bg-white/5 border-transparent text-slate-400"
                }`}
                style={{
                  borderColor: isSelected ? `${theme.accentHex}40` : "transparent"
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full" id={`rename-form-${pl.id}`}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(pl.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRenameSubmit(pl.id)}
                      className="text-emerald-400 p-0.5 hover:text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-rose-400 p-0.5 hover:text-rose-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full" id={`playlist-display-${pl.id}`}>
                    <div 
                      onClick={() => {
                        onSelectPlaylist(pl.id);
                        setActiveMenuTrackId(null);
                      }}
                      className="flex flex-col text-left min-w-0 flex-1 cursor-pointer"
                      id={`playlist-click-${pl.id}`}
                    >
                      <span className="text-xs font-semibold truncate tracking-tight pr-1">
                        {pl.name}
                      </span>
                      <span className="text-[9px] font-mono opacity-55 mt-0.5">
                        {pl.trackIds.length} {pl.trackIds.length === 1 ? "track" : "tracks"}
                      </span>
                    </div>

                    {/* Edit / Delete actions for custom playlists */}
                    {pl.isEditable !== false && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-1 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingId(pl.id);
                            setEditingName(pl.name);
                          }}
                          className="text-slate-400 hover:text-white transition-all p-0.5"
                          title="Rename playlist"
                          id={`rename-btn-${pl.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlaylist(pl.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-all p-0.5"
                          title="Delete playlist"
                          id={`delete-btn-${pl.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracks in Selected Playlist Header */}
      <div className="flex flex-col space-y-2 pt-2 border-t border-white/5" id="tracks-section">
        <div className="flex items-center justify-between" id="tracks-header">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-4 h-4" style={{ color: theme.accentHex }} />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tracks inside: <span className="text-white normal-case">{activePlaylist.name}</span>
            </h4>
          </div>
          <span className="text-[9px] font-mono text-slate-500">
            {playlistTracks.length} SONGS
          </span>
        </div>

        {/* Empty state */}
        {playlistTracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-black/10 rounded-2xl border border-white/5" id="playlist-empty-state">
            <Music className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-xs text-slate-400 font-medium">This playlist is currently empty</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
              Select the "All Library Tracks" playlist and click the <strong className="text-slate-400 font-semibold">+</strong> button to add some tunes!
            </p>
          </div>
        )}

        {/* Tracks List */}
        {playlistTracks.length > 0 && (
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin" id="playlist-tracks-container">
            {playlistTracks.map((track, idx) => {
              const isActive = track.id === activeTrackId;
              const hasPrev = idx > 0;
              const hasNext = idx < playlistTracks.length - 1;

              return (
                <div
                  key={`${track.id}-${idx}`}
                  id={`track-item-${track.id}-${idx}`}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-300 relative group ${
                    isActive 
                      ? "bg-white/[0.04] border-white/10 shadow-sm" 
                      : "hover:bg-white/5 bg-transparent border-transparent"
                  }`}
                >
                  <div 
                    onClick={() => onSelectTrack(track.id)}
                    className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
                    id={`track-meta-click-${track.id}-${idx}`}
                  >
                    <div className="w-7.5 h-7.5 rounded-lg bg-black/25 flex items-center justify-center shrink-0 overflow-hidden relative">
                      <img src={track.coverUrl} alt="Cover" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      {isActive && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center" id="wave-pulse">
                          <div className="w-1 h-2 bg-white mx-0.5 animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-1 h-3 bg-white mx-0.5 animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 h-2.5 bg-white mx-0.5 animate-bounce" style={{ animationDelay: "0.3s" }} />
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0" id={`track-text-${track.id}`}>
                      <h4 className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-slate-200"}`}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center space-x-2 pl-2" id={`track-actions-${track.id}`}>
                    
                    {/* Add to playlist popover button (Always show on tracks to allow cross-adding) */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Add to Playlist..."
                        id={`add-to-playlist-trigger-${track.id}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown popup overlay to select playlist */}
                      {activeMenuTrackId === track.id && (
                        <div 
                          className="absolute right-0 bottom-7 w-48 bg-[#161220] border border-white/10 rounded-xl py-1.5 shadow-xl z-50 flex flex-col space-y-0.5"
                          id={`playlist-add-dropdown-${track.id}`}
                        >
                          <div className="px-2.5 py-1 border-b border-white/5 mb-1 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Add to playlist</span>
                            <button onClick={() => setActiveMenuTrackId(null)} className="text-slate-500 hover:text-white"><X className="w-2.5 h-2.5" /></button>
                          </div>
                          {playlists
                            .filter(p => p.isEditable !== false)
                            .map(p => {
                              const alreadyIn = p.trackIds.includes(track.id);
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    onAddTrackToPlaylist(p.id, track.id);
                                    setActiveMenuTrackId(null);
                                  }}
                                  className="px-2.5 py-1.5 text-left text-xs hover:bg-white/5 text-slate-300 hover:text-white flex items-center justify-between"
                                  id={`add-to-pl-opt-${p.id}`}
                                >
                                  <span className="truncate pr-1">{p.name}</span>
                                  {alreadyIn && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                </button>
                              );
                            })}
                          {playlists.filter(p => p.isEditable !== false).length === 0 && (
                            <div className="px-2.5 py-1 text-[10px] text-slate-500 italic text-center">
                              No custom playlists yet. Create one above!
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reorder Up/Down arrows & Delete if inside custom playlist */}
                    {activePlaylist.isEditable !== false ? (
                      <>
                        <button
                          disabled={!hasPrev}
                          onClick={() => onReorderTrack(activePlaylist.id, track.id, "up")}
                          className={`p-1 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                            hasPrev ? "text-slate-400 hover:text-white" : "text-slate-700 cursor-not-allowed"
                          }`}
                          title="Move up"
                          id={`reorder-up-${track.id}`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={!hasNext}
                          onClick={() => onReorderTrack(activePlaylist.id, track.id, "down")}
                          className={`p-1 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                            hasNext ? "text-slate-400 hover:text-white" : "text-slate-700 cursor-not-allowed"
                          }`}
                          title="Move down"
                          id={`reorder-down-${track.id}`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveTrackFromPlaylist(activePlaylist.id, track.id)}
                          className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Remove from playlist"
                          id={`remove-track-${track.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      // Only display duration in the standard master list
                      <span className="text-[10px] font-mono text-slate-400 pr-1.5">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
