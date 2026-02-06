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
  AlertCircle,
  GitBranch,
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import "./App.css";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [reasoning, setReasoning] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [history, setHistory] = useState([]);
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [activeNode, setActiveNode] = useState(null);
  
  const textareaRef = useRef(null);
  const reasoningEndRef = useRef(null);

  // Auto-scroll to bottom when new reasoning steps appear
  useEffect(() => {
    if (reasoning.length > 0) {
      reasoningEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [reasoning]);

  // Auto-activate nodes as reasoning appears
  useEffect(() => {
    if (reasoning.length > 0) {
      setActiveNode(reasoning.length - 1);
    }
  }, [reasoning]);

  // Save to history
  const saveToHistory = (prompt, reasoning, answer) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      prompt,
      reasoning,
      answer,
    };
    const updated = [newEntry, ...history].slice(0, 10);
    setHistory(updated);
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
    setActiveNode(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/ask-ai",
        { prompt },
        { timeout: 60000 }
      );

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

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

  const clearAll = () => {
    setPrompt("");
    setReasoning([]);
    setAnswer("");
    setError(null);
    setActiveNode(null);
    textareaRef.current?.focus();
  };

  const loadFromHistory = (entry) => {
    setPrompt(entry.prompt);
    setReasoning(entry.reasoning);
    setAnswer(entry.answer);
    setError(null);
    setActiveNode(entry.reasoning.length - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate tree structure from reasoning steps
  const generateTreeNodes = () => {
    if (reasoning.length === 0) return [];
    
    const nodes = [{ 
      id: 0, 
      label: "Start", 
      content: prompt,
      level: 0,
      type: "root"
    }];

    reasoning.forEach((step, index) => {
      nodes.push({
        id: index + 1,
        label: `Step ${index + 1}`,
        content: step,
        level: Math.floor((index + 1) / 2) + 1,
        type: "reasoning",
        active: index <= activeNode
      });
    });

    if (answer) {
      nodes.push({
        id: reasoning.length + 1,
        label: "Answer",
        content: answer,
        level: nodes[nodes.length - 1].level + 1,
        type: "answer",
        active: true
      });
    }

    return nodes;
  };

  const treeNodes = generateTreeNodes();

  return (
    <div className="min-h-screen w-[100vw] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="flex h-screen overflow-hidden">
        
        {/* ═══ MAIN CONTENT ═══ */}
        <div className={`flex-1 overflow-y-auto transition-all duration-500 ${treeExpanded ? 'mr-[480px]' : 'mr-0'}`}>
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
                  CogniScope AI
                </h1>
              </div>
              <p className="text-slate-400 text-lg flex items-center justify-center gap-2">
                <span>Watch how AI thinks — step by step, in real time</span>
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold">with Decision Tree</span>
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
                        onHoverStart={() => setActiveNode(i)}
                      >
                        <Card className={`bg-slate-900/60 border-slate-700/50 shadow-lg rounded-xl transition-all group ${
                          activeNode === i ? 'border-indigo-500/50 shadow-indigo-500/20' : 'hover:shadow-indigo-500/10'
                        }`}>
                          <CardContent className="p-4 flex gap-4 items-start">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm border border-indigo-500/20 shrink-0 transition-all ${
                              activeNode === i ? 'scale-110 border-indigo-400' : ''
                            }`}>
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
                  <Card className="bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-pink-950/30 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 rounded-2xl overflow-hidden group">                    <CardContent className="p-6 relative">
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

            {/* ═══ HISTORY ═══ */}
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

            <div className="text-sm text-slate-500 mt-4">The model used for the current reasoning visualisation is <span className="text-indigo-400 font-medium">Open AI's gpt-oss-20b</span></div>
          </div>
        </div>

        {/* ═══ DECISION TREE SIDEBAR ═══ */}
        <AnimatePresence>
          {reasoning.length > 0 && (
            <motion.div
              initial={{ x: 480 }}
              animate={{ x: treeExpanded ? 0 : 480 }}
              exit={{ x: 480 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-screen w-[480px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/50 shadow-2xl z-50"
            >
              {/* Tree Header */}
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                      <GitBranch className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Decision Tree</h2>
                      <p className="text-xs text-slate-400">Reasoning Path Visualization</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTreeExpanded(!treeExpanded)}
                    className="text-slate-400 hover:text-white"
                  >
                    {treeExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{treeNodes.length} nodes • {reasoning.length} steps</span>
                </div>
              </div>

              {/* Tree Visualization */}
              <div className="h-[calc(100vh-120px)] overflow-y-auto p-6 space-y-4">
                {treeNodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                    style={{ paddingLeft: `${node.level * 24}px` }}
                  >
                    {/* Connection Line */}
                    {index > 0 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.1 + 0.05 }}
                        className="absolute left-4 -top-4 w-0.5 h-4 bg-gradient-to-b from-slate-700 to-transparent origin-top"
                        style={{ left: `${(treeNodes[index - 1].level * 24) + 20}px` }}
                      />
                    )}

                    {/* Node Card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setActiveNode(index - 1)}
                      className={`relative cursor-pointer transition-all ${
                        node.active === false ? 'opacity-40' : ''
                      }`}
                    >
                      <div className={`rounded-xl p-4 border transition-all ${
                        activeNode === index - 1 
                          ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                          : node.type === 'root'
                          ? 'bg-slate-900/60 border-emerald-500/30'
                          : node.type === 'answer'
                          ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/30'
                          : 'bg-slate-900/40 border-slate-700/30 hover:border-slate-600/50'
                      }`}>
                        {/* Node Icon & Label */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            node.type === 'root'
                              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              : node.type === 'answer'
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                              : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                          }`}>
                            {node.type === 'root' ? '🎯' : node.type === 'answer' ? '✨' : index}
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-semibold uppercase tracking-wider ${
                              node.type === 'root' ? 'text-emerald-400' :
                              node.type === 'answer' ? 'text-purple-400' :
                              'text-indigo-400'
                            }`}>
                              {node.label}
                            </div>
                          </div>
                          {activeNode === index - 1 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <ChevronRight className="w-4 h-4 text-indigo-400" />
                            </motion.div>
                          )}
                        </div>

                        {/* Node Content */}
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                          {node.content}
                        </p>

                        {/* Progress Indicator */}
                        {node.active !== false && node.type === 'reasoning' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                          />
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tree Toggle Button (when collapsed) */}
        {reasoning.length > 0 && !treeExpanded && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setTreeExpanded(true)}
            className="fixed right-4 top-4 z-40 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            <GitBranch className="w-5 h-5 text-emerald-400" />
          </motion.button>
        )}
      </div>
    </div>
  );
}