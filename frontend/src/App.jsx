import { useState } from "react";
import axios from "axios";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reasoning, setReasoning] = useState([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
 
  const askAI = async () => {
    setLoading(true);
    setReasoning([]);
    setAnswer("");

    const res = await axios.post("http://localhost:5000/ask-ai", {
      prompt,
    });

    // Animate reasoning
    let steps = res.data.reasoning;

    steps.forEach((step, index) => {
      setTimeout(() => {
        setReasoning(prev => [...prev, step]);
      }, index * 700);
    });

    setTimeout(() => {
      setAnswer(res.data.answer);
      setLoading(false);
    }, steps.length * 700);
  };

  return (
    <div style={{padding:"40px", fontFamily:"sans-serif"}}>
      <h1>🧠 AI Reasoning Visualizer</h1>

      <textarea
        rows="4"
        style={{width:"400px"}}
        placeholder="Ask anything..."
        onChange={(e)=>setPrompt(e.target.value)}
      />

      <br/><br/>

      <button onClick={askAI}>
        Ask AI
      </button>

      {loading && <p>AI is thinking...</p>}

      <div style={{marginTop:"20px"}}>
        {reasoning.map((step, i)=>(
          <div key={i} style={{
            padding:"10px",
            margin:"10px 0",
            background:"#f3f3f3",
            borderRadius:"8px"
          }}>
            👉 {step}
          </div>
        ))}
      </div>

      {answer && (
        <div style={{
          marginTop:"30px",
          padding:"20px",
          background:"#dff7df",
          borderRadius:"10px"
        }}>
          ✅ <b>Final Answer:</b> {answer}
        </div>
      )}
    </div>
  );
}

export default App;
