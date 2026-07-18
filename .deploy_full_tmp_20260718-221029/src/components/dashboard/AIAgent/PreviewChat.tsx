import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PreviewChatProps {
  systemPrompt: string;
  tone: string;
  agentName: string;
}

const SAMPLE_MESSAGES = [
  "السلام عليكم، هل يمكنك مساعدتي؟",
  "ما هي أسعار الخدمات المتاحة؟",
  "كيف يمكن حجز موعد؟",
  "هل لديكم خصومات للعملاء الجدد؟",
];

export const PreviewChat: React.FC<PreviewChatProps> = ({
  systemPrompt,
  tone,
  agentName,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `أهلاً بيك! معاي ${agentName}، أقدر أساعدك في إيه النهاردة؟`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const responses: { [key: string]: string } = {
        friendly: "شكراً لسؤالك! أقدر أساعدك فيها بكل سهولة 😊",
        formal: "شكراً على استفسارك. سأكون سعيداً بتقديم المساعدة اللازمة.",
        warm: "آه، سؤال جميل! أنا هنا لأساعدك بكل حب ❤️",
        professional: "تفضل، أنا جاهز لتقديم الحل الأمثل لاستفسارك.",
        humorous: "هاها، أحب الأسئلة! تمام التمام، هقول لك كل حاجة 😄",
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[tone as keyof typeof responses] || responses.friendly,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/50 rounded-lg border border-border/50">
      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none border border-border/50"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-lg rounded-bl-none px-4 py-2 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-xs">{t("typing")}</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder={t("type_message")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
            className="bg-background/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Sample Messages */}
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_MESSAGES.slice(0, 2).map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(sample);
              }}
              className="text-xs px-2 py-1 bg-background/50 hover:bg-background border border-border/50 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={sample}
            >
              {sample.substring(0, 20)}...
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
