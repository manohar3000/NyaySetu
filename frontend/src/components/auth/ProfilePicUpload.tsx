import React from 'react';

const ProfilePicUpload: React.FC = () => {
  return (
    <div className="mb-4">
      <label className="block text-cyan-200 mb-2">Profile Picture</label>
      <div className="w-full h-28 flex items-center justify-center border-2 border-dashed border-cyan-400/40 rounded-xl bg-black/30 cursor-pointer hover:border-cyan-400 transition-all duration-300">
        <span className="text-cyan-400">Drag & drop or click to upload</span>
      </div>
      {/* Image preview placeholder */}
      <div className="mt-2 w-20 h-20 rounded-full bg-cyan-400/20 flex items-center justify-center overflow-hidden">
        <span className="text-cyan-300 text-xs">Preview</span>
      </div>
    </div>
  );
};

export default ProfilePicUpload; 