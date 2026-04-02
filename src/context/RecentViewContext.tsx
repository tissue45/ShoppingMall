import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { Product } from '../types'
import { useUser } from './UserContext'
import { 
  getUserRecentViews, 
  addRecentView, 
  removeRecentView, 
  clearUserRecentViews 
} from '../services/recentViewService'

interface RecentViewContextType {
  recentItems: Product[]
  addToRecent: (product: Product) => void
  removeFromRecent: (productId: number) => void
  clearRecent: () => void
  getRecentCount: () => number
  loading: boolean
}

const RecentViewContext = createContext<RecentViewContextType | undefined>(undefined)

export const useRecentViewContext = () => {
  const context = useContext(RecentViewContext)
  if (!context) {
    throw new Error('useRecentViewContext must be used within a RecentViewProvider')
  }
  return context
}

interface RecentViewProviderProps {
  children: ReactNode
}

export const RecentViewProvider: React.FC<RecentViewProviderProps> = ({ children }) => {
  const { currentUser } = useUser()
  const [recentItems, setRecentItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  // 사용자별 최근 본 상품 목록 로드 (데이터베이스에서)
  useEffect(() => {
    const loadRecentViews = async () => {
      if (currentUser?.id) {
        setLoading(true)
        try {
          const recentViews = await getUserRecentViews(currentUser.id)
          setRecentItems(recentViews)
        } catch (error) {
          console.error('Failed to load recent views:', error)
          setRecentItems([])
        } finally {
          setLoading(false)
        }
      } else {
        setRecentItems([])
      }
    }

    loadRecentViews()
  }, [currentUser])

  const addToRecent = useCallback(async (product: Product) => {
    const uid = currentUser?.id
    if (!uid) return

    try {
      const success = await addRecentView(uid, product.id)
      if (success) {
        const updatedRecentViews = await getUserRecentViews(uid)
        setRecentItems(updatedRecentViews)
      }
    } catch (error) {
      console.error('Failed to add to recent views:', error)
    }
  }, [currentUser?.id])

  const removeFromRecent = useCallback(async (productId: number) => {
    const uid = currentUser?.id
    if (!uid) return

    try {
      const success = await removeRecentView(uid, productId)
      if (success) {
        setRecentItems(prev => prev.filter(item => item.id !== productId))
      }
    } catch (error) {
      console.error('Failed to remove from recent views:', error)
    }
  }, [currentUser?.id])

  const clearRecent = useCallback(async () => {
    const uid = currentUser?.id
    if (!uid) return

    try {
      const success = await clearUserRecentViews(uid)
      if (success) {
        setRecentItems([])
      }
    } catch (error) {
      console.error('Failed to clear recent views:', error)
    }
  }, [currentUser?.id])

  const getRecentCount = useCallback(() => recentItems.length, [recentItems])

  const value: RecentViewContextType = useMemo(
    () => ({
      recentItems,
      addToRecent,
      removeFromRecent,
      clearRecent,
      getRecentCount,
      loading,
    }),
    [recentItems, addToRecent, removeFromRecent, clearRecent, getRecentCount, loading],
  )

  return (
    <RecentViewContext.Provider value={value}>
      {children}
    </RecentViewContext.Provider>
  )
}