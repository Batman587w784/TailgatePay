'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Topbar() {
  const [orgName, setOrgName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || user.phone || '')
      const { data: org } = await supabase
        .from('orgs')
        .select('name')
        .eq('owner_id', user.id)
        .single()
      if (org) setOrgName(org.name)
    }
    load()
  }, [])

  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        {orgName && (
          <span className="text-sm font-semibold text-[#0D1F6E]">{orgName}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{userEmail}</span>
        <div className="w-8 h-8 bg-[#0D1F6E] rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {userEmail?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </div>
  )
}