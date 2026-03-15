"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  BookOpen, 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CourseViewerPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      // 1. Fetch Course Basic Info
      const { data: courseData, error: courseError } = await supabase
        .schema("bpm-anec-global")
        .from("learning_management")
        .select("*")
        .eq("id", id)
        .single();

      if (courseError) throw courseError;

      if (courseData) {
        // 2. Fetch Lessons separately to avoid schema join issues
        const { data: lessonData, error: lessonError } = await supabase
          .schema("bpm-anec-global")
          .from("learning_lessons")
          .select("*")
          .eq("course_id", id)
          .order("order_index");

        if (lessonError) {
          console.error("Error fetching lessons:", lessonError);
        }

        const sortedLessons = (lessonData || []).sort(
          (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
        );

        setCourse({
          ...courseData,
          lessons: sortedLessons,
        });

        // 3. Fetch Quiz
        if (courseData.has_quiz) {
          const { data: quizData } = await supabase
            .schema("bpm-anec-global")
            .from("learning_quizzes")
            .select("*, questions:learning_quiz_questions(*)")
            .eq("course_id", id)
            .maybeSingle();
          
          if (quizData) {
            setQuiz(quizData);
          }
        }

        // 4. Fetch Enrollment info
        const { data: enrollData } = await supabase
          .schema("bpm-anec-global")
          .from("training_management")
          .select("id, status")
          .eq("course_id", id)
          .eq("employee_id", (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();
        
        if (enrollData) {
          setEnrollment(enrollData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching course:", err);
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCourse = async (score?: number) => {
    if (!enrollment?.id) {
       toast.error("No enrollment found for this course");
       return router.back();
    }

    setIsSubmitting(true);
    try {
      const { updateEnrollmentStatus } = await import("@/app/actions/hr");
      const status = score !== undefined ? (score >= (quiz?.passing_score || 70) ? "Completed" : "Failed") : "Completed";
      
      // We pass the score string to training_result
      const res = await updateEnrollmentStatus(enrollment.id, status);
      
      if (res.success) {
        toast.success(status === "Completed" ? "Course completed successfully!" : "Course finished, but passing score not reached.");
        router.back();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update course status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerSubmit = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < (quiz.questions?.length - 1)) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate Result
      let correctCount = 0;
      quiz.questions.forEach((q: any, idx: number) => {
        if (q.correct_answer_index === newAnswers[idx]) {
          correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
      setQuizResult({
        score: finalScore,
        passed: finalScore >= (quiz.passing_score || 70)
      });
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    
    // If it's already an embed URL, return it
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    let videoId = "";
    try {
      if (url.includes("v=")) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get("v") || "";
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split(/[?#]/)[0];
      } else if (url.includes("youtube.com/shorts/")) {
         videoId = url.split("youtube.com/shorts/")[1].split(/[?#]/)[0];
      }
    } catch (e) {
      // Fallback for non-URL strings that might be just IDs
      if (!url.includes("/") && url.length > 5) {
        videoId = url;
      }
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : url;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Course Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-md">The course you are looking for does not exist or has been removed.</p>
        <Button 
          onClick={() => router.back()}
          className="bg-slate-900 text-white font-black rounded-xl px-8 h-12"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const activeLesson = course.lessons?.[activeLessonIndex];

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-px w-6 bg-slate-100" />
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 truncate max-w-[300px] uppercase tracking-tight">
              {course.course_name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-500"
                  style={{ width: `${((activeLessonIndex + 1) / course.lessons?.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Lesson {activeLessonIndex + 1} of {course.lessons?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
          >
            Exit Course
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop Only for now */}
        <aside className="hidden lg:flex w-80 bg-slate-50 border-r border-slate-100 flex-col shrink-0">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Course Contents</h3>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {course.lessons?.map((lesson: any, idx: number) => (
              <button
                key={lesson.id || idx}
                onClick={() => setActiveLessonIndex(idx)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  activeLessonIndex === idx
                    ? "bg-white border-purple-200 shadow-sm ring-1 ring-purple-100"
                    : "bg-transparent border-transparent hover:bg-white/50"
                }`}
              >
                <div className="flex gap-3 items-center">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeLessonIndex === idx
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                        : "bg-white text-slate-400 border border-slate-100 shadow-sm"
                    }`}
                  >
                    {lesson.content_type === "youtube" ? (
                      <PlayCircle className="h-5 w-5" />
                    ) : lesson.content_type === "pdf" ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-black truncate uppercase tracking-tight ${
                        activeLessonIndex === idx
                          ? "text-purple-600"
                          : "text-slate-600"
                      }`}
                    >
                      {lesson.title || `Lesson ${idx + 1}`}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {lesson.content_type === "youtube" ? "Video Lesson" : lesson.content_type === "pdf" ? "Document" : "Reading"}
                    </p>
                  </div>
                  {activeLessonIndex > idx && (
                    <div className="ml-auto h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
            <div className="mx-auto max-w-4xl w-full">
              {isQuizMode ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-widest">
                        Final Assessment
                      </span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      {course.course_name} Quiz
                    </h2>
                  </div>

                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[50vh] flex flex-col p-8 lg:p-16">
                    {quizResult ? (
                      <div className="flex flex-col items-center justify-center text-center space-y-6 flex-1 py-12">
                        <div className={`h-24 w-24 rounded-full flex items-center justify-center ${quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {quizResult.passed ? <CheckCircle2 className="h-12 w-12" /> : <X className="h-12 w-12" />}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {quizResult.passed ? "Congratulations!" : "Keep Trying!"}
                          </h3>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                            You scored {quizResult.score}%
                          </p>
                          <p className="text-slate-400 text-sm mt-4">
                            {quizResult.passed 
                              ? "You have successfully passed the assessment and met the completion requirements." 
                              : `A passing score of ${quiz.passing_score}% is required to complete this course.`}
                          </p>
                        </div>
                        <div className="pt-8 w-full max-w-xs flex gap-4">
                           {!quizResult.passed && (
                             <Button 
                               variant="outline"
                               onClick={() => {
                                 setQuizResult(null);
                                 setCurrentQuestionIndex(0);
                                 setUserAnswers([]);
                               }}
                               className="flex-1 h-14 rounded-2xl border-slate-100 font-black text-[12px] uppercase tracking-widest"
                             >
                               Retry Quiz
                             </Button>
                           )}
                           <Button 
                             onClick={() => handleCompleteCourse(quizResult.score)}
                             disabled={isSubmitting}
                             className={`flex-1 h-14 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl ${quizResult.passed ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                           >
                             {isSubmitting ? "Syncing..." : quizResult.passed ? "Complete Course" : "Exit Result"}
                           </Button>
                        </div>
                      </div>
                    ) : quiz?.questions?.length > 0 ? (
                      <div className="flex flex-col flex-1">
                        <div className="mb-8">
                           <div className="flex justify-between items-center mb-4">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                               Question {currentQuestionIndex + 1} of {quiz.questions.length}
                             </p>
                             <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600 transition-all duration-300"
                                  style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                                />
                             </div>
                           </div>
                           <h3 className="text-2xl font-black text-slate-900 leading-tight">
                             {quiz.questions[currentQuestionIndex].question_text}
                           </h3>
                        </div>

                        <div className="space-y-4 flex-1">
                           {quiz.questions[currentQuestionIndex].options.map((option: string, idx: number) => (
                             <button
                               key={idx}
                               onClick={() => handleAnswerSubmit(idx)}
                               className="w-full text-left p-6 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all flex items-center justify-between group"
                             >
                               <span className="font-bold text-slate-600 group-hover:text-purple-700">{option}</span>
                               <div className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-purple-300">
                                 <div className="h-2 w-2 rounded-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                             </button>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-12">
                         <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Assessment Found</p>
                         <Button 
                           onClick={() => handleCompleteCourse()}
                           className="mt-8 h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black text-[12px] uppercase tracking-widest px-10 shadow-xl shadow-purple-200"
                         >
                           Complete Course
                         </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeLesson ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-widest">
                        Lesson {activeLessonIndex + 1}
                      </span>
                      {activeLesson.content_type && (
                         <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                          {activeLesson.content_type}
                        </span>
                      )}
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      {activeLesson.title}
                    </h2>
                  </div>

                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[60vh] flex flex-col">
                    {/* Content Rendering Based on Type */}
                    <div className="flex-1">
                      {activeLesson.content_type === "youtube" && (
                        <div className="aspect-video w-full">
                          <iframe
                            src={getYoutubeEmbedUrl(activeLesson.youtube_url)}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {activeLesson.content_type === "pdf" && (
                        <div className="w-full h-[80vh]">
                          <iframe
                            src={activeLesson.file_url}
                            className="w-full h-full border-none"
                            title="PDF Content"
                          />
                        </div>
                      )}

                      {(activeLesson.content_type === "text" || !activeLesson.content_type) && (
                        <div className="p-8 lg:p-16 prose prose-purple max-w-none">
                          <div className="text-slate-700 font-medium text-lg leading-relaxed whitespace-pre-wrap">
                            {activeLesson.file_url || activeLesson.description || "No content provided for this lesson."}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Lesson Navigation */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                      <Button
                        variant="ghost"
                        disabled={activeLessonIndex === 0}
                        onClick={() => setActiveLessonIndex(prev => prev - 1)}
                        className="h-12 rounded-xl px-6 font-black text-[12px] uppercase tracking-widest text-slate-400 gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </Button>

                      <Button
                        onClick={() => {
                          if (activeLessonIndex < (course.lessons?.length - 1)) {
                            setActiveLessonIndex(prev => prev + 1);
                          } else {
                            if (course.has_quiz) {
                              setIsQuizMode(true);
                            } else {
                              handleCompleteCourse();
                            }
                          }
                        }}
                        className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[12px] uppercase tracking-widest px-10 gap-2 shadow-xl shadow-purple-200"
                      >
                       {activeLessonIndex < (course.lessons?.length - 1) ? (
                         <>Next Lesson <ArrowRight className="h-4 w-4" /></>
                       ) : course.has_quiz ? (
                         <>Take Assessment <ArrowRight className="h-4 w-4" /></>
                       ) : (
                         <>Complete Course <CheckCircle2 className="h-4 w-4" /></>
                       )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[60vh] flex-col items-center justify-center text-slate-400">
                  <PlayCircle className="h-16 w-16 mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm">Select a lesson to begin</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
