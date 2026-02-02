import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  BackgroundVariant,
  type Node,
  MarkerType,
  Panel,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { CustomNode } from './CustomNode';
import { githubService, type GitHubUser } from './github';
import { saveWorkflowToServer, getWorkflowsFromServer, getWorkflowFromServer, checkServerHealth } from './api';
import { Github, UploadCloud, DownloadCloud, LogOut, Loader2, History, X, Trash2, KeyRound, ExternalLink, Server, Database, Share2 } from 'lucide-react';

// --- Types ---
interface ChangelogItem {
    date: string;
    version: string;
    content: string[];
}

const changelog: ChangelogItem[] = [
    {
        date: '2026-02-02',
        version: '0.1.7',
        content: [
            '🖥️ 封装为 Electron 桌面软件',
            '💾 集成独立本地数据库，无需单独启动服务',
            '🔄 统一 Web 与桌面端 API 接口'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.1.6',
        content: [
            '🌐 界面汉化完善：本地服务器与云端同步面板全中文',
            '🔧 优化提示文案'
        ]
    },
    // ... (rest will be fetched or fallback to this hardcoded list)
    {
        date: '2026-02-02',
        version: '0.1.5',
        content: [
            '🌐 全面汉化：完成所有提示弹窗和按钮的中文翻译',
            '🐛 修复已知 Bug',
            '⚡ 优化用户体验'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.1.4',
        content: [
            '🔗 新增分享链接功能 (Share Link)',
            '☁️ 支持通过 URL 加载云端工作流',
            '🌍 修复 GitHub Pages 部署路径问题'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.1.3',
        content: [
            '🔐 优化 GitHub 登录体验',
            '🎨 全新设计的登录引导界面',
            '✨ 增加授权码自动获取引导'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.1.2',
        content: [
            '✨ 支持双击节点修改名称',
            '🗑️ 增加删除节点功能（选中后点击删除按钮）',
            '➕ 优化节点交互体验'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.1.0',
        content: [
            '✨ 新增云端同步功能 (GitHub Gist)',
            '🎨 界面右上角按钮中文化',
            '🔧 增加版本号和构建日期显示',
            '📝 增加开发日志功能'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.0.2',
        content: [
            '🚀 完成 Vercel 自动化部署配置',
            '📦 增加 JSON 导入导出功能',
            '💾 实现本地自动保存 (LocalStorage)'
        ]
    },
    {
        date: '2026-02-02',
        version: '0.0.1',
        content: [
            '🎉 初始化 CG 影视全流程工作流',
            '🎨 实现暗色模式与自定义节点样式',
            '🔗 支持无限画布与节点连线'
        ]
    }
];

// Cast to any to avoid strict type mismatch with NodeProps during build
const nodeTypes: any = {
  custom: CustomNode,
};

const defaultEdgeOptions = {
    style: { stroke: '#ff9900', strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff9900',
    },
};

const STORAGE_KEY_NODES = 'workflow-nodes';
const STORAGE_KEY_EDGES = 'workflow-edges';
 
const initialNodes: Node[] = [
  // --- Title ---
  { id: 'root', type: 'custom', position: { x: 600, y: -100 }, data: { label: 'CG影视全流程', color: '#ff9900' } },
 
  // --- Pre-production (前期) ---
  { id: 'pre-script', type: 'custom', position: { x: 0, y: 100 }, data: { label: '剧本 (Script)', subLabel: '大纲/剧本', color: '#ff5555' } },
  { id: 'pre-concept', type: 'custom', position: { x: 250, y: 100 }, data: { label: '概念设计 (Concept)', subLabel: '角色/场景/道具', color: '#ff5555' } },
  { id: 'pre-storyboard', type: 'custom', position: { x: 500, y: 100 }, data: { label: '分镜 (Storyboard)', color: '#ff5555' } },
  { id: 'pre-previs', type: 'custom', position: { x: 750, y: 100 }, data: { label: '预演 (Previs)', subLabel: '动态分镜', color: '#ff5555' } },

  // --- Assets (资产) ---
  // Modeling Group
  { id: 'asset-model', type: 'custom', position: { x: 100, y: 300 }, data: { label: '模型 (Modeling)', subLabel: '高模/低模/拓扑', color: '#55aaff' } },
  { id: 'asset-uv', type: 'custom', position: { x: 300, y: 300 }, data: { label: 'UV拆分', color: '#55aaff' } },
  { id: 'asset-texturing', type: 'custom', position: { x: 500, y: 300 }, data: { label: '材质/贴图 (Texturing)', subLabel: 'PBR流程', color: '#55aaff' } },
  { id: 'asset-lookdev', type: 'custom', position: { x: 700, y: 300 }, data: { label: '视觉开发 (LookDev)', color: '#55aaff' } },
  
  // Rigging Group
  { id: 'asset-rigging', type: 'custom', position: { x: 300, y: 400 }, data: { label: '绑定 (Rigging)', subLabel: '骨骼/权重/控制器', color: '#55aaff' } },
  { id: 'asset-groom', type: 'custom', position: { x: 300, y: 500 }, data: { label: '毛发 (Grooming)', subLabel: 'XGen/Yeti', color: '#55aaff' } },

  // --- Shot Production (中期制作) ---
  { id: 'prod-layout', type: 'custom', position: { x: 600, y: 600 }, data: { label: '布局 (Layout)', subLabel: '场景组装/相机', color: '#5555ff' } },
  { id: 'prod-anim', type: 'custom', position: { x: 600, y: 700 }, data: { label: '动画 (Animation)', subLabel: '关键帧/动捕', color: '#5555ff' } },
  
  // VFX/CFX
  { id: 'prod-cfx', type: 'custom', position: { x: 850, y: 700 }, data: { label: '角色特效 (CFX)', subLabel: '布料/毛发解算', color: '#5555ff' } },
  { id: 'prod-vfx', type: 'custom', position: { x: 850, y: 800 }, data: { label: '环境特效 (VFX)', subLabel: '流体/破碎/烟火', color: '#5555ff' } },

  // Lighting & Rendering
  { id: 'prod-light', type: 'custom', position: { x: 600, y: 900 }, data: { label: '灯光 (Lighting)', subLabel: '打光/气氛', color: '#5555ff' } },
  { id: 'prod-render', type: 'custom', position: { x: 600, y: 1000 }, data: { label: '渲染 (Rendering)', subLabel: '分层渲染', color: '#5555ff' } },

  // --- Post-production (后期) ---
  { id: 'post-comp', type: 'custom', position: { x: 600, y: 1200 }, data: { label: '合成 (Compositing)', subLabel: 'Nuke/AE', color: '#ffaa55' } },
  { id: 'post-edit', type: 'custom', position: { x: 850, y: 1200 }, data: { label: '剪辑 (Editing)', color: '#ffaa55' } },
  { id: 'post-grade', type: 'custom', position: { x: 600, y: 1300 }, data: { label: '调色 (Color Grade)', subLabel: 'Davinci', color: '#ffaa55' } },
  { id: 'post-sound', type: 'custom', position: { x: 350, y: 1200 }, data: { label: '音效/配乐 (Sound)', color: '#ffaa55' } },
  
  // Output
  { id: 'final', type: 'custom', position: { x: 600, y: 1450 }, data: { label: '最终成片 (Final)', color: '#00cc00' } },
];
 
const initialEdges: Edge[] = [
  // Pre-production
  { id: 'e-pre1', source: 'pre-script', target: 'pre-concept' },
  { id: 'e-pre2', source: 'pre-script', target: 'pre-storyboard' },
  { id: 'e-pre3', source: 'pre-concept', target: 'asset-model' }, // Concept -> Model
  { id: 'e-pre4', source: 'pre-storyboard', target: 'pre-previs' },
  { id: 'e-pre5', source: 'pre-previs', target: 'prod-layout' },

  // Assets Pipeline
  { id: 'e-asset1', source: 'asset-model', target: 'asset-uv' },
  { id: 'e-asset2', source: 'asset-uv', target: 'asset-texturing' },
  { id: 'e-asset3', source: 'asset-texturing', target: 'asset-lookdev' },
  
  { id: 'e-asset4', source: 'asset-model', target: 'asset-rigging' }, // Model -> Rig
  { id: 'e-asset5', source: 'asset-model', target: 'asset-groom' }, // Model -> Groom
  
  // Connection to Production
  { id: 'e-prod1', source: 'asset-lookdev', target: 'prod-light' }, // Lookdev -> Light
  { id: 'e-prod2', source: 'asset-rigging', target: 'prod-layout' }, // Rig -> Layout
  { id: 'e-prod3', source: 'asset-rigging', target: 'prod-anim' }, // Rig -> Anim
  { id: 'e-prod4', source: 'asset-groom', target: 'prod-cfx' }, // Groom -> CFX

  // Production Pipeline
  { id: 'e-prod5', source: 'prod-layout', target: 'prod-anim' },
  { id: 'e-prod6', source: 'prod-anim', target: 'prod-cfx' },
  { id: 'e-prod7', source: 'prod-anim', target: 'prod-vfx' },
  
  // Rendering
  { id: 'e-render1', source: 'prod-anim', target: 'prod-light' },
  { id: 'e-render2', source: 'prod-cfx', target: 'prod-light' },
  { id: 'e-render3', source: 'prod-vfx', target: 'prod-light' },
  { id: 'e-render4', source: 'prod-light', target: 'prod-render' },

  // Post Pipeline
  { id: 'e-post1', source: 'prod-render', target: 'post-comp' },
  { id: 'e-post2', source: 'post-comp', target: 'post-grade' },
  { id: 'e-post3', source: 'post-comp', target: 'post-edit' },
  { id: 'e-post4', source: 'post-sound', target: 'post-edit' },
  { id: 'e-post5', source: 'post-grade', target: 'final' },
  { id: 'e-post6', source: 'post-edit', target: 'final' },
];

const getSavedNodes = () => {
    const saved = localStorage.getItem(STORAGE_KEY_NODES);
    return saved ? JSON.parse(saved) : initialNodes;
};

const getSavedEdges = () => {
    const saved = localStorage.getItem(STORAGE_KEY_EDGES);
    return saved ? JSON.parse(saved) : initialEdges;
};
 
export default function Workflow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(getSavedNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getSavedEdges());
  
  // GitHub State
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [currentGistId, setCurrentGistId] = useState<string | null>(null);
  const [changelogData, setChangelogData] = useState<ChangelogItem[]>(changelog);

  // Fetch changelog from GitHub
  useEffect(() => {
    if (showChangelog) {
        githubService.fetchChangelog()
            .then(text => {
                const parsed: ChangelogItem[] = [];
                const lines = text.split('\n');
                let currentItem: ChangelogItem | null = null;
                
                for (const line of lines) {
                    const versionMatch = line.match(/^## v(\d+\.\d+\.\d+) \((.*)\)/);
                    if (versionMatch) {
                        if (currentItem) parsed.push(currentItem);
                        currentItem = {
                            version: versionMatch[1],
                            date: versionMatch[2],
                            content: []
                        };
                    } else if (line.trim().startsWith('-') && currentItem) {
                         // Extract content after "- "
                         currentItem.content.push(line.trim().substring(2));
                    }
                }
                if (currentItem) parsed.push(currentItem);
                
                if (parsed.length > 0) {
                    // Smart Merge: Combine local and remote, preferring local for same version or newer
                    // Create a map of version -> item
                    const mergedMap = new Map<string, ChangelogItem>();
                    
                    // Add local items first
                    changelog.forEach(item => mergedMap.set(item.version, item));
                    
                    // Add remote items (overwrite if needed, or keep local if we want local to be source of truth for dev)
                    // Actually, for "Developer Log", remote should be source of truth usually, 
                    // BUT in this case user is the dev. So local is newer.
                    // We will ONLY add remote items that are NOT in local.
                    parsed.forEach(item => {
                        if (!mergedMap.has(item.version)) {
                            mergedMap.set(item.version, item);
                        }
                    });

                    // Convert back to array and sort by version (descending)
                    const sorted = Array.from(mergedMap.values()).sort((a, b) => {
                        return b.version.localeCompare(a.version, undefined, { numeric: true });
                    });

                    setChangelogData(sorted);
                }
            })
            .catch(err => console.warn('Failed to fetch remote changelog, using local fallback', err));
    }
  }, [showChangelog]);

  // Check URL params for shared gist
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gistId = params.get('gist');
    if (gistId) {
        setLoading(true);
        githubService.loadGistById(gistId)
            .then(content => {
                const flow = JSON.parse(content);
                if (flow.nodes && flow.edges) {
                    setNodes(flow.nodes);
                    setEdges(flow.edges);
                    setCurrentGistId(gistId);
                }
            })
            .catch(err => {
                console.error(err);
                alert('❌ 加载共享工作流失败。');
            })
            .finally(() => setLoading(false));
    } else {
        // Init from localStorage
        const savedId = localStorage.getItem('workflow_gist_id');
        if (savedId) setCurrentGistId(savedId);
    }
  }, [setNodes, setEdges]);
  const [serverOnline, setServerOnline] = useState(false);

  // Check login status and server health on mount
  useEffect(() => {
      if (githubService.isLoggedIn()) {
          githubService.getUser()
              .then(setUser)
              .catch(() => githubService.logout());
      }
      checkServerHealth().then(setServerOnline);
  }, []);

  const onSaveToServer = useCallback(async () => {
      const name = prompt('请输入工作流名称:', '我的工作流');
      if (!name) return;
      
      setLoading(true);
      try {
          const flow = { nodes, edges };
          await saveWorkflowToServer(name, flow);
          alert('✅ 成功保存到本地服务器!');
      } catch (error) {
          console.error(error);
          alert('❌ 保存失败。服务器是否已启动？');
      } finally {
          setLoading(false);
      }
  }, [nodes, edges]);

  const onLoadFromServer = useCallback(async () => {
      setLoading(true);
      try {
          const workflows = await getWorkflowsFromServer();
          if (workflows.length === 0) {
              alert('服务器上没有找到已保存的工作流。');
              return;
          }
          
          // Simple selection via prompt for now (can be improved to a modal later)
          const list = workflows.map((w: any) => `${w.id}: ${w.name} (${new Date(w.updated_at).toLocaleString()})`).join('\n');
          const idStr = prompt(`请输入ID以加载:\n${list}`);
          if (!idStr) return;
          
          const id = parseInt(idStr);
          if (isNaN(id)) return;

          const workflow = await getWorkflowFromServer(id);
          if (workflow && workflow.data) {
             if (confirm(`加载 "${workflow.name}"? 这将覆盖当前画布。`)) {
                 setNodes(workflow.data.nodes);
                 setEdges(workflow.data.edges);
             }
          }
      } catch (error) {
          console.error(error);
          alert('❌ 加载失败。服务器是否已启动？');
      } finally {
          setLoading(false);
      }
  }, [setNodes, setEdges]);

  const onLogin = useCallback(async () => {
      if (!githubToken) return;
      setLoading(true);
      try {
          githubService.setToken(githubToken);
          const u = await githubService.getUser();
          setUser(u);
          setShowTokenInput(false);
          alert(`已登录: ${u.login}`);
      } catch (error) {
          console.error(error);
          alert('登录失败，请检查您的 Token。');
          githubService.logout();
      } finally {
          setLoading(false);
      }
  }, [githubToken]);

  const onLogout = useCallback(() => {
      githubService.logout();
      setUser(null);
      setGithubToken('');
  }, []);

  const onUploadToCloud = useCallback(async () => {
      if (!user) return;
      setLoading(true);
      try {
          const flow = { nodes, edges };
          const content = JSON.stringify(flow, null, 2);
          const id = await githubService.saveToGist(content);
          setCurrentGistId(id);
          alert('✅ Successfully uploaded to GitHub Gist!');
      } catch (error) {
          console.error(error);
          alert('❌ Upload failed.');
      } finally {
          setLoading(false);
      }
  }, [nodes, edges, user]);

  const onShare = useCallback(() => {
    if (!currentGistId) {
        alert('请先保存到云端！');
        return;
    }
    const url = `${window.location.origin}${window.location.pathname}?gist=${currentGistId}`;
    navigator.clipboard.writeText(url);
    alert('🔗 链接已复制！发给您的团队成员即可查看。');
  }, [currentGistId]);

  const onLoadFromCloud = useCallback(async () => {
      if (!user) return;
      if (!confirm('这将覆盖当前工作流。是否继续？')) return;
      
      setLoading(true);
      try {
          const content = await githubService.loadFromGist();
          const flow = JSON.parse(content);
          if (flow.nodes && flow.edges) {
              setNodes(flow.nodes);
              setEdges(flow.edges);
              alert('✅ 已从云端加载工作流！');
          }
      } catch (error) {
          console.error(error);
          alert('❌ 从云端加载失败。（可能还没有备份？）');
      } finally {
          setLoading(false);
      }
  }, [user, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onAddNode = useCallback(() => {
    const id = `${new Date().getTime()}`;
    const newNode: Node = {
      id,
      type: 'custom',
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      data: { 
        label: 'New Node', 
        color: '#ffffff' 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onDeleteSelected = useCallback(() => {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const onReset = useCallback(() => {
      if (confirm('Are you sure you want to reset the workflow? This will delete all current changes.')) {
          setNodes(initialNodes);
          setEdges(initialEdges);
          localStorage.removeItem(STORAGE_KEY_NODES);
          localStorage.removeItem(STORAGE_KEY_EDGES);
      }
  }, [setNodes, setEdges]);

  const onSave = useCallback(() => {
      const flow = { nodes, edges };
      const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workflow-backup.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }, [nodes, edges]);

  const onImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const flow = JSON.parse(content);
              
              if (flow.nodes && flow.edges) {
                  setNodes(flow.nodes);
                  setEdges(flow.edges);
                  alert('工作流导入成功！');
              } else {
                  alert('文件格式无效：缺少节点或连线');
              }
          } catch (error) {
              console.error('Error parsing JSON:', error);
              alert('导入文件出错：无效的 JSON');
          }
      };
      reader.readAsText(file);
      // Reset input value so same file can be selected again
      event.target.value = '';
  }, [setNodes, setEdges]);

  // Save to localStorage whenever nodes or edges change
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
      localStorage.setItem(STORAGE_KEY_EDGES, JSON.stringify(edges));
  }, [nodes, edges]);
 
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1e1e1e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        colorMode="dark"
        fitView
      >
        <Controls />
        <MiniMap 
            nodeStrokeColor={(n) => {
                if (n.type === 'custom') return n.data.color as string || '#eee';
                return '#eee';
            }} 
            nodeColor="#333" 
            maskColor="rgba(0,0,0, 0.7)" 
            style={{ backgroundColor: '#1a1a1a' }}
        />
        <Background variant={BackgroundVariant.Lines} color="#333" gap={20} />
        <Panel position="top-right" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onAddNode} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#4CAF50', color: 'white', fontWeight: 'bold' }}>
                添加节点
            </button>
            <button onClick={onDeleteSelected} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#e53935', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Trash2 size={16} /> 删除选中
            </button>
            <button onClick={onSave} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#2196F3', color: 'white', fontWeight: 'bold' }}>
                导出文件
            </button>
            <label style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#FF9800', color: 'white', fontWeight: 'bold', display: 'inline-block' }}>
                导入文件
                <input type="file" onChange={onImport} accept=".json" style={{ display: 'none' }} />
            </label>
            <button onClick={onReset} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#f44336', color: 'white', fontWeight: 'bold' }}>
                重置画布
            </button>
            <button onClick={() => setShowChangelog(true)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#555', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <History size={16} /> 开发日志
            </button>
        </Panel>

        <Panel position="top-left" style={{ display: 'flex', gap: '10px', flexDirection: 'column', background: '#252525', padding: '10px', borderRadius: '8px', border: '1px solid #444' }}>
            <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Server size={16} /> 本地服务器
                    </div>
                    <span style={{ fontSize: '10px', color: serverOnline ? '#4CAF50' : '#f44336' }}>
                        {serverOnline ? '● 在线' : '● 离线'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={onSaveToServer} disabled={!serverOnline || loading} title="保存到本地服务器" style={{ flex: 1, padding: '6px', cursor: serverOnline ? 'pointer' : 'not-allowed', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: serverOnline ? 1 : 0.5 }}>
                        <UploadCloud size={16} />
                    </button>
                    <button onClick={onLoadFromServer} disabled={!serverOnline || loading} title="从本地服务器加载" style={{ flex: 1, padding: '6px', cursor: serverOnline ? 'pointer' : 'not-allowed', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: serverOnline ? 1 : 0.5 }}>
                        <Database size={16} />
                    </button>
                </div>
            </div>

            <div style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Github size={16} /> 云端同步 (GitHub)
            </div>
            
            {!user ? (
                <>
                    <button 
                        onClick={() => setShowTokenInput(true)}
                        style={{ 
                            padding: '10px 16px', 
                            cursor: 'pointer', 
                            borderRadius: '6px', 
                            border: '1px solid #444', 
                            background: '#24292e', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            width: '100%',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#2f363d'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#24292e'}
                    >
                        <Github size={18} /> 连接 GitHub 账户
                    </button>

                    {showTokenInput && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                backgroundColor: '#2d333b',
                                width: '400px',
                                borderRadius: '8px',
                                padding: '24px',
                                border: '1px solid #444',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                color: '#eee',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Github size={24} /> 连接到 GitHub
                                    </h2>
                                    <X size={20} cursor="pointer" onClick={() => setShowTokenInput(false)} />
                                </div>

                                <div style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.5' }}>
                                    为了将您的工作流保存到云端，我们需要一个安全访问令牌。
                                    我们使用 <b>GitHub Gists</b> 来私密存储您的数据。
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ background: '#222', padding: '15px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>第一步：授权</div>
                                        <a 
                                            href="https://github.com/settings/tokens/new?scopes=gist&description=AI_Workflow_Cloud_Sync" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                gap: '8px',
                                                padding: '10px', 
                                                background: '#28a745', 
                                                color: 'white', 
                                                borderRadius: '6px', 
                                                textDecoration: 'none',
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}
                                        >
                                            生成令牌 <ExternalLink size={14} />
                                        </a>
                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                            * 将在新标签页打开。向下滚动并点击“Generate token”。
                                        </div>
                                    </div>

                                    <div style={{ background: '#222', padding: '15px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>第二步：粘贴令牌</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1a1a', padding: '8px', borderRadius: '4px', border: '1px solid #444' }}>
                                            <KeyRound size={16} color="#666" />
                                            <input 
                                                type="password" 
                                                placeholder="ghp_xxxxxxxxxxxx" 
                                                value={githubToken}
                                                onChange={(e) => setGithubToken(e.target.value)}
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    color: 'white', 
                                                    width: '100%', 
                                                    outline: 'none',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={onLogin} 
                                    disabled={loading || !githubToken} 
                                    style={{ 
                                        padding: '12px', 
                                        cursor: githubToken ? 'pointer' : 'not-allowed', 
                                        background: githubToken ? '#2196F3' : '#444', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '6px', 
                                        fontWeight: 'bold',
                                        opacity: loading ? 0.7 : 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18}/> : '连接账户'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '12px' }}>
                        <img src={user.avatar_url} alt={user.login} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                        {user.login}
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={onUploadToCloud} disabled={loading} title="保存到云端" style={{ flex: 1, padding: '6px', cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <UploadCloud size={16} />}
                        </button>
                        <button onClick={onLoadFromCloud} disabled={loading} title="从云端加载" style={{ flex: 1, padding: '6px', cursor: 'pointer', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                             {loading ? <Loader2 className="animate-spin" size={16}/> : <DownloadCloud size={16} />}
                        </button>
                        <button onClick={onShare} title="分享链接" style={{ padding: '6px', cursor: 'pointer', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Share2 size={16} />
                        </button>
                        <button onClick={onLogout} title="退出登录" style={{ padding: '6px', cursor: 'pointer', background: '#444', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            )}
        </Panel>

        {/* Version Info */}
        <Panel position="bottom-right" style={{ color: '#555', fontSize: '10px', pointerEvents: 'none', userSelect: 'none' }}>
            v{__APP_VERSION__} ({__COMMIT_HASH__}) - {__BUILD_DATE__}
        </Panel>

        {/* Changelog Modal */}
        {showChangelog && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{
                    backgroundColor: '#252525',
                    width: '500px',
                    maxHeight: '80vh',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #444',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    color: '#eee',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History /> 开发日志
                        </h2>
                        <button 
                            onClick={() => setShowChangelog(false)}
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '5px' }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '5px' }}>
                        {changelogData.map((item, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '1.1em' }}>v{item.version}</span>
                                    <span style={{ color: '#888', fontSize: '0.9em' }}>{item.date}</span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc' }}>
                                    {item.content.map((line, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>{line}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ borderTop: '1px solid #444', paddingTop: '10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        CG影视全流程工作流
                    </div>
                </div>
            </div>
        )}
      </ReactFlow>
    </div>
  );
}
