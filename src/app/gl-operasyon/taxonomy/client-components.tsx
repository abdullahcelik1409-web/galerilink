'use client'

import { useState, useEffect } from "react"
import { 
  ChevronRight, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  ArrowLeft, 
  Box, 
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getNodes, addNode, updateNode, deleteNode, bulkAddNodes } from "./actions"
import { toast } from "sonner"

const LEVELS = [
  'kategori', 'yil', 'marka', 'seri', 'yakit', 'kasa', 'sanziman', 'motor', 'paket'
]

const LEVEL_LABELS: Record<string, string> = {
  kategori: 'Kategori',
  yil: 'Yıl',
  marka: 'Marka',
  seri: 'Seri / Model',
  yakit: 'Yakıt',
  kasa: 'Kasa',
  sanziman: 'Şanzıman',
  motor: 'Motor',
  paket: 'Paket / Donanım'
}

export function TaxonomyStudio() {
  const [path, setPath] = useState<any[]>([])
  const [nodes, setNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [newNodeName, setNewNodeName] = useState("")
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkData, setBulkData] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const currentLevelIndex = path.length
  const currentLevel = LEVELS[currentLevelIndex] || 'paket'
  const currentParentId = path.length > 0 ? path[path.length - 1].id : null

  useEffect(() => {
    fetchNodes()
  }, [path])

  async function fetchNodes() {
    setLoading(true)
    try {
      const data = await getNodes(currentLevel, currentParentId)
      setNodes(data)
    } catch (err) {
      toast.error("Veriler yüklenirken hata oluştu.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

   async function handleAddNode() {
    console.log("handleAddNode tetiklendi. Mod:", isBulkMode ? "Toplu" : "Tekli")
    
    if (isBulkMode) {
      console.log("Toplu veri:", bulkData)
      const names = bulkData.split('\n').map(n => n.trim()).filter(n => n.length > 0)
      console.log("Ayıklanan isimler:", names)
      
      if (names.length === 0) {
        console.warn("Liste boş, işlem durduruldu.")
        return
      }
      
      setActionLoading(true)
      try {
        console.log("bulkAddNodes çağrılıyor...")
        const result = await bulkAddNodes(names, currentLevel, currentParentId)
        console.log("İşlem sonucu:", result)
        toast.success(`${names.length} öğe işlendi.`)
        setBulkData("")
        setIsAddModalOpen(false)
        fetchNodes()
      } catch (err) {
        console.error("Toplu ekleme hatası:", err)
        toast.error("Toplu ekleme sırasında hata oluştu.")
      } finally {
        setActionLoading(false)
      }
      return
    }

    if (!newNodeName.trim()) return
    setActionLoading(true)
    try {
      console.log("Tekli ekleme çağrılıyor:", newNodeName)
      await addNode(newNodeName, currentLevel, currentParentId)
      toast.success(`${newNodeName} başarıyla eklendi.`)
      setNewNodeName("")
      setIsAddModalOpen(false)
      fetchNodes()
    } catch (err) {
      console.error("Ekleme hatası:", err)
      toast.error("Ekleme sırasında bir hata oluştu.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUpdateNode() {
    if (!newNodeName.trim() || !selectedNode) return
    setActionLoading(true)
    try {
      await updateNode(selectedNode.id, newNodeName)
      toast.success("Kayıt güncellendi.")
      setNewNodeName("")
      setIsEditModalOpen(false)
      setSelectedNode(null)
      fetchNodes()
    } catch (err) {
      toast.error("Güncelleme hatası.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteNode() {
    if (!selectedNode) return
    setActionLoading(true)
    try {
      await deleteNode(selectedNode.id)
      toast.success("Kayıt silindi.")
      setIsDeleteModalOpen(false)
      setSelectedNode(null)
      fetchNodes()
    } catch (err: any) {
      toast.error(err?.message || "Silme hatası. Bağlantılı veriler olabilir.")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredNodes = nodes.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleStepInto = (node: any) => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setPath([...path, node])
      setSearchTerm("")
    }
  }

  const handleGoBack = () => {
    setPath(path.slice(0, -1))
    setSearchTerm("")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 🧭 Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#080808]/50 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
              {path.length > 0 && (
                <button onClick={handleGoBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-white/40 overflow-x-auto no-scrollbar max-w-[500px]">
                 <span className="text-primary">VASITA</span>
                 {path.map((p, i) => (
                   <div key={p.id} className="flex items-center gap-2">
                     <ChevronRight className="w-3 h-3 text-white/20" />
                     <span className={cn(i === path.length - 1 ? "text-white" : "text-white/40")}>{p.name}</span>
                   </div>
                 ))}
              </div>
           </div>
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
             {LEVEL_LABELS[currentLevel]} <span className="text-white/30 text-xl">({nodes.length})</span>
           </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-12 rounded-xl bg-white/5 border-white/10 pl-12 focus:border-primary/50 text-white placeholder:text-white/20" 
            />
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)] gap-2">
                <Plus className="w-4 h-4" strokeWidth={3} />
                EKLE
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border border-white/20 text-white rounded-[2rem]">
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter italic">YENİ {LEVEL_LABELS[currentLevel]}</DialogTitle>
                  <DialogDescription className="text-[10px] text-white/20 uppercase tracking-widest">Hiyerarşiye yeni öğeler ekleyin.</DialogDescription>
               </DialogHeader>
               <div className="py-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                     <div className="space-y-0.5">
                        <Label className="text-sm font-black italic uppercase tracking-tighter">TOPLU EKLEME MODU</Label>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Alt alta yapıştırarak toplu işlem yapın</p>
                     </div>
                     <Switch checked={isBulkMode} onCheckedChange={setIsBulkMode} />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                       {isBulkMode ? "İsim Listesi (Satır Satır)" : "İsim / Tanım"}
                     </label>
                     {isBulkMode ? (
                        <Textarea 
                          value={bulkData}
                          onChange={(e) => setBulkData(e.target.value)}
                          placeholder={`Örn:\nGolf\nPassat\nPolo`}
                          className="min-h-[200px] bg-white/5 border-white/10 rounded-2xl text-lg font-bold placeholder:italic"
                        />
                     ) : (
                        <Input 
                          value={newNodeName}
                          onChange={(e) => setNewNodeName(e.target.value)}
                          placeholder={`Örn: ${currentLevel === 'yil' ? '2024' : currentLevel === 'marka' ? 'BMW' : 'Yeni Kayıt'}`}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold"
                        />
                     )}
                  </div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed">
                    * {path.length > 0 ? `${path[path.length-1].name} altına otomatik olarak eklenecektir.` : "Root seviyesine eklenecektir."}
                  </p>
               </div>
               <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50"
                  >
                    İPTAL
                  </Button>
                  <Button 
                    onClick={handleAddNode}
                    disabled={actionLoading || (isBulkMode ? !bulkData.trim() : !newNodeName.trim())}
                    className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "KAYDET"}
                  </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 📊 Nodes Grid/List */}
      <div className="bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-40">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
            <span className="text-xs font-black uppercase tracking-[0.4em] italic text-white">Veriler Taranıyor</span>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20 italic">
            <Box className="w-16 h-16" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Bulunamadı</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  <th className="px-8 py-6">KİMLİK / İSİM</th>
                  <th className="px-8 py-6">SLUG</th>
                  <th className="px-8 py-6">DURUM</th>
                  <th className="px-8 py-6 text-right">EYLEMLER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredNodes.map((node) => (
                  <tr key={node.id} className="group hover:bg-white/[0.04] transition-all duration-200">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                           <span className="text-xs font-black text-white/40">{node.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <button 
                            onClick={() => handleStepInto(node)}
                            className="text-lg font-black uppercase tracking-tight text-white hover:text-primary transition-colors flex items-center gap-2 leading-none"
                            disabled={currentLevelIndex >= LEVELS.length - 1}
                          >
                            {node.name}
                            {currentLevelIndex < LEVELS.length - 1 && <ChevronRight className="w-4 h-4 opacity-30" />}
                          </button>
                          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">
                             ID: <span className="text-white/40">{node.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-[10px] font-technical text-white/40 bg-white/5 px-2 py-1 rounded-md">{node.slug}</code>
                    </td>
                    <td className="px-8 py-6">
                       <Badge variant="outline" className={cn(
                         "text-[8px] font-black uppercase border-white/20 text-white/70",
                         node.status === 'approved' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                       )}>
                         {node.status === 'approved' ? 'AKTİF' : 'ONAY BEKLİYOR'}
                       </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedNode(node); setNewNodeName(node.name); setIsEditModalOpen(true) }}
                          className="w-10 h-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedNode(node); setIsDeleteModalOpen(true) }}
                          className="w-10 h-10 rounded-xl hover:bg-red-500/20 text-white/40 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📝 Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-white/20 text-white rounded-[2rem]">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">KAYDI GÜNCELLE</DialogTitle>
           </DialogHeader>
           <div className="py-6 space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Yeni İsim</label>
                 <Input 
                   value={newNodeName}
                   onChange={(e) => setNewNodeName(e.target.value)}
                   className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold"
                 />
              </div>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>İPTAL</Button>
              <Button onClick={handleUpdateNode} disabled={actionLoading} className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase">
                 {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GÜNCELLE"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ⚠️ Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-red-500/20 text-white rounded-[2rem]">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-red-500 flex items-center gap-3">
                 <AlertCircle className="w-6 h-6" />
                 SİLME ONAYI
              </DialogTitle>
           </DialogHeader>
           <div className="py-6">
              <p className="text-sm font-bold text-white/70 leading-relaxed uppercase">
                <span className="text-white">"{selectedNode?.name}"</span> kaydını silmek üzeresiniz. 
                Bu işlem geri alınamaz ve bu kayda bağlı olan tüm alt modeller/paketler hiyerarşiden düşebilir.
              </p>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>VAZGEÇ</Button>
              <Button onClick={handleDeleteNode} disabled={actionLoading} variant="destructive" className="h-14 px-8 rounded-2xl font-black uppercase">
                 {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "KALICI OLARAK SİL"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
