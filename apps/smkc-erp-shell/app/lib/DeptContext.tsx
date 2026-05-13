'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

export interface DeptConfig {
  deptCode: number
  routeKey: string
  nameEn: string
  nameMr: string
  icon: string
  color: string
  colorBg: string
  displayOrder: number
}

interface DeptContextValue {
  depts: DeptConfig[]
  loading: boolean
  getDept: (routeKey: string) => DeptConfig | undefined
}

const DeptContext = createContext<DeptContextValue>({
  depts: [],
  loading: true,
  getDept: () => undefined,
})

export function DeptProvider({ children }: { children: ReactNode }) {
  const [depts, setDepts] = useState<DeptConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/departments/active', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: DeptConfig[] }) => {
        if (json.success && json.data) setDepts(json.data)
      })
      .catch(() => {
        /* silently fail — home page falls back to DEPARTMENTS constant */
      })
      .finally(() => setLoading(false))
  }, [])

  const getDept = useCallback(
    (routeKey: string) => depts.find((d) => d.routeKey === routeKey),
    [depts]
  )

  return (
    <DeptContext.Provider value={{ depts, loading, getDept }}>
      {children}
    </DeptContext.Provider>
  )
}

export function useDepts() {
  return useContext(DeptContext)
}
