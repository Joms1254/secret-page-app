// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      return
    }

    try {
      // Delete user profile (cascade will delete messages and friend requests)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      // Sign out
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error: any) {
      alert('Error deleting account: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Secret Pages App</h1>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Logout
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Welcome, {user?.email}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/secret-page-1"
              className="bg-linear-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md"
            >
              <h3 className="text-2xl font-bold mb-2">Secret Page 1</h3>
              <p className="text-blue-100">View your secret message</p>
            </Link>

            <Link
              href="/secret-page-2"
              className="bg-linear-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition shadow-md"
            >
              <h3 className="text-2xl font-bold mb-2">Secret Page 2</h3>
              <p className="text-purple-100">Add and edit your secret message</p>
            </Link>

            <Link
              href="/secret-page-3"
              className="bg-linear-to-br from-pink-500 to-pink-600 text-white p-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition shadow-md"
            >
              <h3 className="text-2xl font-bold mb-2">Secret Page 3</h3>
              <p className="text-pink-100">Connect with friends and share secrets</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}