import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Code, Link as LinkIcon, Smile, Paperclip, SendHorizontal } from 'lucide-react';
import { AttachmentCarousel } from './AttachmentCarousel';
import { MentionsDropdown } from './MentionsDropdown';

interface AttachmentFile {
  file: File;
  preview?: string;
  name: string;
  type: string;
  size: number;
}

interface User {
  id: number;
  name?: string;
  email?: string;
  avatar_url?: string;
}

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  users?: User[];
  placeholder?: string;
  disabled?: boolean;
  mode?: 'reply' | 'private';
  onModeChange?: (mode: 'reply' | 'private') => void;
  initialContent?: string;
  replyTo?: { id: string; author: string; preview: string } | null;
  onClearReply?: () => void;
}

/**
 * MessageInput - EXACT replica from chat-interno reference
 */

export function MessageInput({
  onSendMessage,
  users = [],
  placeholder = 'Digite sua mensagem...',
  disabled = false,
  mode = 'reply',
  onModeChange,
  initialContent,
  replyTo,
  onClearReply,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachmentFile[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (typeof initialContent === 'string') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      setMentionQuery(query);

      const filtered = users.filter((u) =>
        (u.name?.toLowerCase() || '').includes(query) || (u.email?.toLowerCase() || '').includes(query)
      );

      setFilteredUsers(filtered);
      setShowMentions(filtered.length > 0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
      setFilteredUsers([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (disabled) return;
    if (!content.trim() && attachedFiles.length === 0) return;

    const filesToSend = attachedFiles.map((af) => af.file);
    onSendMessage(content.trim(), filesToSend);

    setContent('');
    setAttachedFiles([]);
    setShowMentions(false);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newAttachments: AttachmentFile[] = files.map((file) => {
      const attachment: AttachmentFile = {
        file,
        name: file.name,
        type: file.type,
        size: file.size,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachment.preview = reader.result as string;
          setAttachedFiles((prev) => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      return attachment;
    });

    setAttachedFiles((prev) => [...prev, ...newAttachments]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectMention = (user: User) => {
    const words = content.split(/\s+/);
    words[words.length - 1] = `@${user.name}`;
    setContent(`${words.join(' ')} `);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const toggleFormat = (marker: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = content.slice(start, end);
    let next: string;

    if (selected) {
      next = `${content.slice(0, start)}${marker}${selected}${marker}${content.slice(end)}`;
    } else {
      next = `${content.slice(0, start)}${marker}texto${marker}${content.slice(end)}`;
    }

    setContent(next);
    setTimeout(() => {
      el.focus();
      const offset = selected ? start + marker.length : start + marker.length;
      el.selectionStart = offset;
      el.selectionEnd = offset + (selected ? selected.length : 5);
    }, 10);
  };

  const insertLink = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = content.slice(start, end) || 'texto';
    const next = `${content.slice(0, start)}[${selected}](url)${content.slice(end)}`;
    setContent(next);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + 1;
      el.selectionEnd = start + 1 + selected.length;
    }, 10);
  };

  const handleBold = () => toggleFormat('**');
  const handleItalic = () => toggleFormat('_');
  const handleCode = () => toggleFormat('`');

  const canSend = () => content.trim().length > 0 || attachedFiles.length > 0;

  return (
    <>
      {replyTo && (
        <div className="px-6 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <span className="truncate max-w-[300px] font-medium italic">
              Respondendo: {replyTo.preview}
            </span>
          </div>
          <button
            onClick={onClearReply}
            className="p-1.5 text-gray-300 hover:text-gray-500"
            type="button"
          >
            ?
          </button>
        </div>
      )}

      <div className="px-4 pb-4 sm:px-6 sm:pb-6 bg-[#F3F6F9]">
        {attachedFiles.length > 0 && (
          <div className="mb-3">
            <AttachmentCarousel files={attachedFiles} onRemove={handleRemoveFile} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden flex flex-col relative focus-within:ring-2 focus-within:ring-blue-100 transition-all"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            {mode && onModeChange ? (
              <div className="flex bg-[#F1F3F5] rounded-full p-1">
                <button
                  type="button"
                  onClick={() => onModeChange('reply')}
                  className={cn(
                    'px-6 py-1.5 text-[11px] font-bold rounded-full transition-all',
                    mode === 'reply' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
                  )}
                >
                  Responder
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('private')}
                  className={cn(
                    'px-6 py-1.5 text-[11px] font-bold rounded-full transition-all',
                    mode === 'private' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'
                  )}
                >
                  Mensagem Privada
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-3 pr-2">
              <button
                type="button"
                onClick={handleBold}
                className="text-[#CED4DA] hover:text-blue-500 transition-colors"
                title="Negrito"
              >
                <Bold className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleItalic}
                className="text-[#CED4DA] hover:text-blue-500 transition-colors"
                title="Italico"
              >
                <Italic className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleCode}
                className="text-[#CED4DA] hover:text-blue-500 transition-colors"
                title="Codigo"
              >
                <Code className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="text-[#CED4DA] hover:text-blue-500 transition-colors"
                title="Link"
              >
                <LinkIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="bg-white px-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full min-h-[40px] max-h-[100px] px-5 pb-4 text-[13px] text-gray-700 outline-none resize-none placeholder-[#ADB5BD] bg-white leading-relaxed disabled:opacity-50"
            />

            {showMentions && filteredUsers.length > 0 && (
              <MentionsDropdown
                users={filteredUsers}
                query={mentionQuery}
                onSelect={handleSelectMention}
                onClose={() => setShowMentions(false)}
              />
            )}
          </div>

          <div className="flex items-center justify-between p-4 px-5 bg-white">
            <div className="flex space-x-2.5 relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className={cn(
                  'p-2.5 rounded-[14px] transition-all border shadow-sm',
                  showEmojiPicker
                    ? 'bg-blue-50 border-blue-100 text-blue-500'
                    : 'bg-[#F8F9FA] border-[#E9ECEF] text-[#ADB5BD] hover:text-gray-600'
                )}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2.5 bg-[#F8F9FA] border-[#E9ECEF] text-[#ADB5BD] hover:text-gray-600 rounded-[14px] transition-all border shadow-sm disabled:opacity-50"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSend() || disabled}
              className={cn(
                'h-10 px-6 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]',
                canSend() && !disabled
                  ? 'bg-[#82C3B1] text-white hover:bg-[#71b1a0] hover:shadow-md'
                  : 'bg-[#F8F9FA] border border-[#E9ECEF] text-[#ADB5BD] cursor-not-allowed'
              )}
            >
              <span className="hidden sm:inline text-xs uppercase font-bold tracking-wider">
                Enviar
              </span>
              <SendHorizontal
                className={cn('w-3.5 h-3.5 transition-transform', canSend() ? 'translate-x-0.5' : '')}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
