// src/app/secret-page-2/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SecretPage2() {
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<string>('')
  const [inputMessage, setInputMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        .eq('page_number', 2)
        .single()

      if (data) {
        setMessage(data.message)
        setInputMessage(data.message)
      }
    }
    setLoading(false)
  }

  const handleSaveMessage = async () => {
    if (!inputMessage.trim()) {
      alert('Please enter a message')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('secret_messages')
        .upsert({
          user_id: user.id,
          page_number: 2,
          message: inputMessage,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMessage(inputMessage)
      alert('Message saved successfully!')
    } catch (error: any) {
      alert('Error saving message: ' + error.message)
    } finally {
      setSaving(false)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800 hover:text-purple-600">
                Secret Pages App
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Page 2</span>
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
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Secret Page 2</h1>
          
          {message && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Current Secret Message:</h2>
              <p className="text-gray-800 text-lg italic">"{message}"</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-lg font-semibold mb-2 text-gray-700">
                {message ? 'Update Your Secret Message:' : 'Add Your Secret Message:'}
              </label>
              <textarea
                id="message"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your secret message here..."
              />
            </div>

            <button
              onClick={handleSaveMessage}
              disabled={saving}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : message ? 'Update Message' : 'Save Message'}
            </button>
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/secret-page-3"
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
            >
              Go to Page 3
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}