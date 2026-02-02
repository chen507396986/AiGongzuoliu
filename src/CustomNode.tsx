import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export type CustomNodeData = {
  label: string;
  subLabel?: string;
  color?: string;
};

export function CustomNode({ id, data, selected }: NodeProps<any>) {
  const { label, subLabel, color = '#333' } = data;
  const { updateNodeData, deleteElements } = useReactFlow();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isEditingSub, setIsEditingSub] = useState(false);
  const [subEditValue, setSubEditValue] = useState(subLabel || '');
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingSub && subInputRef.current) {
      subInputRef.current.focus();
    }
  }, [isEditingSub]);

  const onSubmit = () => {
    setIsEditing(false);
    // Only update if value changed
    if (editValue !== label) {
        updateNodeData(id, { label: editValue });
    }
  };

  const onSubSubmit = () => {
    setIsEditingSub(false);
    if (subEditValue !== subLabel) {
        updateNodeData(id, { subLabel: subEditValue });
    }
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '5px',
        background: '#1a1a1a',
        color: '#fff',
        border: `1px solid ${selected ? '#fff' : color}`,
        borderLeft: `5px solid ${color}`,
        minWidth: '150px',
        fontSize: '12px',
        position: 'relative',
        boxShadow: selected ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Delete Button - Visible when selected or on hover (group-hover would need CSS, using selected for simplicity in inline styles) */}
      <div 
        onClick={onDelete}
        className="nodrag"
        style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ff4444',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: selected ? 'flex' : 'none',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            color: 'white',
            zIndex: 10,
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        }}
        title="删除节点"
      >
        <Trash2 size={12} />
      </div>

      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div 
        onDoubleClick={() => setIsEditing(true)}
        className="nodrag"
        style={{ fontWeight: 'bold', marginBottom: subLabel ? '5px' : '0', cursor: 'text', minHeight: '18px', userSelect: 'text' }}
        title="双击修改名称"
      >
        {isEditing ? (
            <input 
                ref={inputRef}
                className="nodrag"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={onSubmit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                    if (e.key === 'Escape') {
                        setEditValue(label);
                        setIsEditing(false);
                    }
                }}
                style={{
                    width: '100%',
                    background: '#333',
                    border: '1px solid #666',
                    color: 'white',
                    fontSize: '12px',
                    padding: '2px 4px',
                    outline: 'none',
                    borderRadius: '2px'
                }}
            />
        ) : (
            label
        )}
      </div>
      
      {subLabel && (
        <div 
            className="nodrag" 
            style={{ fontSize: '10px', opacity: 0.8, userSelect: 'text', cursor: 'text', minHeight: '14px' }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingSub(true);
            }}
            title="双击修改副标题"
        >
            {isEditingSub ? (
                <input 
                    ref={subInputRef}
                    className="nodrag"
                    value={subEditValue}
                    onChange={(e) => setSubEditValue(e.target.value)}
                    onBlur={onSubSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSubSubmit();
                        if (e.key === 'Escape') {
                            setSubEditValue(subLabel || '');
                            setIsEditingSub(false);
                        }
                    }}
                    style={{
                        width: '100%',
                        background: '#333',
                        border: '1px solid #666',
                        color: 'white',
                        fontSize: '10px',
                        padding: '1px 2px',
                        outline: 'none',
                        borderRadius: '2px'
                    }}
                    onClick={(e) => e.stopPropagation()} 
                />
            ) : (
                subLabel
            )}
        </div>
      )}
 
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
}
