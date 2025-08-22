"use client"

import { ArrowUp, Rocket } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"

type Msg = {
  id: number
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatApp() {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeySaved, setIsApiKeySaved] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedKey = sessionStorage.getItem("pplx_key")
    if (savedKey) {
      setApiKey(savedKey)
      setIsApiKeySaved(true)
    }
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem("pplx_key", apiKey)
      setIsApiKeySaved(true)
      setShowApiKeyInput(false)
    }
  }

  const clearApiKey = () => {
    sessionStorage.removeItem("pplx_key")
    setApiKey("")
    setIsApiKeySaved(false)
  }

  const sendMessage = async () => {
    if (!currentInput.trim() || !isApiKeySaved || isLoading) return
    const userMessage: Msg = {
      id: Date.now(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((msgs) => [...msgs, userMessage])
    setCurrentInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          apiKey: sessionStorage.getItem("pplx_key"),
        }),
      })
      const data = await res.json()
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: res.ok
            ? data.answer || "(No answer received.)"
            : "❌ " + (data.error || "Unknown error."),
          timestamp: new Date(),
        },
      ])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "❌ Error: " + errorMessage,
          timestamp: new Date(),
        },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Head */}
      <header className="w-full max-w-2xl mx-auto flex justify-between items-center px-4 sm:px-6 py-5 border-b border-zinc-800 sticky top-0 bg-black/80 z-20 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white text-black">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-xl text-white tracking-tight">
              Perplexity Chat
            </div>
            <div className="text-xs text-zinc-400 font-mono tracking-wider">
              Modern AI Search
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowApiKeyInput((p) => !p)}
          className={`px-4 py-1.5 rounded-md border font-semibold transition shadow-sm text-xs cursor-pointer ${
            isApiKeySaved
              ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500"
              : "border-zinc-600 bg-black text-zinc-500 hover:border-red-600 hover:text-red-400"
          }`}
        >
          {isApiKeySaved ? "API Connected" : "Set API Key"}
        </button>
      </header>

      {/* API Key Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-8 shadow-2xl w-full max-w-xs flex flex-col gap-4">
            <div className="text-center font-semibold text-lg text-white tracking-tight mb-2">
              Set your Perplexity API Key
            </div>
            <input
              type="password"
              className="bg-black border border-zinc-700 rounded px-4 py-2 text-zinc-100 text-base w-full focus:outline-none"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoFocus
            />
            <div className="flex justify-between gap-2">
              <button
                className="bg-white text-black font-bold py-2 rounded-md flex-1 cursor-pointer"
                onClick={saveApiKey}
                disabled={!apiKey.trim()}
              >
                Save
              </button>
              <button
                className="border cursor-pointer border-zinc-700 bg-zinc-950 text-zinc-300 rounded-md flex-1"
                onClick={() => setShowApiKeyInput(false)}
              >
                Cancel
              </button>
              {isApiKeySaved && (
                <button
                  className="text-xs cursor-pointer hover:border-red-600 hover:text-red-400 bg-zinc-800 text-zinc-200 px-3 py-2 rounded border border-zinc-700"
                  onClick={clearApiKey}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-2 sm:px-4 py-8 pb-32 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 select-none">
              <span className="text-5xl mb-3">🛸</span>
              <span className="font-extrabold text-2xl text-white mb-2 tracking-tight">
                Welcome
              </span>
              <span className="mb-7 text-zinc-400 text-center max-w-xs">
                Set your API key, ask questions, and experience fast, accurate
                AI search.
              </span>
              {!isApiKeySaved && (
                <div className="mt-1 text-xs bg-black/60 border border-zinc-800 text-zinc-300 px-5 py-3 rounded-xl shadow">
                  ⚠ Please enter Perplexity API key to use chat.
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } w-full`}
              >
                <div
                  className={`${
                    msg.role === "user"
                      ? "bg-white text-black shadow-md border border-zinc-700 shadow-white/5"
                      : "bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-black/20"
                  } 
                  rounded-2xl px-5 py-3 transition-all max-w-[80%] w-fit flex flex-col backdrop-blur-lg shadow-lg`}
                >
                  <div
                    className={`text-xs font-mono mb-1 flex items-center gap-1 ${
                      msg.role === "user" ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    {msg.role === "user" ? "You" : "Assistant"}
                    <span className="mx-2 text-zinc-600">·</span>
                    {formatTime(msg.timestamp)}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-base">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Spinner */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-6 py-4 bg-zinc-900 border border-zinc-800 flex items-center gap-3 min-w-[120px]">
                <svg
                  className="animate-spin h-5 w-5 text-zinc-400 mr-1"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <span className="text-zinc-400 text-sm font-mono">
                  Searching...
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-lg border-t border-zinc-800/50 shadow-2xl z-30">
        <form
          className="w-full max-w-2xl mx-auto px-2 py-2"
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          autoComplete="off"
        >
          <div className="relative flex items-end gap-0.5">
            <div className="relative flex-1">
              <textarea
                className="w-full resize-none bg-zinc-900 border border-zinc-700 rounded-full pl-4 pr-12 py-3 text-white text-base placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all duration-200 min-h-[48px] max-h-[120px] leading-6 scrollbar-hide overflow-hidden"
                rows={1}
                placeholder={
                  isApiKeySaved ? "Ask Perplexity..." : "Enter API key first"
                }
                disabled={!isApiKeySaved || isLoading}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "auto"
                  target.style.height =
                    Math.min(target.scrollHeight, 120) + "px"
                }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!currentInput.trim() || !isApiKeySaved || isLoading}
                className={`mb-[7px] mr-[3px] absolute right-2 bottom-2 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                  !currentInput.trim() || !isApiKeySaved || isLoading
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-zinc-100 hover:scale-105 shadow-sm"
                }`}
              >
                <ArrowUp
                  size={24}
                  className={isLoading ? "animate-pulse" : ""}
                />
              </button>
            </div>
          </div>
          <div className="text-xs text-white text-center mt-2 select-none">
            <span>Press Enter to send • Shift+Enter for new line</span>
          </div>
        </form>
      </div>
    </div>
  )
}
