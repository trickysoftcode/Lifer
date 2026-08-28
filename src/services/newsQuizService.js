import db from '../db/db';
import { chatWithGemini, hasApiKey, isBudgetExceeded } from './gemini';
import { addNotification } from './aiProactive';
import { awardXP } from './gamification';

const XP_PER_CORRECT = 10;
const QUESTIONS_PER_QUIZ = 5;

// ── Article Content Fetching ──────────────────────────────────────────
// Uses allorigins CORS proxy to fetch article HTML, then strips to text

async function fetchArticleContent(url) {
  if (!url) return '';

  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });

    if (!response.ok) return '';

    const data = await response.json();
    const html = data.contents || '';

    // Parse the HTML and extract meaningful text
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove scripts, styles, nav, headers, footers, ads
    const removeSelectors = 'script, style, nav, header, footer, aside, iframe, noscript, .ad, .ads, .advertisement, .sidebar, .menu, .nav, .comment, .comments, [role="navigation"], [role="banner"], [role="complementary"]';
    doc.querySelectorAll(removeSelectors).forEach(el => el.remove());

    // Prefer article body or main content
    const articleEl = doc.querySelector('article') || doc.querySelector('[role="main"]') || doc.querySelector('main') || doc.querySelector('.article-body') || doc.querySelector('.story-body') || doc.querySelector('.post-content') || doc.body;

    // Get all paragraph text
    const paragraphs = articleEl.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, figcaption');
    let text = '';
    paragraphs.forEach(p => {
      const pText = (p.textContent || '').trim();
      if (pText.length > 20) {
        text += pText + '\n\n';
      }
    });

    // If paragraph extraction yielded too little, fall back to full innerText
    if (text.length < 200) {
      text = (articleEl.innerText || articleEl.textContent || '').trim();
    }

    // Limit to ~4000 chars to keep the prompt reasonable
    return text.slice(0, 4000).trim();
  } catch (err) {
    console.warn('Failed to fetch article content:', err.message);
    return '';
  }
}

// Clean HTML tags from description strings
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

/**
 * Generates a 5-question contextual comprehension quiz for a news article.
 * Fetches the full article content, sends it to Gemini, and stores all 5 questions.
 */
export async function generateQuizForArticle(article, category = 'technology') {
  if (!article || !article.title) {
    throw new Error('Invalid article provided for quiz generation');
  }

  // Check if a quiz for this article already exists
  const existing = await db.newsQuizzes
    .where('articleUrl')
    .equals(article.link || '')
    .first();

  if (existing) {
    return existing;
  }

  if (!hasApiKey() || isBudgetExceeded()) {
    return await generateFallbackQuiz(article, category);
  }

  try {
    // Step 1: Fetch the actual article content
    const articleContent = await fetchArticleContent(article.link);
    const cleanDesc = stripHtml(article.description || '').slice(0, 600);

    // Build the content block — prefer full article, fall back to description
    const contentBlock = articleContent.length > 150
      ? articleContent
      : (cleanDesc || article.title);

    const contentSource = articleContent.length > 150
      ? 'FULL ARTICLE TEXT (extracted from the page)'
      : 'ARTICLE SUMMARY (full text unavailable)';

    // Step 2: Send to Gemini with a strong contextual prompt
    const prompt = `You are an expert news analyst, educator, and quizmaster. Gautam just read this news article. Your job is to create a rigorous, contextual 5-question comprehension quiz that tests DEEP understanding — not surface-level recall.

--- ${contentSource} ---
Headline: "${article.title}"
Category: ${category}
Source: ${article.source || 'News'}

${contentBlock}
--- END ARTICLE ---

INSTRUCTIONS:
1. Generate exactly 5 multiple-choice questions (4 options each, exactly 1 correct).
2. Questions must test CONTEXTUAL understanding — implications, causes, consequences, comparisons, analysis, "why" questions, critical thinking. NOT trivial facts like dates or names that could be guessed.
3. Each question should cover a DIFFERENT aspect of the article (e.g., main thesis, implications, stakeholders, historical context, what-if scenarios).
4. Options must be plausible and challenging — no obviously wrong answers.
5. Explanations should teach something new beyond what the article says.

Return ONLY a valid JSON object with NO extra text and NO markdown code fences:
{
  "questions": [
    {
      "question": "Thought-provoking question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why this is correct, with additional context."
    },
    {
      "question": "Second deep question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 2,
      "explanation": "Explanation with insight."
    },
    {
      "question": "Third analytical question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 1,
      "explanation": "Explanation."
    },
    {
      "question": "Fourth implication question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 3,
      "explanation": "Explanation."
    },
    {
      "question": "Fifth critical-thinking question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Explanation."
    }
  ],
  "articleSummary": "A 2-3 sentence summary of the article's key points.",
  "keyTakeaways": "The 2-3 most important lessons or insights from this article."
}`;

    const result = await chatWithGemini(prompt);

    let parsed = null;
    try {
      let text = (result.text || '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(text);
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini quiz JSON, using fallback:', parseError);
    }

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length < 3) {
      return await generateFallbackQuiz(article, category);
    }

    // Validate and normalize questions
    const questions = parsed.questions.slice(0, QUESTIONS_PER_QUIZ).map((q, i) => {
      const opts = Array.isArray(q.options) ? q.options.slice(0, 4).map(o => String(o).trim()) : [];
      while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
      const correctIdx = (typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < opts.length)
        ? q.correctAnswerIndex : 0;

      return {
        question: String(q.question || `Question ${i + 1}`).trim(),
        options: opts,
        correctAnswerIndex: correctIdx,
        explanation: String(q.explanation || `The correct answer is "${opts[correctIdx]}".`).trim(),
        userAnswerIndex: null,
        isAnswered: false,
        isCorrect: false,
      };
    });

    // Pad to 5 if Gemini returned fewer
    while (questions.length < QUESTIONS_PER_QUIZ) {
      questions.push({
        question: `Based on "${article.title}", what is a key implication of this report?`,
        options: [
          'It signals a shift in current policy or strategy.',
          'It reflects growing public concern on the topic.',
          'It introduces a new perspective previously unexplored.',
          'It confirms existing trends without major changes.'
        ],
        correctAnswerIndex: 0,
        explanation: 'This article introduces significant developments that point to evolving strategies.',
        userAnswerIndex: null,
        isAnswered: false,
        isCorrect: false,
      });
    }

    const quizData = {
      articleTitle: article.title,
      articleUrl: article.link || '',
      category: category || 'general',
      source: article.source || 'News',
      questions,
      articleSummary: parsed.articleSummary || '',
      keyTakeaways: parsed.keyTakeaways || '',
      totalQuestions: questions.length,
      answeredCount: 0,
      correctCount: 0,
      xpAwarded: 0,
      isAnswered: 0,   // 0 until all answered
      isCorrect: 0,     // 1 if got majority correct
      isFullyAnswered: 0,
      createdAt: new Date().toISOString(),
    };

    const id = await db.newsQuizzes.add(quizData);
    const saved = { id, ...quizData };

    await addNotification(
      'news_quiz',
      `📰 **5-Question Quiz Ready!**\n\nArticle: *${article.title}*\n\nAI has analyzed the full article and created **5 deep questions**. Earn up to **+50 XP**! 🧠`,
      { quizId: id, articleTitle: article.title, articleUrl: article.link || '', category }
    );

    return saved;
  } catch (error) {
    console.error('Error generating news quiz with Gemini:', error);
    return await generateFallbackQuiz(article, category);
  }
}

/**
 * Fallback quiz when API is unavailable — still 5 questions but heuristic.
 */
async function generateFallbackQuiz(article, category) {
  const questions = [];
  const templates = [
    { q: `What is the primary focus of "${article.title}"?`, opts: ['Reporting new developments and their implications', 'Providing historical background on the topic', 'Offering opinion and editorial commentary', 'Announcing upcoming policy changes'], correct: 0 },
    { q: `Which stakeholder group is most directly affected by this news?`, opts: ['Government and regulatory bodies', 'Industry professionals and businesses', 'General public and consumers', 'Academic and research institutions'], correct: 1 },
    { q: `What broader trend does this article likely connect to?`, opts: ['Growing digital transformation across sectors', 'Shifting geopolitical dynamics', 'Increasing public demand for transparency', 'Evolving regulatory frameworks'], correct: 0 },
    { q: `If the developments in this article continue, what is the most likely outcome?`, opts: ['Increased regulation and oversight', 'Market disruption and new opportunities', 'Greater public awareness and debate', 'Status quo maintained with minor adjustments'], correct: 1 },
    { q: `What critical perspective might be missing from this reporting?`, opts: ['Impact on marginalized communities', 'Long-term environmental consequences', 'International comparative analysis', 'Historical precedents and lessons learned'], correct: 3 },
  ];

  for (let i = 0; i < QUESTIONS_PER_QUIZ; i++) {
    const t = templates[i];
    questions.push({
      question: t.q,
      options: t.opts,
      correctAnswerIndex: t.correct,
      explanation: `This question tests analytical thinking about "${article.title}".`,
      userAnswerIndex: null,
      isAnswered: false,
      isCorrect: false,
    });
  }

  const quizData = {
    articleTitle: article.title,
    articleUrl: article.link || '',
    category: category || 'general',
    source: article.source || 'News Hub',
    questions,
    articleSummary: '',
    keyTakeaways: '',
    totalQuestions: QUESTIONS_PER_QUIZ,
    answeredCount: 0,
    correctCount: 0,
    xpAwarded: 0,
    isAnswered: 0,
    isCorrect: 0,
    isFullyAnswered: 0,
    createdAt: new Date().toISOString(),
  };

  const id = await db.newsQuizzes.add(quizData);
  const saved = { id, ...quizData };

  await addNotification(
    'news_quiz',
    `📰 **5-Question Quiz Ready!**\n\nArticle: *${article.title}*\n\nTest your knowledge — earn up to **+50 XP**! 🧠`,
    { quizId: id, articleTitle: article.title, articleUrl: article.link || '', category }
  );

  return saved;
}

/**
 * Answers a single question within a multi-question quiz.
 * Awards 10 XP per correct answer immediately.
 */
export async function answerQuizQuestion(quizId, questionIndex, selectedOptionIndex) {
  const numericId = Number(quizId);
  const quiz = await db.newsQuizzes.get(numericId);

  if (!quiz) throw new Error('News quiz not found');

  const questions = quiz.questions || [];
  if (questionIndex < 0 || questionIndex >= questions.length) {
    throw new Error('Invalid question index');
  }

  const question = questions[questionIndex];
  if (question.isAnswered) {
    return {
      alreadyAnswered: true,
      isCorrect: question.isCorrect,
      correctAnswerIndex: question.correctAnswerIndex,
      userAnswerIndex: question.userAnswerIndex,
      explanation: question.explanation,
      xpAwarded: 0,
      quiz,
    };
  }

  const isCorrect = Number(selectedOptionIndex) === Number(question.correctAnswerIndex);
  const xpToAward = isCorrect ? XP_PER_CORRECT : 0;

  // Update the specific question
  questions[questionIndex] = {
    ...question,
    userAnswerIndex: Number(selectedOptionIndex),
    isAnswered: true,
    isCorrect,
  };

  // Recalculate totals
  const answeredCount = questions.filter(q => q.isAnswered).length;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const totalXpAwarded = (quiz.xpAwarded || 0) + xpToAward;
  const isFullyAnswered = answeredCount >= questions.length ? 1 : 0;

  // Award XP immediately for correct answer
  if (isCorrect) {
    await awardXP('news_quiz_correct', XP_PER_CORRECT);
  }

  await db.newsQuizzes.update(numericId, {
    questions,
    answeredCount,
    correctCount,
    xpAwarded: totalXpAwarded,
    isAnswered: isFullyAnswered,
    isCorrect: correctCount > questions.length / 2 ? 1 : 0,
    isFullyAnswered,
  });

  const updatedQuiz = await db.newsQuizzes.get(numericId);

  return {
    alreadyAnswered: false,
    isCorrect,
    correctAnswerIndex: question.correctAnswerIndex,
    userAnswerIndex: Number(selectedOptionIndex),
    explanation: question.explanation,
    xpAwarded: xpToAward,
    answeredCount,
    correctCount,
    totalQuestions: questions.length,
    isFullyAnswered: Boolean(isFullyAnswered),
    quiz: updatedQuiz,
  };
}
