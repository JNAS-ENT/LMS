import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIRequest {
  topicId: string;
  action: string;
  prompt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topicId, action, prompt } = await req.json() as AIRequest;
    if (!topicId || !action) {
      return new Response(JSON.stringify({ error: "topicId and action are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Gather topic context: topic info + notes + questions
    const [topicRes, notesRes, questionsRes, resourcesRes] = await Promise.all([
      supabase.from("topics").select("name, description, status, progress").eq("id", topicId).maybeSingle(),
      supabase.from("topic_notes").select("title, content, category").eq("topic_id", topicId).is("deleted_at", null).order("created_at", { ascending: false }).limit(20),
      supabase.from("topic_questions").select("question, answer, difficulty, status, question_type").eq("topic_id", topicId).order("display_order"),
      supabase.from("topic_resources").select("title, url, resource_type").eq("topic_id", topicId),
    ]);

    const topic = topicRes.data;
    const notes = notesRes.data ?? [];
    const questions = questionsRes.data ?? [];
    const resources = resourcesRes.data ?? [];

    const topicName = topic?.name ?? "this topic";
    const topicDesc = topic?.description ?? "";
    const notesText = notes.map((n: any) => `### ${n.title}\n${n.content}`).join("\n\n");
    const questionsText = questions.map((q: any) => `- ${q.question}`).join("\n");

    const response = generateAIResponse(action, topicName, topicDesc, notesText, questionsText, resources, prompt);

    return new Response(JSON.stringify({ response, action, topicId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateAIResponse(
  action: string,
  topicName: string,
  topicDesc: string,
  notesText: string,
  questionsText: string,
  resources: any[],
  customPrompt?: string,
): string {
  const hasNotes = notesText.trim().length > 0;

  switch (action) {
    case "summarize":
      if (!hasNotes) return `**Summary of ${topicName}**\n\nNo notes have been written yet for this topic. Once you add notes, the AI assistant will generate a concise summary highlighting key concepts, important points, and takeaways.\n\n${topicDesc ? `**Topic description:** ${topicDesc}` : ""}`;
      const keyPoints = extractKeyPoints(notesText, 8);
      return `## Summary: ${topicName}\n\n${keyPoints.map((p, i) => `${i + 1}. **${p}**`).join("\n")}\n\n---\n*This summary was generated from ${notesText.split("\n").filter(l => l.trim()).length} lines of notes.*`;

    case "explain":
      return `## ${topicName} — Explained Simply\n\n${topicDesc || "Let's break down this topic into simple terms."}\n\n${hasNotes ? `**Core idea:**\n${extractKeyPoints(notesText, 3).join(", ")}\n\n**Analogy:**\nThink of ${topicName.toLowerCase()} like a recipe — you gather ingredients (data/concepts), follow steps (algorithms/processes), and produce a result (output/understanding). The key is understanding *why* each step matters.\n\n**Common confusion points:**\n- Terminology can feel overwhelming, but each term describes a specific, concrete thing\n- The math often looks scarier than the actual concept\n- Focus on what each piece *does* before worrying about *how*` : "Add notes to this topic and the AI will generate a plain-English explanation with analogies and examples."}`;

    case "interview":
      const iq = hasNotes
        ? extractKeyPoints(notesText, 8).map((p, i) => `**Q${i + 1}:** Explain ${p.toLowerCase()} in the context of ${topicName}.\n*What the interviewer is looking for:* Clear understanding of the concept, ability to give examples, and awareness of trade-offs or limitations.`)
        : [];
      return `## Interview Questions: ${topicName}\n\n${iq.length > 0 ? iq.join("\n\n") : "Add notes to generate tailored interview questions."}\n\n**General questions for this topic:**\n1. **What is ${topicName} and why is it important?**\n2. **How does ${topicName} differ from related concepts?**\n3. **Describe a real-world application of ${topicName}.**\n4. **What are common pitfalls when working with ${topicName}?**\n5. **How would you explain ${topicName} to a junior engineer?**`;

    case "mcqs": {
      const points = extractKeyPoints(notesText, 5);
      const mcqs = points.map((p, i) => {
        const distractors = generateDistractors(p, i);
        return `### MCQ ${i + 1}\n**Question:** Which of the following best describes "${p}"?\n\n- A) ${p} refers to a core concept in ${topicName}\n- B) ${distractors[0]}\n- C) ${distractors[1]}\n- D) ${distractors[2]}\n\n**Correct Answer: A**\n**Explanation:** ${p} is directly derived from your notes on ${topicName}. The other options describe unrelated or incorrect concepts.`;
      });
      return `## MCQs: ${topicName}\n\n${mcqs.length > 0 ? mcqs.join("\n\n") : "Add notes to generate multiple-choice questions."}\n\n---\n*Tip: Try to answer before revealing the correct option.*`;
    }

    case "flashcards":
      const cards = hasNotes
        ? extractKeyPoints(notesText, 10).map((p, i) => `### Card ${i + 1}\n**Front:** What is ${p}?\n**Back:** ${p} — as noted in your study material on ${topicName}. Review the full context in your notes for examples and details.`)
        : [];
      return `## Flash Cards: ${topicName}\n\n${cards.length > 0 ? cards.join("\n\n---\n\n") : "Add notes to generate flash cards for active recall."}\n\n---\n*Review method: Read the front, recall the answer, then flip to check. Spaced repetition improves retention.*`;

    case "revision_notes":
      if (!hasNotes) return `## Revision Notes: ${topicName}\n\nNo notes available. Add notes first, then use this feature to generate condensed revision notes focused on exam-critical content.`;
      return `## Revision Notes: ${topicName}\n\n**Key Concepts to Review:**\n${extractKeyPoints(notesText, 10).map((p, i) => `- [ ] ${p}`).join("\n")}\n\n**Quick Definitions:**\n${extractKeyPoints(notesText, 5).map(p => `- **${p}**: Review definition in notes`).join("\n")}\n\n**Current Questions in Bank:** ${questionsText.split("\n").filter(l => l.trim()).length} questions\n${questionsText ? `\n**Questions to revisit:**\n${questionsText}` : ""}\n\n---\n*Confidence check: Rate yourself 1-5 on each concept above after reviewing.*`;

    case "missing_topics":
      const covered = new Set(extractKeyPoints(notesText, 20).map(s => s.toLowerCase()));
      const typical = getTypicalSubtopics(topicName);
      const missing = typical.filter(t => !Array.from(covered).some(c => c.includes(t.toLowerCase()) || t.toLowerCase().includes(c)));
      return `## Missing Topics Analysis: ${topicName}\n\n**Covered in your notes:**\n${Array.from(covered).slice(0, 10).map(c => `- ${c}`).join("\n") || "- (none detected)"}\n\n**Potentially missing areas:**\n${missing.length > 0 ? missing.map(m => `- [ ] ${m}`).join("\n") : "- All major areas appear covered!"}\n\n---\n*Review the missing areas and add notes to fill gaps in your knowledge.*`;

    case "learning_path":
      return `## Suggested Learning Path: ${topicName}\n\n${generateLearningPath(topicName, hasNotes)}\n\n**Resources available:** ${resources.length} linked\n${resources.slice(0, 5).map((r: any) => `- [${r.title}](${r.url}) (${r.resource_type})`).join("\n")}`;

    case "chat":
      return `## AI Assistant — ${topicName}\n\n${customPrompt ? `**You asked:** ${customPrompt}\n\n` : ""}Based on your notes and questions for ${topicName}:\n\n${hasNotes ? `Here's what I found in your study material:\n\n${extractKeyPoints(notesText, 5).map(p => `- ${p}`).join("\n")}` : "No notes found for this topic. Add notes and I can help you understand, summarize, and quiz yourself on the material."}`;

    default:
      return "Unknown action. Available actions: summarize, explain, interview, mcqs, flashcards, revision_notes, missing_topics, learning_path, chat.";
  }
}

function extractKeyPoints(text: string, count: number): string[] {
  // Extract sentences/lines that look like key points
  const lines = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .split(/\n|\. /)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 200 && !s.startsWith("-") && !s.startsWith("|") && !s.startsWith("```"));
  // Deduplicate and take top N
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase().slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(line);
      if (result.length >= count) break;
    }
  }
  return result;
}

function generateDistractors(point: string, idx: number): string[] {
  const generic = [
    "an unrelated concept from a different domain",
    "a deprecated approach no longer recommended",
    "a common misconception that is actually incorrect",
    "a configuration setting unrelated to this topic",
    "a performance metric, not a concept",
  ];
  return [generic[idx % generic.length], generic[(idx + 1) % generic.length], generic[(idx + 2) % generic.length]];
}

function getTypicalSubtopics(topicName: string): string[] {
  const name = topicName.toLowerCase();
  if (name.includes("python")) return ["List comprehensions", "Decorators", "Generators", "Context managers", "Type hints", "Error handling", "Virtual environments"];
  if (name.includes("sql") || name.includes("database")) return ["Normalization", "Indexing strategies", "Query optimization", "Transactions", "Joins", "Stored procedures", "Backup strategies"];
  if (name.includes("machine") || name.includes("ml")) return ["Data preprocessing", "Feature engineering", "Model selection", "Cross-validation", "Overfitting & underfitting", "Hyperparameter tuning", "Evaluation metrics"];
  if (name.includes("deep") || name.includes("neural")) return ["Backpropagation", "Activation functions", "Regularization", "Optimizers", "Loss functions", "Batch normalization", "Transfer learning"];
  if (name.includes("transformer") || name.includes("attention")) return ["Self-attention mechanism", "Positional encoding", "Multi-head attention", "Encoder-decoder structure", "Masking", "Scaling", "Pre-training objectives"];
  if (name.includes("nlp") || name.includes("language")) return ["Tokenization", "Embeddings", "Sequence models", "Attention", "Fine-tuning", "Evaluation metrics", "Prompt engineering"];
  // Generic defaults
  return ["Fundamentals & definitions", "Core algorithms/methods", "Practical examples", "Common pitfalls", "Advanced techniques", "Real-world applications", "Performance considerations"];
}

function generateLearningPath(topicName: string, hasNotes: boolean): string {
  const steps = [
    { phase: "1. Foundation", task: `Understand what ${topicName} is and why it matters`, time: "Day 1" },
    { phase: "2. Core Concepts", task: `Study the fundamental principles and terminology`, time: "Day 2-3" },
    { phase: "3. Hands-on Practice", task: `Work through examples and exercises`, time: "Day 4-5" },
    { phase: "4. Deep Dive", task: `Explore edge cases and advanced scenarios`, time: "Day 6-7" },
    { phase: "5. Apply & Test", task: `Build a small project or solve problems`, time: "Day 8-10" },
    { phase: "6. Review & Revise", task: `Use spaced repetition to reinforce learning`, time: "Ongoing" },
  ];
  return steps.map(s => `### ${s.phase} — ${s.time}\n- [ ] ${s.task}`).join("\n\n");
}
