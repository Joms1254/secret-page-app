// src/app/secret-page-3/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
}

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  sender?: Profile [];
  receiver?: Profile [];
}

interface FriendMessage {
  user_id: string
  message: string
  email: string
}

export default function SecretPage3() {
  const [user, setUser] = useState<any>(null)
  const [myMessage, setMyMessage] = useState<string>('')
  const [inputMessage, setInputMessage] = useState<string>('')
  const [friendEmail, setFriendEmail] = useState<string>('')
  const [friends, setFriends] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [friendMessages, setFriendMessages] = useState<FriendMessage[]>([])
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
      // Load user's message
      const { data: messageData } = await supabase
        .from('secret_messages')
        .select('message')
        .eq('user_id', user.id)
        .eq('page_number', 3)
        .single()

      if (messageData) {
        setMyMessage(messageData.message)
        setInputMessage(messageData.message)
      }

      // Load friends and friend requests
      await loadFriends(user.id)
    }
    setLoading(false)
  }

  const loadFriends = async (userId: string) => {
    // Get accepted friends
    const { data: friendRequestsData } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        sender:sender_id(id, email),
        receiver:receiver_id(id, email)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (friendRequestsData) {
      const friendsList = friendRequestsData.map((req: any) => {
        if (req.sender_id === userId) {
          return req.receiver
        } else {
          return req.sender
        }
      })
      setFriends(friendsList)

      // Load friends' messages
      const friendIds = friendsList.map((f: Profile) => f.id)
      if (friendIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('secret_messages')
          .select(`
            user_id,
            message,
            profiles:user_id(email)
          `)
          .eq('page_number', 3)
          .in('user_id', friendIds)

        if (messagesData) {
          const formattedMessages = messagesData.map((m: any) => ({
            user_id: m.user_id,
            message: m.message,
            email: m.profiles.email
          }))
          setFriendMessages(formattedMessages)
        }
      }
    }

    // Get pending requests (received)
    const { data: pendingData } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        sender:sender_id(id, email)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    if (pendingData) {
      setPendingRequests(pendingData)
    }

    // Get sent requests
    const { data: sentData } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        receiver:receiver_id(id, email)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending')

    if (sentData) {
      setSentRequests(sentData)
    }
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
          page_number: 3,
          message: inputMessage,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMyMessage(inputMessage)
      alert('Message saved successfully!')
    } catch (error: any) {
      alert('Error saving message: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!friendEmail.trim()) {
      alert('Please enter an email')
      return
    }

    try {
      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', friendEmail.toLowerCase())
        .single()

      if (profileError || !profileData) {
        alert('User not found')
        return
      }

      if (profileData.id === user.id) {
        alert('You cannot send a friend request to yourself')
        return
      }

      // Check if already friends or request exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileData.id}),and(sender_id.eq.${profileData.id},receiver_id.eq.${user.id})`)
        .single()

      if (existingRequest) {
        alert('Friend request already exists or you are already friends')
        return
      }

      // Send friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: profileData.id,
          status: 'pending',
        })

      if (error) throw error

      alert('Friend request sent!')
      setFriendEmail('')
      await loadFriends(user.id)
    } catch (error: any) {
      alert('Error sending friend request: ' + error.message)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error

      alert('Friend request accepted!')
      await loadFriends(user.id)
    } catch (error: any) {
      alert('Error accepting request: ' + error.message)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      alert('Friend request rejected')
      await loadFriends(user.id)
    } catch (error: any) {
      alert('Error rejecting request: ' + error.message)
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
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-rose-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800 hover:text-pink-600">
                Secret Pages App
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Page 3</span>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Secret Page 3 - Friends & Secrets</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - My Message */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">My Secret Message</h2>
              
              {myMessage && (
                <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-lg mb-4">
                  <p className="text-gray-800 italic">"{myMessage}"</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  {myMessage ? 'Update Message:' : 'Add Message:'}
                </label>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your secret message..."
                />
                <button
                  onClick={handleSaveMessage}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : myMessage ? 'Update Message' : 'Save Message'}
                </button>
              </div>
            </div>

            {/* Add Friends */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Friends</h2>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Friend's Email:
                </label>
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="friend@example.com"
                />
                <button
                  onClick={handleSendFriendRequest}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Send Friend Request
                </button>
              </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Pending Requests</h2>
                <div className="space-y-3">
                  {pendingRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">{request.sender.email}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Sent Requests</h2>
                <div className="space-y-2">
                  {sentRequests.map((request: any) => (
                    <div key={request.id} className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">{request.receiver.email}</span>
                      <span className="text-sm text-gray-500 ml-2">(Pending)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Friends' Messages */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Friends</h2>
              {friends.length === 0 ? (
                <p className="text-gray-500 italic">No friends yet. Add friends to share secrets!</p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="bg-green-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">{friend.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Friends' Secret Messages</h2>
              {friendMessages.length === 0 ? (
                <p className="text-gray-500 italic">No messages from friends yet.</p>
              ) : (
                <div className="space-y-4">
                  {friendMessages.map((msg) => (
                    <div key={msg.user_id} className="bg-linear-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-600 mb-1">{msg.email}</p>
                      <p className="text-gray-800 italic">"{msg.message}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}