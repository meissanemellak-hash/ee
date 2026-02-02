'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Edit, Save, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import type { InventoryItem } from '@/lib/react-query/hooks/use-inventory'
import type { Ingredient } from '@/lib/react-query/hooks/use-ingredients'
import type { UseMutationResult } from '@tanstack/react-query'

type StatusType = 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCK'

export interface InventoryTableProps {
  inventory: InventoryItem[]
  ingredients: Ingredient[]
  editingId: string | null
  formData: { ingredientId: string; currentStock: string; minThreshold: string; maxThreshold: string }
  setFormData: React.Dispatch<React.SetStateAction<{ ingredientId: string; currentStock: string; minThreshold: string; maxThreshold: string }>>
  getStatus: (item: InventoryItem) => StatusType
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  onEdit: (item: InventoryItem) => void
  onSave: (itemId?: string) => void
  onCancel: () => void
  setDeletingId: (id: string | null) => void
  updateMutation: UseMutationResult<InventoryItem, Error, { id: string; restaurantId: string; data: { currentStock: number; minThreshold: number; maxThreshold: number | null } }, unknown>
  canEdit: boolean
}

export function InventoryTable({
  inventory,
  ingredients,
  editingId,
  formData,
  setFormData,
  getStatus,
  getStatusColor,
  getStatusLabel,
  onEdit,
  onSave,
  onCancel,
  setDeletingId,
  updateMutation,
  canEdit,
}: InventoryTableProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden" role="region" aria-labelledby="inventory-title">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Liste des stocks d'inventaire">
          <thead className="bg-muted/50 dark:bg-gray-800/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Ingrédient</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Stock actuel</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Seuil min</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Seuil max</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Statut</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Dernière mise à jour</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const isEditing = editingId === item.id
              const status = getStatus(item)
              const currentFormData = isEditing ? formData : {
                ingredientId: item.ingredientId,
                currentStock: item.currentStock.toString(),
                minThreshold: item.minThreshold.toString(),
                maxThreshold: item.maxThreshold?.toString() || '',
              }
              return (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/30 dark:hover:bg-gray-800/50 transition-colors ${isEditing ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                >
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <Select value={currentFormData.ingredientId} onValueChange={(v) => setFormData((p) => ({ ...p, ingredientId: v }))}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.isArray(ingredients) && ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{item.ingredient.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {isEditing ? (
                      <Input type="number" step="0.01" value={currentFormData.currentStock} onChange={(e) => setFormData((p) => ({ ...p, currentStock: e.target.value }))} className="w-28" />
                    ) : (
                      <span className="font-medium">{item.currentStock} {item.ingredient.unit}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {isEditing ? (
                      <Input type="number" step="0.01" value={currentFormData.minThreshold} onChange={(e) => setFormData((p) => ({ ...p, minThreshold: e.target.value }))} className="w-28" />
                    ) : (
                      <span className="text-muted-foreground">{item.minThreshold} {item.ingredient.unit}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {isEditing ? (
                      <Input type="number" step="0.01" value={currentFormData.maxThreshold} onChange={(e) => setFormData((p) => ({ ...p, maxThreshold: e.target.value }))} className="w-28" placeholder="Optionnel" />
                    ) : (
                      <span className="text-muted-foreground">{item.maxThreshold ? `${item.maxThreshold} ${item.ingredient.unit}` : '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {!isEditing && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status === 'OK' && <CheckCircle2 className="h-3 w-3" />}
                        {status === 'LOW' && <AlertTriangle className="h-3 w-3" />}
                        {status === 'CRITICAL' && <AlertTriangle className="h-3 w-3" />}
                        {status === 'OVERSTOCK' && <TrendingUp className="h-3 w-3" />}
                        {getStatusLabel(status)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-sm">
                    {new Date(item.lastUpdated).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => onSave(item.id)} disabled={updateMutation.isPending && updateMutation.variables?.id === item.id} className="shadow-sm">
                            {updateMutation.isPending && updateMutation.variables?.id === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={onCancel} className="shadow-sm"><X className="h-4 w-4" /></Button>
                        </>
                      ) : canEdit ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-700" aria-label={`Modifier l'inventaire de ${item.ingredient.name}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeletingId(item.id)} className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400" aria-label={`Supprimer l'inventaire de ${item.ingredient.name}`}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
