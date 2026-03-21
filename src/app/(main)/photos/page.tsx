"use client";

import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch real photos from database
  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        profiles (name, role, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching photos", error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Handle uploading new photo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload image to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: "Uploaded a new photo! #AdobeCSC"
        });

      if (dbError) throw dbError;

      // 4. Refresh wall
      await fetchPhotos();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Check permissions or try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pb-28 bg-black min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-tight">Highlights</h2>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          accept="image/*" 
          hidden 
          ref={fileInputRef} 
          onChange={handleUpload}
          disabled={uploading}
        />
        
        <button 
          onClick={handleAddClick}
          disabled={uploading}
          className="bg-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/5 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
        </button>
      </div>

      <div className="space-y-[2px] md:space-y-4 md:p-4 md:max-w-2xl md:mx-auto min-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-white/50" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center p-12 text-white/50">
            <p>No photos yet! Be the first to share a highlight.</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="relative w-full aspect-[4/5] md:rounded-3xl overflow-hidden bg-zinc-900 group">
              {/* Full Bleed Image */}
              <img src={photo.image_url} alt={photo.caption || "Conference Photo"} className="w-full h-full object-cover" />
              
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              
              {/* Top Right Actions */}
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white border border-white/10 transition-colors">
                <MoreHorizontal size={20} />
              </button>

              {/* Content Area */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pt-12">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-adobe-red p-[2px]">
                    {photo.profiles?.avatar_url ? (
                      <img src={photo.profiles.avatar_url} className="w-full h-full rounded-full object-cover border-2 border-black" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white">{photo.profiles?.name?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{photo.profiles?.name || "Unknown"}</h3>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">{photo.profiles?.role || "Attendee"}</p>
                  </div>
                </div>
                
                <p className="text-white/95 text-sm leading-relaxed mb-5 line-clamp-2 pr-4 font-medium">
                  {photo.caption}
                </p>

                {/* Action Pills */}
                <div className="flex space-x-3">
                  <button className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white hover:bg-white/20 transition border border-white/10 font-medium text-sm">
                    <Heart size={18} />
                    <span>0</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white hover:bg-white/20 transition border border-white/10 font-medium text-sm">
                    <MessageCircle size={18} />
                    <span>0</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
