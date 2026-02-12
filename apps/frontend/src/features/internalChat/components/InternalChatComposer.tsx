import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type FormEvent } from 'react';
import { Bold, Italic, Code, Link as LinkIcon, Smile, Paperclip, SendHorizontal, X, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

interface User {
  id: number;
  name?: string;
  email?: string;
  avatar_url?: string;
  mention?: string;
}

interface InternalChatComposerProps {
  onSendMessage: (content: string, files?: File[]) => void;
  users?: User[];
  placeholder?: string;
  disabled?: boolean;
  mode?: 'reply' | 'private';
  onModeChange?: (mode: 'reply' | 'private') => void;
  initialContent?: string;
  initialContentFormat?: 'text' | 'markdown' | 'html';
  replyTo?: { id: string; author: string; preview: string } | null;
  editingMessage?: { id: string; author: string; isPrivate?: boolean } | null;
  onClearReply?: () => void;
  onCancelEdit?: () => void;
}

const EMOJIS = [
  '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F606}', '\u{1F605}',
  '\u{1F923}', '\u{1F602}', '\u{1F642}', '\u{1F609}', '\u{1F60A}', '\u{1F60D}',
  '\u{1F618}', '\u{1F60E}', '\u{1F914}', '\u{1F62E}', '\u{1F622}', '\u{1F62D}',
  '\u{1F621}', '\u{1F44D}', '\u{1F44E}', '\u{1F64F}', '\u{1F44F}', '\u{1F525}',
  '\u{1F389}', '\u{1F4A1}', '\u{1F4AC}', '\u{2764}\u{FE0F}', '\u{2705}', '\u{2B50}',
];

const SPECIAL_MENTIONS: User[] = [
  { id: -1, name: 'Todos', email: '@todos', mention: 'todos' },
];

function htmlToMarkdown(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;

  const serializeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') {
      return `**${Array.from(el.childNodes).map(serializeNode).join('')}**`;
    }
    if (tag === 'em' || tag === 'i') {
      return `_${Array.from(el.childNodes).map(serializeNode).join('')}_`;
    }
    if (tag === 'code') {
      return `\`${Array.from(el.childNodes).map(serializeNode).join('')}\``;
    }
    if (tag === 'ul') {
      const items = Array.from(el.children).map((li) => `- ${serializeNode(li).trim()}`);
      return `${items.join('\n')}\n`;
    }
    if (tag === 'ol') {
      const items = Array.from(el.children).map((li, index) => `${index + 1}. ${serializeNode(li).trim()}`);
      return `${items.join('\n')}\n`;
    }
    if (tag === 'li') {
      return `${Array.from(el.childNodes).map(serializeNode).join('')}`;
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') || 'url';
      const label = Array.from(el.childNodes).map(serializeNode).join('');
      return `[${label}](${href})`;
    }
    if (tag === 'span' && el.dataset.mention) {
      return `@${el.dataset.mention}`;
    }
    if (tag === 'div' || tag === 'p') {
      return `${Array.from(el.childNodes).map(serializeNode).join('')}\n`;
    }

    return Array.from(el.childNodes).map(serializeNode).join('');
  };

  return Array.from(container.childNodes).map(serializeNode).join('').trim();
}

function markdownToHtml(markdown: string) {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split(/\r?\n/);
  const htmlLines: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      htmlLines.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlLines.push('</ol>');
      inOl = false;
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    const ulMatch = line.match(/^-\s+(.*)$/);

    if (olMatch) {
      if (!inOl) {
        closeLists();
        htmlLines.push('<ol>');
        inOl = true;
      }
      htmlLines.push(`<li>${olMatch[1]}</li>`);
      return;
    }

    if (ulMatch) {
      if (!inUl) {
        closeLists();
        htmlLines.push('<ul>');
        inUl = true;
      }
      htmlLines.push(`<li>${ulMatch[1]}</li>`);
      return;
    }

    closeLists();
    if (!line) {
      htmlLines.push('<br/>');
      return;
    }
    htmlLines.push(`<p>${line}</p>`);
  });

  closeLists();

  let html = htmlLines.join('');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');
  html = html.replace(/@([a-zA-Z0-9_-]+)/g, '<span data-mention="$1" class="mention-pill">@$1</span>');

  return html;
}

function stripHtmlToText(html?: string) {
  if (!html) return '';
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '');
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent || '';
}

function insertHtmlAtCursor(html: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function replaceTriggerWithMention(trigger: string, label: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) {
    insertHtmlAtCursor(`<span data-mention="${label}" class="mention-pill">@${label}</span>&nbsp;`);
    return;
  }

  const text = node.textContent || '';
  const caret = range.startOffset;
  const before = text.slice(0, caret);
  const triggerIndex = before.lastIndexOf(trigger);

  if (triggerIndex >= 0) {
    const mentionRange = document.createRange();
    mentionRange.setStart(node, triggerIndex);
    mentionRange.setEnd(node, caret);
    mentionRange.deleteContents();
    selection.removeAllRanges();
    selection.addRange(mentionRange);
  }

  insertHtmlAtCursor(`<span data-mention="${label}" class="mention-pill">@${label}</span>&nbsp;`);
}

export function InternalChatComposer({
  onSendMessage,
  users = [],
  placeholder = 'Digite sua mensagem... ',
  disabled = false,
  mode = 'reply',
  onModeChange,
  initialContent,
  initialContentFormat = 'text',
  replyTo,
  editingMessage,
  onClearReply,
  onCancelEdit,
}: InternalChatComposerProps) {
  const [plainText, setPlainText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachmentFile[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionAnchorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const mentionsPopoverRef = useRef<HTMLDivElement>(null);
  const hasText = plainText.trim().length > 0;
  const lastInitialRef = useRef<string | undefined>(undefined);
  const lastFormatRef = useRef<InternalChatComposerProps['initialContentFormat']>('text');

  useEffect(() => {
    if (!editorRef.current) return;
    if (typeof initialContent !== 'string') return;
    if (initialContent === lastInitialRef.current && initialContentFormat === lastFormatRef.current) return;
    lastInitialRef.current = initialContent;
    lastFormatRef.current = initialContentFormat;
    if (initialContentFormat === 'markdown') {
      editorRef.current.innerHTML = markdownToHtml(initialContent);
    } else if (initialContentFormat === 'html') {
      editorRef.current.innerHTML = initialContent;
    } else {
      editorRef.current.textContent = initialContent;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlainText(stripHtmlToText(initialContent));
  }, [initialContent, initialContentFormat]);

  useEffect(() => {
    if (!showMentions && !showEmojiPicker) return;

    const handleOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      const path =
        typeof (event as Event & { composedPath?: () => EventTarget[] }).composedPath === 'function'
          ? (event as Event & { composedPath?: () => EventTarget[] }).composedPath()
          : undefined;

      const isInside = (node: Node | null) => {
        if (!node) return false;
        if (path) return path.includes(node);
        return node.contains(target);
      };

      const insideRoot = isInside(rootRef.current);
      if (!insideRoot) {
        setShowMentions(false);
        setShowEmojiPicker(false);
        return;
      }

      const inEmoji = isInside(emojiPopoverRef.current) || isInside(emojiButtonRef.current);
      const inMentions =
        isInside(mentionsPopoverRef.current) || isInside(editorRef.current) || isInside(mentionAnchorRef.current);

      if (showEmojiPicker && !inEmoji) setShowEmojiPicker(false);
      if (showMentions && !inMentions) setShowMentions(false);
    };

    const handleWindowBlur = () => {
      setShowMentions(false);
      setShowEmojiPicker(false);
    };

    document.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('pointerdown', handleOutside, true);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [showMentions, showEmojiPicker]);

  const updateMentions = (plainText: string) => {
    const words = plainText.split(/\s+/);
    const lastWord = words[words.length - 1] || '';

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = users.filter((u) =>
        (u.name?.toLowerCase() || '').includes(query) || (u.email?.toLowerCase() || '').includes(query)
      );
      const specials = SPECIAL_MENTIONS.filter((u) =>
        (u.mention || u.name || '').toLowerCase().includes(query)
      );
      const merged = [...specials, ...filtered];
      setFilteredUsers(merged);
      setShowMentions(merged.length > 0);
      setMentionIndex(0);
    } else {
      setFilteredUsers([]);
      setShowMentions(false);
      setMentionIndex(0);
    }
  };

  const handleInput = () => {
    const nextPlainText = editorRef.current?.innerText || '';
    setPlainText(nextPlainText);
    updateMentions(nextPlainText);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((idx) => Math.min(idx + 1, filteredUsers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((idx) => Math.max(idx - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const user = filteredUsers[mentionIndex];
        if (user) handleSelectMention(user);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (showEmojiPicker && e.key === 'Escape') {
      e.preventDefault();
      setShowEmojiPicker(false);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (disabled) return;
    const currentPlainText = editorRef.current?.innerText || '';
    if (!currentPlainText.trim() && attachedFiles.length === 0) return;

    const filesToSend = attachedFiles.map((af) => af.file);
    const markdown = htmlToMarkdown(editorRef.current?.innerHTML || '');
    onSendMessage(markdown.trim(), filesToSend);

    setPlainText('');
    setAttachedFiles([]);
    setShowMentions(false);
    setShowEmojiPicker(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    setAttachedFiles((prev) => [...prev, ...newAttachments]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectMention = (user: User) => {
    const label = user.mention || user.name || user.email || 'usuario';
    replaceTriggerWithMention('@', label);
    setShowMentions(false);
    editorRef.current?.focus();
    handleInput();
  };

  const toggleFormat = (command: 'bold' | 'italic' | 'code' | 'unorderedList' | 'orderedList') => {
    editorRef.current?.focus();
    if (command === 'code') {
      const selection = window.getSelection();
      const selected = selection?.toString() || 'codigo';
      insertHtmlAtCursor(`<code>${selected}</code>`);
    } else if (command === 'unorderedList') {
      document.execCommand('insertUnorderedList');
    } else if (command === 'orderedList') {
      document.execCommand('insertOrderedList');
    } else {
      document.execCommand(command);
    }
    handleInput();
  };

  const insertLink = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    const selected = selection?.toString() || 'texto';
    insertHtmlAtCursor(`<a href="url" class="text-blue-600 underline">${selected}</a>`);
    handleInput();
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    insertHtmlAtCursor(`${emoji}&nbsp;`);
    setShowEmojiPicker(false);
    handleInput();
  };

  const canSend = () => {
    const editorText = editorRef.current?.innerText || '';
    return editorText.trim().length > 0 || hasText || attachedFiles.length > 0;
  };

  return (
    <div ref={rootRef}>
      {replyTo && (
        <div className="px-6 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <span className="truncate max-w-[300px] font-medium italic">
              Respondendo: {replyTo.preview}
            </span>
          </div>
          <button
            onClick={onClearReply}
            className="p-1.5 text-gray-300 hover:text-gray-500"
            type="button"
            aria-label="Limpar resposta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {editingMessage && (
        <div className="px-6 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <span className="truncate max-w-[300px] font-medium italic">
              {mode === 'private' && editingMessage.isPrivate
                ? 'Editando nota privada'
                : `Editando mensagem de ${editingMessage.author}`}
            </span>
          </div>
          <button
            onClick={onCancelEdit}
            className="p-1.5 text-gray-300 hover:text-gray-500"
            type="button"
            aria-label="Cancelar edicao"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="px-4 pb-2 sm:px-6 sm:pb-3 bg-[#F3F6F9]">
        {attachedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Remover anexo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
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
                    disabled={!!editingMessage}
                    className={cn(
                      'px-6 py-1.5 text-[11px] font-bold rounded-full transition-all',
                      mode === 'reply' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400',
                      editingMessage ? 'opacity-60 cursor-not-allowed' : ''
                    )}
                  >
                    Responder
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange('private')}
                    disabled={!!editingMessage}
                    className={cn(
                      'px-6 py-1.5 text-[11px] font-bold rounded-full transition-all',
                      mode === 'private' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400',
                      editingMessage ? 'opacity-60 cursor-not-allowed' : ''
                    )}
                  >
                    Mensagem Privada
                  </button>
                </div>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-3 pr-2">
                <button type="button" onClick={() => toggleFormat('bold')} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Negrito">
                  <Bold className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => toggleFormat('italic')} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Italico">
                  <Italic className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => toggleFormat('code')} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Codigo">
                  <Code className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => toggleFormat('unorderedList')} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Lista">
                  <List className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
                <button type="button" onClick={() => toggleFormat('orderedList')} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Lista numerada">
                  <ListOrdered className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
                <button type="button" onClick={insertLink} className="text-[#CED4DA] hover:text-blue-500 transition-colors" title="Link">
                  <LinkIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="bg-white px-1 relative" ref={mentionAnchorRef}>
              <div
                ref={editorRef}
                contentEditable={!disabled}
                role="textbox"
                aria-label="Editor de mensagem"
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full min-h-[40px] max-h-[120px] px-5 pb-4 text-[13px] text-gray-700 outline-none resize-none placeholder-[#ADB5BD] bg-white leading-relaxed overflow-y-auto',
                  disabled ? 'opacity-50' : ''
                )}
                data-placeholder={placeholder}
                suppressContentEditableWarning
              />
              {!hasText && (
                <div className="pointer-events-none absolute left-5 top-3 text-[13px] text-[#ADB5BD]">
                  {placeholder}
                </div>
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
                  ref={emojiButtonRef}
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
                <span className="hidden sm:inline text-xs uppercase font-bold tracking-wider">Enviar</span>
                <SendHorizontal
                  className={cn('w-3.5 h-3.5 transition-transform', canSend() ? 'translate-x-0.5' : '')}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </form>

          {showMentions && filteredUsers.length > 0 && (
            <div
              ref={mentionsPopoverRef}
              className="absolute left-0 right-0 bottom-full mb-3 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto"
            >
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Mencionar usuario
              </div>
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectMention(user)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center space-x-3 transition-colors text-left',
                    index === mentionIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-50">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-blue-600">@</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {user.mention ? `@${user.mention}` : user.name || user.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {showEmojiPicker && (
            <div
              ref={emojiPopoverRef}
              className="absolute left-0 bottom-[88px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 p-4 grid grid-cols-6 gap-3 min-w-[320px]"
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="flex items-center justify-center w-10 h-10 text-2xl hover:bg-white/50 hover:scale-110 transition-all rounded-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


