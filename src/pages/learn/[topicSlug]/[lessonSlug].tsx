import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { getTopic, getLesson } from '@/lib/academy-data';
import { useAcademy } from '@/hooks/useAcademy';

export default function AcademyLessonPage() {
  const { topicSlug, lessonSlug } = useParams<{ topicSlug: string; lessonSlug: string }>();
  const navigate = useNavigate();
  const { data: sessionData, isPending } = authClient.useSession();
  const { isCompleted, isBookmarked, toggleBookmark, markViewed, markComplete, loading } = useAcademy();

  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('introduction');

  const topic = topicSlug ? getTopic(topicSlug) : undefined;
  const lesson = topicSlug && lessonSlug ? getLesson(topicSlug, lessonSlug) : undefined;

  useEffect(() => {
    if (!isPending && !sessionData?.session) {
      void navigate(`/login?redirect=/learn/${topicSlug ?? ''}/${lessonSlug ?? ''}`);
    }
  }, [isPending, sessionData, navigate, topicSlug, lessonSlug]);

  useEffect(() => {
    if (sessionData?.session && topicSlug && lessonSlug && !loading) {
      void markViewed(topicSlug, lessonSlug);
    }
  }, [sessionData?.session, topicSlug, lessonSlug, loading, markViewed]);

  if (isPending || loading) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: 'hsl(var(--primary))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!sessionData?.session) return null;

  if (!topic || !lesson) {
    return (
      <main className="max-w-content mx-auto px-5 sm:px-6 py-xxl text-center">
        <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Lesson not found.</p>
        <Link to="/learn" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Back to Academy</Link>
      </main>
    );
  }

  const done = isCompleted(topic.slug, lesson.slug);
  const bookmarked = isBookmarked(topic.slug, lesson.slug);
  const lessonIndex = topic.lessons.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = lessonIndex > 0 ? topic.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < topic.lessons.length - 1 ? topic.lessons[lessonIndex + 1] : null;

  const handleQuizSubmit = async () => {
    setQuizSubmitted(true);
    // eslint-disable-next-line security/detect-object-injection
    const correct = lesson.quiz.filter((q, i) => answers[i] === q.correctIndex).length;
    const score = lesson.quiz.length > 0 ? Math.round((correct / lesson.quiz.length) * 100) : 100;
    await markComplete(topic.slug, lesson.slug, score);
  };

  const quizScore = lesson.quiz.length > 0
    // eslint-disable-next-line security/detect-object-injection
    ? Math.round((lesson.quiz.filter((q, i) => answers[i] === q.correctIndex).length / lesson.quiz.length) * 100)
    : 100;

  const sections = [
    { key: 'introduction', label: 'Introduction', content: lesson.introduction },
    { key: 'history', label: 'History & Origins', content: lesson.history },
    { key: 'meaning', label: 'Meaning & Significance', content: lesson.meaning },
    { key: 'howToRead', label: 'How to Read / Apply', content: lesson.howToRead },
    { key: 'example', label: 'Example', content: lesson.example },
  ];

  return (
    <>
      <Helmet>
        <title>{lesson.title} — {topic.title} | Spellful Academy</title>
        <meta name="description" content={`${lesson.subtitle}. A ${lesson.level} lesson (${lesson.durationMinutes} min) in the ${topic.title} track of Spellful Academy.`} />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content={`${lesson.title} — Spellful Academy`} />
        <meta property="og:description" content={`${lesson.subtitle}. ${lesson.durationMinutes}-minute ${lesson.level} lesson with quiz and glossary.`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://spellful.com/learn/${topic.slug}/${lesson.slug}`} />
        <script type="application/ld+json">{`{"@context":"https://schema.org","@type":"LearningResource","name":"${lesson.title}","description":"${lesson.subtitle}","url":"https://spellful.com/learn/${topic.slug}/${lesson.slug}","learningResourceType":"lesson","educationalLevel":"${lesson.level}","timeRequired":"PT${lesson.durationMinutes}M","isPartOf":{"@type":"Course","name":"${topic.title}","url":"https://spellful.com/learn/${topic.slug}","provider":{"@id":"https://spellful.com/#organization"}}}`}</script>
      </Helmet>

      <main>
        {/* Breadcrumb + header */}
        <section
          className="py-xl"
          style={{ background: 'hsl(var(--card-deep))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-2 text-xs mb-4 flex-wrap" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              <Link to="/learn" style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>Academy</Link>
              <span>/</span>
              <Link to={`/learn/${topic.slug}`} style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>{topic.title}</Link>
              <span>/</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{lesson.title}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: lesson.level === 'beginner' ? 'hsl(var(--success) / 0.15)' : lesson.level === 'intermediate' ? 'hsl(var(--warning) / 0.15)' : 'hsl(var(--destructive) / 0.15)',
                      color: lesson.level === 'beginner' ? 'hsl(var(--success))' : lesson.level === 'intermediate' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {lesson.level}
                  </span>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <Clock className="w-3 h-3" />
                    {lesson.durationMinutes} min
                  </div>
                  {done && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--success))', fontFamily: 'var(--font-sans)' }}>
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {lesson.title}
                </h1>
                <p className="text-base mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {lesson.subtitle}
                </p>
              </div>

              <button
                onClick={() => void toggleBookmark(topic.slug, lesson.slug)}
                className="shrink-0 p-2 rounded-xl transition-opacity hover:opacity-70"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
              >
                {bookmarked
                  ? <BookmarkCheck className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                  : <Bookmark className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </button>
            </div>
          </div>
        </section>

        {/* Lesson content */}
        <section className="py-xl">
          <div className="max-w-3xl mx-auto px-4">
            {/* Accordion sections */}
            <div className="flex flex-col gap-3 mb-8">
              {sections.map((sec) => (
                <div
                  key={sec.key}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                >
                  <button
                    onClick={() => setExpandedSection(expandedSection === sec.key ? null : sec.key)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left transition-opacity hover:opacity-80"
                    style={{ background: 'transparent' }}
                  >
                    <span className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      {sec.label}
                    </span>
                    {expandedSection === sec.key
                      ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    }
                  </button>
                  {expandedSection === sec.key && (
                    <div className="px-6 pb-6">
                      <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {sec.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vocabulary */}
            {lesson.vocabulary.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  Key Terms
                </h2>
                <div className="flex flex-col gap-3">
                  {lesson.vocabulary.map((v) => (
                    <div
                      key={v.term}
                      className="p-4 rounded-xl"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                    >
                      <div className="font-semibold mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                        {v.term}
                      </div>
                      <div className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {v.definition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related tool */}
            {lesson.relatedTool && (
              <div
                className="flex items-center justify-between p-5 rounded-2xl mb-8"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}
              >
                <div>
                  <div className="text-xs mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Practice what you learned</div>
                  <div className="text-base" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{lesson.relatedTool.label}</div>
                </div>
                <Link
                  to={lesson.relatedTool.href}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                >
                  Open Tool
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Quiz */}
            {lesson.quiz.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  Knowledge Check
                </h2>

                {!quizStarted && !done && (
                  <div
                    className="p-6 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  >
                    <p className="mb-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      {lesson.quiz.length} question{lesson.quiz.length !== 1 ? 's' : ''} to test your understanding.
                    </p>
                    <button
                      onClick={() => setQuizStarted(true)}
                      className="px-6 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      Start Quiz
                    </button>
                  </div>
                )}

                {(quizStarted || done) && (
                  <div className="flex flex-col gap-6">
                    {lesson.quiz.map((q, qi) => (
                      <div
                        key={qi}
                        className="p-6 rounded-2xl"
                        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      >
                        <p className="text-base mb-4" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--foreground))' }}>
                          <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>Q{qi + 1}.</span> {q.question}
                        </p>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt, oi) => {
                            // eslint-disable-next-line security/detect-object-injection
                            const selected = answers[qi] === oi;
                            const correct = oi === q.correctIndex;
                            const showResult = quizSubmitted || done;
                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && !done && setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                disabled={quizSubmitted || done}
                                className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                                style={{
                                  fontFamily: 'var(--font-sans)',
                                  border: `1px solid ${showResult && correct ? 'hsl(var(--success))' : showResult && selected && !correct ? 'hsl(var(--destructive))' : selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                                  background: showResult && correct ? 'hsl(var(--success) / 0.1)' : showResult && selected && !correct ? 'hsl(var(--destructive) / 0.1)' : selected ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))',
                                  color: 'hsl(var(--foreground))',
                                  cursor: quizSubmitted || done ? 'default' : 'pointer',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {(quizSubmitted || done) && (
                          <p className="mt-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}

                    {!quizSubmitted && !done && (
                      <button
                        onClick={() => void handleQuizSubmit()}
                        disabled={Object.keys(answers).length < lesson.quiz.length}
                        className="px-6 py-3 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                      >
                        Submit Answers
                      </button>
                    )}

                    {(quizSubmitted || done) && (
                      <div
                        className="p-5 rounded-2xl text-center"
                        style={{ background: quizScore >= 70 ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--warning) / 0.1)', border: `1px solid ${quizScore >= 70 ? 'hsl(var(--success))' : 'hsl(var(--warning))'}` }}
                      >
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: quizScore >= 70 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }} />
                        <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                          {quizScore >= 70 ? 'Great work!' : 'Keep practicing!'}
                        </p>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          Lesson marked complete.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {done && !quizStarted && (
                  <div
                    className="p-5 rounded-2xl text-center"
                    style={{ background: 'hsl(var(--success) / 0.1)', border: '1px solid hsl(var(--success))' }}
                  >
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--success))' }} />
                    <p className="text-base" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      You completed this lesson!
                    </p>
                    <button
                      onClick={() => { setQuizStarted(true); setAnswers({}); setQuizSubmitted(false); }}
                      className="mt-3 text-sm transition-opacity hover:opacity-70"
                      style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Retake quiz
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {prevLesson ? (
                <Link
                  to={`/learn/${topic.slug}/${prevLesson.slug}`}
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {prevLesson.title}
                </Link>
              ) : (
                <Link
                  to={`/learn/${topic.slug}`}
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {topic.title}
                </Link>
              )}

              {nextLesson && (
                <Link
                  to={`/learn/${topic.slug}/${nextLesson.slug}`}
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                >
                  {nextLesson.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
