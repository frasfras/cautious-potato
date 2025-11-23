// app.js
import React, { useState, useEffect } from 'react';
import * as openai from 'openai';
import { PdfReader } from 'pdfjs-dist';
import { SentenceTransformer } from 'sentence-transformers';
import faiss from 'faiss-js'; // hypothetical JS binding for faiss
import crypto from 'crypto';

// --------------------------
// Setup API client
// --------------------------
const client = new openai.OpenAI({
  apiKey: "syn_6042570bd16bbf5f4a847147884c9a80",
  baseURL: "https://api.synthetic.new/v1",
});

// --------------------------
// Load embedding model
// --------------------------
let embedder;
async function loadEmbedder() {
  if (!embedder) {
    embedder = await SentenceTransformer.load('all-MiniLM-L6-v2');
  }
  return embedder;
}

// --------------------------
// PDF handling
// --------------------------
async function extractTextFromPdf(fileBytes) {
  const loadingTask = PdfReader.getDocument({ data: fileBytes });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
}

function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

// --------------------------
// Cached PDF embeddings
// --------------------------
const pdfCache = new Map();

async function getPdfIndex(fileBytes) {
  const fileHash = crypto.createHash('md5').update(fileBytes).digest('hex');
  if (pdfCache.has(fileHash)) {
    return pdfCache.get(fileHash);
  }
  const text = await extractTextFromPdf(fileBytes);
  const pdfChunks = chunkText(text);
  const vectors = await embedder.encode(pdfChunks);
  const dimension = vectors[0].length;
  const index = new faiss.IndexFlatL2(dimension);
  index.add(vectors);
  pdfCache.set(fileHash, { pdfChunks, index });
  return { pdfChunks, index };
}

// --------------------------
// Retrieval + prompt building
// --------------------------
async function makePrompt(question, dfContext, pdfChunks, pdfIndex) {
  let pdfContext = "";
  if (pdfChunks && pdfIndex) {
    const qVec = await embedder.encode([question]);
    const { distances, labels } = pdfIndex.search(qVec, 3);
    pdfContext = labels[0].map(i => pdfChunks[i]).join('\n');
  }

  let csvContext = "";
  if (dfContext) {
    csvContext = dfContext.map(row =>
      `${row.expire_at} | ${row.lap} | ${row.meta_event} | ${row.meta_source} | ${row.meta_time} | ${row.original_vehicle_id} | ${row.outing} | ${row.telemetry_name} | ${row.telemetry_value} | ${row.timestamp} | ${row.vehicle_id} | ${row.vehicle_number}`
    ).join('\n');
  }

  return `
You are Race-GPT, a  coach assistant.

Logs:
${csvContext}

Scientific Notes:
${pdfContext}

Question: ${question}
Answer (be accurate, concise, and eco-friendly):
`;
}

// --------------------------
// React UI (simplified)
// --------------------------
function EcoGPTApp() {
  const [df, setDf] = useState(null);
  const [pdfChunks, setPdfChunks] = useState(null);
  const [pdfIndex, setPdfIndex] = useState(null);
  const [userInput, setUserInput] = useState("What animals were near stream #3?");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmbedder();
  }, []);

  async function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    // Simple CSV parsing (replace with a library like PapaParse if needed)
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim());
      return obj;
    });
    setDf(rows);
  }

  async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const arrayBuffer = await file.arrayBuffer();
    const { pdfChunks, index } = await getPdfIndex(new Uint8Array(arrayBuffer));
    setPdfChunks(pdfChunks);
    setPdfIndex(index);
    setLoading(false);
  }

  async function askEcoGPT() {
    if (!userInput.trim()) return;
    setLoading(true);
    const prompt = await makePrompt(userInput, df, pdfChunks, pdfIndex);
    // Call OpenAI API (example, adjust to your environment)
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    setAnswer(response.choices[0].message.content);
    setLoading(false);
  }

  return (
    <div>
      <h1>🌱 Eco-GPT: Scientific Q&A</h1>
      <p>Upload CSV logs + scientific PDFs, then ask natural questions. Powered by GPT-OSS via Synthetic API.</p>

      <input type="file" accept=".csv" onChange={handleCsvUpload} />
      {df && (
        <>
          <h3>📜 CSV Preview</h3>
          <pre>{JSON.stringify(df.slice(0, 20), null, 2)}</pre>
        </>
      )}

      <input type="file" accept=".pdf" onChange={handlePdfUpload} />
      {loading && <p>Processing...</p>}
      {!loading && pdfChunks && <p>PDF indexed successfully ✅</p>}

      <textarea value={userInput} onChange={e => setUserInput(e.target.value)} rows={4} cols={50} />
      <br />
      <button onClick={askEcoGPT}>Ask Eco-GPT</button>

      {answer && (
        <>
          <h3>Answer:</h3>
          <p>{answer}</p>
        </>
      )}
    </div>
  );
}

export default EcoGPTApp;