import React, { useMemo, useState, useEffect } from 'react';
import { Book, Quote, Feather, X, UserPlus, Save, Trash2 } from 'lucide-react';
import { InternalAvatar } from './InternalAvatar';

interface InternalProfileSidebarProps {
  name: string;
  avatar?: string;
  role?: string;
  isGroup?: boolean;
  roomId?: string | null;
  currentUserRole?: string;
  members?: Array<{ id: string | number; name?: string; email?: string; avatar_url?: string; role?: string }>;
  availableUsers?: Array<{ id: number | string; name?: string; email?: string; avatar_url?: string }>;
  onUpdateRoomInfo?: (roomId: string, name: string) => void;
  onAddMember?: (roomId: string, userId: string) => void;
  onRemoveMember?: (roomId: string, userId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function InternalProfileSidebar({
  name,
  avatar,
  role = 'Usuario do Sistema',
  isGroup = false,
  roomId,
  currentUserRole = 'agent',
  members = [],
  availableUsers = [],
  onUpdateRoomInfo,
  onAddMember,
  onRemoveMember,
  isOpen,
  onClose,
}: InternalProfileSidebarProps) {
  const [draftName, setDraftName] = useState(name);
  const [selectedUserId, setSelectedUserId] = useState('');
  const canManage = isGroup && ['admin', 'supervisor'].includes(currentUserRole);
  const memberIds = useMemo(() => new Set(members.map((m) => String(m.id))), [members]);
  const addOptions = useMemo(
    () => availableUsers.filter((user) => !memberIds.has(String(user.id))),
    [availableUsers, memberIds]
  );

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 overflow-y-auto animate-in slide-in-from-right duration-300 relative">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center"
          aria-label="Fechar perfil"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8 flex flex-col items-center text-center space-y-6">
        <InternalAvatar src={avatar} alt={name} size="lg" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          <p className="text-sm text-gray-500 italic">{role}</p>
        </div>

        <div className="w-full space-y-8 text-left">
          {isGroup && members.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-3 text-blue-600">
                <Book className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Membros</h3>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <InternalAvatar src={member.avatar_url} alt={member.name || member.email || 'Membro'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{member.name || 'Membro'}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {member.email} {member.role ? `\u2022 ${member.role}` : ''}
                      </p>
                    </div>
                    {canManage && roomId && onRemoveMember && (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(roomId, String(member.id))}
                        className="ml-auto text-gray-300 hover:text-red-500"
                        title="Remover membro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {canManage && roomId && (
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <UserPlus className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Gerenciar Grupo</h3>
              </div>

              {onUpdateRoomInfo && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Nome do Grupo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateRoomInfo(roomId, draftName.trim() || name)}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      title="Salvar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {onAddMember && addOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Adicionar Membro
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Selecione</option>
                      {addOptions.map((user) => (
                        <option key={user.id} value={String(user.id)}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedUserId}
                      onClick={() => {
                        onAddMember(roomId, selectedUserId);
                        setSelectedUserId('');
                      }}
                      className="p-2 rounded-lg bg-gray-900 text-white disabled:opacity-40"
                      title="Adicionar"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <div className="flex items-center space-x-2 mb-2 text-blue-600">
              <Feather className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Bio</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Usuario ativo da plataforma WhatPro Hub. Participante de diversos grupos e discussoes estrategicas.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-2 text-blue-600">
              <Book className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Interesses</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Tecnologia', 'Suporte', 'Vendas', 'Inovacao'].map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-semibold uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <Quote className="w-5 h-5 text-blue-300 mb-2" />
            <p className="text-sm italic text-gray-700">
              "A comunicacao eficiente e a chave para o sucesso de qualquer operacao."
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
