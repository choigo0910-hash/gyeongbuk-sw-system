"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ChatbotKnowledge {
  id: string
  question: string
  answer: string
  category: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  created_at: string
}

interface ChatConversation {
  id: string
  user_id: string
  user_email: string
  status: string
  created_at: string
  message_count: number
}

export default function AdminChatbotPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // 지식 베이스 상태
  const [knowledge, setKnowledge] = useState<ChatbotKnowledge[]>([])
  const [editingKnowledge, setEditingKnowledge] = useState<ChatbotKnowledge | null>(null)
  const [knowledgeDialog, setKnowledgeDialog] = useState(false)
  const [knowledgeForm, setKnowledgeForm] = useState({
    question: "",
    answer: "",
    category: "",
    priority: 0,
    is_active: true,
  })

  // 채팅 기록 상태
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Tabs 상태
  const [activeTab, setActiveTab] = useState("knowledge")

  useEffect(() => {
    fetchKnowledge()
    fetchConversations()
  }, [])

  // 지식 베이스 조회
  const fetchKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from("chatbot_knowledge")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setKnowledge(data || [])
    } catch (error) {
      console.error("지식 베이스 조회 실패:", error)
    }
  }

  // 지식 베이스 저장
  const saveKnowledge = async () => {
    try {
      if (editingKnowledge) {
        // 수정
        const { error } = await supabase
          .from("chatbot_knowledge")
          .update(knowledgeForm)
          .eq("id", editingKnowledge.id)

        if (error) throw error
      } else {
        // 추가
        const { error } = await supabase
          .from("chatbot_knowledge")
          .insert(knowledgeForm)

        if (error) throw error
      }

      setKnowledgeDialog(false)
      setEditingKnowledge(null)
      setKnowledgeForm({
        question: "",
        answer: "",
        category: "",
        priority: 0,
        is_active: true,
      })
      fetchKnowledge()
    } catch (error) {
      console.error("지식 베이스 저장 실패:", error)
      alert("저장에 실패했습니다.")
    }
  }

  // 지식 베이스 삭제
  const deleteKnowledge = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      const { error } = await supabase
        .from("chatbot_knowledge")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchKnowledge()
    } catch (error) {
      console.error("지식 베이스 삭제 실패:", error)
      alert("삭제에 실패했습니다.")
    }
  }

  // 지식 베이스 수정 시작
  const startEdit = (item: ChatbotKnowledge) => {
    setEditingKnowledge(item)
    setKnowledgeForm({
      question: item.question,
      answer: item.answer,
      category: item.category || "",
      priority: item.priority,
      is_active: item.is_active,
    })
    setKnowledgeDialog(true)
  }

  // 채팅 기록 조회
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // 메시지 수 카운트 및 사용자 이메일 조회
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv: any) => {
          const [{ count }, { data: profileData }] = await Promise.all([
            supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id),
            supabase
              .from("user_profiles")
              .select("email")
              .eq("user_id", conv.user_id)
              .single()
          ])

          return {
            ...conv,
            user_email: profileData?.email || "알 수 없음",
            message_count: count || 0,
          } as ChatConversation
        })
      )

      setConversations(conversationsWithCount)
    } catch (error) {
      console.error("채팅 기록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 메시지 조회
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("메시지 조회 실패:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">챗봇 관리</h1>
          <p className="text-muted-foreground">지식 베이스 및 채팅 기록을 관리합니다</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="knowledge">지식 베이스</TabsTrigger>
          <TabsTrigger value="history">채팅 기록</TabsTrigger>
        </TabsList>

        {/* 지식 베이스 탭 */}
        <TabsContent value="knowledge" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">지식 베이스 관리</h2>
              <p className="text-sm text-muted-foreground">
                총 {knowledge.length}개의 Q&A
              </p>
            </div>
            <Dialog open={knowledgeDialog} onOpenChange={setKnowledgeDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingKnowledge(null)
                  setKnowledgeForm({
                    question: "",
                    answer: "",
                    category: "",
                    priority: 0,
                    is_active: true,
                  })
                }}>
                  새 Q&A 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingKnowledge ? "Q&A 수정" : "새 Q&A 추가"}
                  </DialogTitle>
                  <DialogDescription>
                    챗봇이 사용자 질문에 답변할 수 있도록 Q&A를 추가하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="question">질문</Label>
                    <Input
                      id="question"
                      value={knowledgeForm.question}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, question: e.target.value })}
                      placeholder="사용자가 물어볼 수 있는 질문"
                    />
                  </div>
                  <div>
                    <Label htmlFor="answer">답변</Label>
                    <Textarea
                      id="answer"
                      value={knowledgeForm.answer}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, answer: e.target.value })}
                      placeholder="질문에 대한 답변"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Input
                      id="category"
                      value={knowledgeForm.category}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, category: e.target.value })}
                      placeholder="예: 예산, 환급, 프로그램"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">우선순위</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={knowledgeForm.priority}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, priority: parseInt(e.target.value) || 0 })}
                      placeholder="높을수록 우선 표시 (기본값: 0)"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={knowledgeForm.is_active}
                      onChange={(e) => setKnowledgeForm({ ...knowledgeForm, is_active: e.target.checked })}
                    />
                    <Label htmlFor="isActive">활성화</Label>
                  </div>
                  <Button onClick={saveKnowledge} className="w-full">
                    {editingKnowledge ? "수정" : "추가"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {knowledge.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.is_active ? "default" : "secondary"}>
                            {item.is_active ? "활성" : "비활성"}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            우선순위: {item.priority}
                          </span>
                        </div>
                        <p className="font-medium">Q: {item.question}</p>
                        <p className="text-muted-foreground">A: {item.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(item)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteKnowledge(item.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {knowledge.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 Q&A가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 채팅 기록 탭 */}
        <TabsContent value="history" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">채팅 기록</h2>
            <p className="text-sm text-muted-foreground">
              총 {conversations.length}개의 대화
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 대화 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>대화 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv.id)
                        fetchMessages(conv.id)
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{conv.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(conv.created_at)}
                          </p>
                        </div>
                        <Badge variant="secondary">{conv.message_count}건</Badge>
                      </div>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      채팅 기록이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 메시지 내용 */}
            <Card>
              <CardHeader>
                <CardTitle>메시지 내용</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-100 ml-8"
                            : "bg-gray-100 mr-8"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            {msg.role === "user" ? "사용자" : "챗봇"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        메시지가 없습니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    대화를 선택하세요.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
