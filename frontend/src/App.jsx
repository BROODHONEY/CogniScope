import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Brain, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles,
  AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [reasoning, setReasoning] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [history, setHistory] = useState([]);
  
  const textareaRef = useRef(null);
  const reasoningEndRef = useRef(null);

  // Auto-scroll to bottom when new reasoning steps appear
  useEffect(() => {
    if (reasoning.length > 0) {
      reasoningEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [reasoning]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai-reasoning-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Save to history
  const saveToHistory = (prompt, reasoning, answer) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      prompt,
      reasoning,
      answer,
    };
    const updated = [newEntry, ...history].slice(0, 10); // Keep last 10
    setHistory(updated);
    localStorage.setItem("ai-reasoning-history", JSON.stringify(updated));
  };

  const askAI = async () => {
    if (!prompt.trim()) {
      setError("Please enter a question first!");
      return;
    }

    setLoading(true);
    setReasoning([]);
    setAnswer("");
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/ask-ai",
        { prompt },
        { timeout: 60000 } // 60 second timeout
      );

      console.log("Full response:", res);
      console.log("Response data:", res.data);
      console.log("Has reasoning?", res.data?.reasoning);
      console.log("Has answer?", res.data?.answer);

      if (!res.data || !res.data.reasoning || !res.data.answer) {
        throw new Error("Invalid response from server");
      }

      const steps = res.data.reasoning;

      // Animate steps appearing one by one
      steps.forEach((step, index) => {
        setTimeout(() => {
          setReasoning((prev) => [...prev, step]);
        }, index * 500);
      });

      // Show final answer after all steps
      setTimeout(() => {
        setAnswer(res.data.answer);
        setLoading(false);
        saveToHistory(prompt, steps, res.data.answer);
      }, steps.length * 500 + 300);

    } catch (err) {
      console.error("Error:", err);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. The AI took too long to respond.";
      } else if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.message || "Unknown error"}`;
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Is it running on http://localhost:5000?";
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, index = null) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== null) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedAnswer(true);
        setTimeout(() => setCopiedAnswer(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Clear everything
  const clearAll = () => {
    setPrompt("");
    setReasoning([]);
    setAnswer("");
    setError(null);
    textareaRef.current?.focus();
  };

  // Load from history
  const loadFromHistory = (entry) => {
    setPrompt(entry.prompt);
    setReasoning(entry.reasoning);
    setAnswer(entry.answer);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3 
              }}
            >
              <Brain className="w-10 h-10 text-indigo-400" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Reasoning Visualizer
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Watch how AI thinks — step by step, in real time
          </p>
        </motion.div>

        {/* ═══ INPUT CARD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask the AI anything... Try: 'What is 347 × 286?' or 'Should I learn Python or JavaScript first?'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="bg-slate-950/50 border-slate-700 text-white min-h-[140px] text-base resize-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  Press Enter to submit · Shift+Enter for new line
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={askAI}
                  disabled={loading || !prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-6 rounded-xl text-lg shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-5 h-5" />
                      AI Thinking...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Visualize Reasoning
                    </span>
                  )}
                </Button>

                {(reasoning.length > 0 || answer) && (
                  <Button
                    onClick={clearAll}
                    variant="outline"
                    className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 px-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ ERROR ALERT ═══ */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="bg-red-950/50 border-red-800/50 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ REASONING STEPS ═══ */}
        {reasoning.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Reasoning Chain
            </h2>
            
            <div className="space-y-3">
              <AnimatePresence>
                {reasoning.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 100,
                      damping: 15
                    }}
                  >
                    <Card className="bg-slate-900/60 border-slate-700/50 shadow-lg rounded-xl hover:shadow-indigo-500/10 transition-shadow group">
                      <CardContent className="p-4 flex gap-4 items-start">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm border border-indigo-500/20 shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-200 leading-relaxed flex-1 pt-1">
                          {step}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(step, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-400"
                        >
                          {copiedIndex === i ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={reasoningEndRef} />
            </div>
          </motion.div>
        )}

        {/* ═══ FINAL ANSWER ═══ */}
        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Card className="bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-pink-950/30 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-indigo-300 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Final Answer
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(answer)}
                      className="text-slate-400 hover:text-indigo-400"
                    >
                      {copiedAnswer ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-lg text-white leading-relaxed">
                    {answer}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ HISTORY SIDEBAR (OPTIONAL) ═══ */}
        {history.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Recent Questions
            </h3>
            <div className="grid gap-2">
              {history.slice(0, 3).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className="text-left p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all text-sm text-slate-300 truncate"
                >
                  {entry.prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}