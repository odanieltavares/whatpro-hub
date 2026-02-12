import React, { useState, useEffect, useRef } from 'react';
import { Department, WorkflowColumn } from '../types';
import { backendService } from '../services/mockBackend';
import { Plus, Trash2, Edit2, GripVertical, Settings, Save, X, Palette, FolderPlus } from 'lucide-react';

const TAILWIND_COLORS = [
    'bg-slate-400', 'bg-gray-500', 
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-yellow-400', 'bg-lime-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 
    'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
];

export const WorkflowSettings: React.FC = () => {
  // Initialize with Backend Data
  const [depts, setDepts] = useState<Department[]>([]);
  const [columns, setColumns] = useState<WorkflowColumn[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Edit/Create Column State
  const [editingColumn, setEditingColumn] = useState<WorkflowColumn | null>(null);

  // Create Dept State
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Drag and Drop State
  const draggedItem = useRef<number | null>(null);
  const draggedOverItem = useRef<number | null>(null);

  useEffect(() => {
      // Fetch on mount
      const d = backendService.getDepartments();
      const c = backendService.getColumns();
      setDepts(d);
      setColumns(c);
      if(d.length > 0 && !selectedDeptId) setSelectedDeptId(d[0].id);
  }, []);

  // Filter columns for the selected department
  const activeColumns = columns
    .filter(c => c.departmentId === selectedDeptId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // --- DEPARTMENT HANDLERS ---

  const handleSaveDept = () => {
    if (!newDeptName.trim()) {
        alert("O nome do departamento é obrigatório.");
        return;
    }
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      name: newDeptName,
      code: newDeptName.substring(0, 3).toUpperCase(),
      color: 'gray'
    };
    backendService.addDepartment(newDept);
    
    // Update state
    setDepts(backendService.getDepartments());
    setSelectedDeptId(newDept.id);
    
    // Reset Modal
    setNewDeptName('');
    setIsAddingDept(false);
  };

  // --- COLUMN HANDLERS ---

  const handleAddColumn = () => {
    if (!selectedDeptId) {
        alert("Selecione um departamento primeiro.");
        return;
    }

    // Initialize a blank column template
    const newCol: WorkflowColumn = {
      id: `temp_${Date.now()}`, // Temp ID to identify it's new (or we check existence)
      departmentId: selectedDeptId,
      title: '',
      chatwootTag: '',
      stage: 'handover',
      orderIndex: activeColumns.length,
      color: 'bg-slate-400'
    };
    
    setEditingColumn(newCol);
  };

  const handleDeleteColumn = (colId: string) => {
      if(confirm("Tem certeza que deseja remover esta coluna?")) {
          backendService.deleteColumn(colId);
          setColumns([...backendService.getColumns()]);
      }
  }

  const handleSaveColumn = () => {
      if(!editingColumn) return;
      if(!editingColumn.title.trim()) {
          alert("O título da coluna é obrigatório.");
          return;
      }

      // Check if this is an update (ID exists in current columns) or create (ID is temp or not found)
      const existing = columns.find(c => c.id === editingColumn.id);

      if (existing) {
          // UPDATE
          backendService.updateColumn(editingColumn.id, editingColumn);
      } else {
          // CREATE
          const finalCol = {
              ...editingColumn,
              id: `col_${Date.now()}`, // Generate final persistent ID
              chatwootTag: editingColumn.chatwootTag || editingColumn.title.toLowerCase().replace(/\s/g, '_')
          };
          backendService.addColumn(finalCol);
      }

      setColumns([...backendService.getColumns()]);
      setEditingColumn(null);
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleSort = () => {
    if (draggedItem.current === null || draggedOverItem.current === null) return;
    
    // Create a copy of the active columns to sort locally first
    const items = [...activeColumns];
    
    // Remove dragged item
    const draggedContent = items[draggedItem.current];
    items.splice(draggedItem.current, 1);
    
    // Insert at new position
    items.splice(draggedOverItem.current, 0, draggedContent);
    
    // Reset refs
    draggedItem.current = null;
    draggedOverItem.current = null;

    // Get the new order of IDs
    const newOrderIds = items.map(c => c.id);

    // Call Backend to save order
    backendService.reorderColumns(selectedDeptId, newOrderIds);
    
    // Update local state to reflect changes
    setColumns([...backendService.getColumns()]);
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* Create Department Modal */}
      {isAddingDept && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center">
                          <FolderPlus size={18} className="mr-2 text-blue-600"/> 
                          Novo Departamento
                      </h3>
                      <button onClick={() => setIsAddingDept(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Departamento</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Comercial, Suporte N2..."
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        autoFocus
                      />
                  </div>
                  <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                      <button onClick={() => setIsAddingDept(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={handleSaveDept} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium">
                          Criar Departamento
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit/Create Column Modal */}
      {editingColumn && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800">
                          {columns.find(c => c.id === editingColumn.id) ? 'Editar Coluna' : 'Nova Coluna'}
                      </h3>
                      <button onClick={() => setEditingColumn(null)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título da Coluna</label>
                          <input 
                            type="text" 
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={editingColumn.title}
                            onChange={(e) => setEditingColumn({...editingColumn, title: e.target.value})}
                            placeholder="Ex: Aguardando Cliente"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tag Chatwoot (Automação)</label>
                          <input 
                            type="text" 
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50"
                            value={editingColumn.chatwootTag}
                            onChange={(e) => setEditingColumn({...editingColumn, chatwootTag: e.target.value})}
                            placeholder={editingColumn.title ? editingColumn.title.toLowerCase().replace(/\s/g, '_') : "auto-gerado se vazio"}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Essa tag será adicionada à conversa no Chatwoot quando o card entrar nesta coluna.</p>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estágio do Ciclo</label>
                          <select 
                             className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                             value={editingColumn.stage}
                             onChange={(e) => setEditingColumn({...editingColumn, stage: e.target.value as any})}
                          >
                              <option value="triage">Triagem / Entrada</option>
                              <option value="handover">Execução / Handover</option>
                              <option value="waiting">Aguardando Cliente</option>
                              <option value="resolution">Resolução / Fim</option>
                          </select>
                      </div>
                      
                      {/* Color Picker */}
                      <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                               <Palette size={16} className="mr-2"/> Cor da Coluna
                           </label>
                           <div className="grid grid-cols-7 gap-2">
                                {TAILWIND_COLORS.map(colorClass => (
                                    <button
                                        key={colorClass}
                                        onClick={() => setEditingColumn({...editingColumn, color: colorClass})}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${colorClass} ${
                                            editingColumn.color === colorClass ? 'border-gray-800 ring-2 ring-gray-300' : 'border-transparent'
                                        }`}
                                    />
                                ))}
                           </div>
                      </div>

                  </div>
                  <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                      <button onClick={() => setEditingColumn(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={handleSaveColumn} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center">
                          <Save size={16} className="mr-2" />
                          Salvar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar: Departments */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <h3 className="font-bold text-gray-700">Departamentos</h3>
          <button 
            onClick={() => setIsAddingDept(true)} 
            className="p-1 hover:bg-gray-100 rounded text-blue-600 transition-colors"
            title="Adicionar Departamento"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {depts.map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center ${
                selectedDeptId === dept.id ? 'bg-white shadow-sm border border-gray-200 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{dept.name}</span>
              <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">{dept.code}</span>
            </button>
          ))}
          {depts.length === 0 && (
              <div className="text-center p-4 text-xs text-gray-400 italic">
                  Nenhum departamento. Clique em + para criar.
              </div>
          )}
        </div>
      </div>

      {/* Main: Column Editor */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {depts.find(d => d.id === selectedDeptId)?.name || "Selecione um Departamento"}
            </h2>
            <p className="text-sm text-gray-500">Gerenciar colunas e automações do Kanban</p>
          </div>
          <button 
            type="button"
            onClick={handleAddColumn}
            disabled={!selectedDeptId}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer z-10"
          >
            <Plus size={16} className="mr-2" />
            Nova Coluna
          </button>
        </div>

        <div className="flex-1 p-8 overflow-x-auto">
          <div className="flex space-x-4 items-start h-full">
            {activeColumns.map((col, index) => (
              <div 
                key={col.id} 
                draggable
                onDragStart={() => (draggedItem.current = index)}
                onDragEnter={() => (draggedOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col transition-transform hover:shadow-md group/card"
              >
                {/* Visual Color Strip */}
                <div className={`h-2 w-full rounded-t-xl ${col.color || 'bg-slate-400'}`}></div>

                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                   <div className="flex items-center space-x-2 text-gray-400 cursor-move">
                     <GripVertical size={16} />
                     <span className="font-semibold text-gray-700">{col.title}</span>
                   </div>
                   <div className="flex items-center space-x-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingColumn(col)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
                        title="Configurar"
                      >
                        <Settings size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteColumn(col.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                   </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Configuration Preview */}
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tag Chatwoot:</span>
                      <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">#{col.chatwootTag}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estágio:</span>
                      <span className="uppercase text-[10px] font-bold text-gray-400">{col.stage}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-xs text-center text-gray-400 italic">Arraste para reordenar</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State / Add Helper */}
            {activeColumns.length === 0 && selectedDeptId && (
              <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <p>Nenhuma coluna definida para este fluxo.</p>
                <button onClick={handleAddColumn} className="mt-2 text-blue-600 font-medium hover:underline">Criar primeira coluna</button>
              </div>
            )}
            
            {!selectedDeptId && (
                <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400">
                    <p>Selecione um departamento à esquerda para começar.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
