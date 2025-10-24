// src/app/secret-page-1/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SecretPage1() {
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data } = await supabase
        .from('secret_messages')
        .select('message')
        .eq('user_id', user.id)
        .eq('page_number', 1)
        .single()

      if (data) {
        setMessage(data.message)
      }
    }
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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800 hover:text-indigo-600">
                Secret Pages App
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Page 1</span>
            </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Secret Page 1</h1>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Your Secret Message:</h2>
            {message ? (
              <p className="text-gray-800 text-lg italic">"{message}"</p>
            ) : (
              <p className="text-gray-500 italic">No secret message yet. Visit Secret Page 2 to add one!</p>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/secret-page-2"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Page 2
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}