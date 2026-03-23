"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Plus, Loader2, X, ChevronLeft, ChevronRight, Upload, ImageIcon, Trash2 } from "lucide-react";
import { createClient, getSharedSession, runSupabaseOperation } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Photo = {
  id: string;
  image_url: string;
  caption?: string;
  created_at: string;
  profiles?: { name: string; role: string; avatar_url: string | null };
};

type PhotoWithDimensions = Photo & {
  width: number;
  height: number;
  aspectRatio: number;
};

type JustifiedRow = {
  photos: PhotoWithDimensions[];
  height: number;
};

// ---------------------------------------------------------------------------
// Justified-grid helpers
// ---------------------------------------------------------------------------
const TARGET_ROW_HEIGHT = 280;
const ROW_GAP = 4; // px between images
const MAX_PER_ROW = 5;

function buildJustifiedRows(
  photos: PhotoWithDimensions[],
  containerWidth: number
): JustifiedRow[] {
  if (containerWidth <= 0 || photos.length === 0) return [];

  const rows: JustifiedRow[] = [];
  let currentRow: PhotoWithDimensions[] = [];
  let currentRowWidth = 0;

  for (const photo of photos) {
    const scaledWidth = photo.aspectRatio * TARGET_ROW_HEIGHT;
    currentRow.push(photo);
    currentRowWidth += scaledWidth;

    const gapTotal = (currentRow.length - 1) * ROW_GAP;
    if (currentRowWidth + gapTotal >= containerWidth || currentRow.length >= MAX_PER_ROW) {
      // Compute exact row height so the images fill the container width
      const totalAspect = currentRow.reduce((s, p) => s + p.aspectRatio, 0);
      const rowHeight = (containerWidth - gapTotal) / totalAspect;
      rows.push({ photos: currentRow, height: rowHeight });
      currentRow = [];
      currentRowWidth = 0;
    }
  }

  // Last (incomplete) row — use target height, don't stretch
  if (currentRow.length > 0) {
    rows.push({ photos: currentRow, height: TARGET_ROW_HEIGHT });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoWithDimensions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Container width for justified layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // -----------------------------------------------------------------------
  // Measure container
  // -----------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // -----------------------------------------------------------------------
  // Fetch photos
  // -----------------------------------------------------------------------
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const photosResult = await runSupabaseOperation(
        "Loading photos",
        (client) =>
          client
            .from("photos")
            .select(
              `
              *,
              profiles (name, role, avatar_url)
            `
            )
            .order("created_at", { ascending: false })
      ) as { data: Photo[] | null; error: { message?: string } | null };
      const { data, error: fetchError } = photosResult;

      if (fetchError) {
        console.error("Supabase error fetching photos:", fetchError);
        setError(fetchError.message || "Failed to load photos.");
        setPhotos([]);
        return;
      }

      // We need dimensions for the justified grid. We'll load them
      // progressively — default to 4:3 until the image is inspected.
      const withDimensions: PhotoWithDimensions[] = (data || []).map((p: Photo) => ({
        ...p,
        width: 400,
        height: 300,
        aspectRatio: 4 / 3,
      }));

      setPhotos(withDimensions);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong while loading photos.");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // -----------------------------------------------------------------------
  // Update dimensions once images load in the browser
  // -----------------------------------------------------------------------
  const handleImageLoad = useCallback(
    (id: string, naturalWidth: number, naturalHeight: number) => {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                width: naturalWidth,
                height: naturalHeight,
                aspectRatio: naturalWidth / naturalHeight,
              }
            : p
        )
      );
    },
    []
  );

  // -----------------------------------------------------------------------
  // Upload
  // -----------------------------------------------------------------------
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      const {
        data: { session },
      } = await getSharedSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      // Upload all selected files
      const uploadPromises = Array.from(files).map(async (file) => {
        // 1. Upload to Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(filePath);

        // 3. Insert row
        const { error: dbError } = await supabase.from("photos").insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: "",
        });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      // 4. Refresh
      await fetchPhotos();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload one or more photos. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------
  const handleDelete = async (photo: PhotoWithDimensions) => {
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    try {
      const {
        data: { session },
      } = await getSharedSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated");

      // Extract storage path from the public URL
      const urlParts = photo.image_url.split("/storage/v1/object/public/photos/");
      if (urlParts.length === 2) {
        await supabase.storage.from("photos").remove([urlParts[1]]);
      }

      // Delete from database
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      // Close lightbox if open
      if (lightboxIndex !== null) {
        closeLightbox();
      }

      // Refresh
      await fetchPhotos();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete photo. You can only delete your own photos.");
    }
  };

  // -----------------------------------------------------------------------
  // Lightbox helpers
  // -----------------------------------------------------------------------
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () =>
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const nextPhoto = () =>
    setLightboxIndex((i) =>
      i !== null && i < photos.length - 1 ? i + 1 : i
    );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  // -----------------------------------------------------------------------
  // Build grid rows
  // -----------------------------------------------------------------------
  const rows = useMemo(
    () => buildJustifiedRows(photos, containerWidth),
    [photos, containerWidth]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Photos
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </p>
        </div>

        {/* Upload button */}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={uploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-gradient-to-r from-adobe-red to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-adobe-red/20"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} strokeWidth={3} />
          )}
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="px-1 sm:px-2 pt-2 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <Loader2 className="animate-spin text-white/40" size={32} />
            <p className="text-white/30 text-sm">Loading photos…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <X size={28} className="text-red-400" />
            </div>
            <p className="text-white/60 text-sm text-center max-w-xs">
              {error}
            </p>
            <button
              onClick={fetchPhotos}
              className="text-sm text-adobe-red hover:underline"
            >
              Try again
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <ImageIcon size={32} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm font-medium">
                No photos yet
              </p>
              <p className="text-white/30 text-xs mt-1">
                Be the first to share a highlight!
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/15 transition border border-white/10"
            >
              <Upload size={16} />
              Upload a Photo
            </button>
          </div>
        ) : (
          /* ---- JUSTIFIED GRID ---- */
          <div className="flex flex-col" style={{ gap: `${ROW_GAP}px` }}>
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex"
                style={{ gap: `${ROW_GAP}px`, height: `${row.height}px` }}
              >
                {row.photos.map((photo) => {
                  const flatIndex = photos.findIndex(
                    (p) => p.id === photo.id
                  );
                  return (
                    <div
                      key={photo.id}
                      className="relative overflow-hidden cursor-pointer group"
                      style={{
                        flexGrow: photo.aspectRatio,
                        flexBasis: 0,
                      }}
                      onClick={() => openLightbox(flatIndex)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt={photo.caption || "Photo"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          handleImageLoad(
                            photo.id,
                            img.naturalWidth,
                            img.naturalHeight
                          );
                        }}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                      {/* Delete button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-black/80 transition opacity-0 group-hover:opacity-100 z-10"
                        title="Delete photo"
                      >
                        <Trash2 size={14} />
                      </button>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs line-clamp-1 font-medium">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- LIGHTBOX ---- */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex].image_url}
              alt={photos[lightboxIndex].caption || "Photo"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {/* Caption & author */}
            <div className="mt-4 text-center flex flex-col items-center gap-3">
              <div>
                {photos[lightboxIndex].caption && (
                  <p className="text-white/90 text-sm font-medium">
                    {photos[lightboxIndex].caption}
                  </p>
                )}
                {photos[lightboxIndex].profiles?.name && (
                  <p className="text-white/40 text-xs mt-1">
                    by {photos[lightboxIndex].profiles?.name}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photos[lightboxIndex]);
                }}
                className="flex items-center gap-2 text-white/50 hover:text-red-400 text-xs transition px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
