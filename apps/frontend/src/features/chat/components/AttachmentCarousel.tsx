import { X, FileIcon, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttachmentFile {
  file: File;
  preview?: string;
  name: string;
  type: string;
  size: number;
}

interface AttachmentCarouselProps {
  files: AttachmentFile[];
  onRemove: (index: number) => void;
}

/**
 * AttachmentCarousel - Preview carousel for attached files
 * 
 * Design: Chatwoot-inspired horizontal scrollable carousel
 * Shows image previews or file icons with remove buttons
 * 
 * Best practices:
 * - Visual feedback for attached files before sending
 * - Easy removal with clear X button
 * - Responsive thumbnail sizing
 */
export function AttachmentCarousel({ files, onRemove }: AttachmentCarouselProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 mb-3 px-1 scrollbar-thin">
      {files.map((file, idx) => (
        <div 
          key={idx} 
          className="relative flex-shrink-0 group animate-fade-in-up"
        >
          {/* File preview or icon */}
          <div className="w-24 h-24 rounded-lg border-2 border-border bg-muted flex items-center justify-center overflow-hidden relative">
            {file.type.startsWith('image/') && file.preview ? (
              <img 
                src={file.preview} 
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-2">
                <FileIcon className="w-8 h-8 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">
                  {file.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Hover overlay for images */}
            {file.type.startsWith('image/') && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          
          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => onRemove(idx)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </Button>
          
          {/* File info */}
          <div className="mt-1.5 w-24">
            <p className="text-xs text-foreground truncate font-medium">
              {file.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
