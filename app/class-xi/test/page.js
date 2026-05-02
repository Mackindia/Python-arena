"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const allQuestions = [
  // Critical Thinking (10 questions)
  {
    id: 1,
    category: "Critical Thinking",
    question: "Statements: Importance of Yoga and exercise is being realized by all sections of the society. There is an increasing awareness about health in the society particularly among middle ages group of people.",
    options: [
      "Statement I is the cause and statement II is its effect.",
      "Statement II is the cause and statement I is its effect.",
      "Both the statements I and II are independent causes.",
      "Both the statements I and II are effects of independent causes.",
      "Both the statements I and II are effects of some common cause."
    ],
    correct: 4,
  },
  {
    id: 2,
    category: "Critical Thinking",
    question: "Statements: All mangoes are golden in color. No golden-colored things are cheap. Conclusions: All mangoes are cheap. Golden-colored mangoes are not cheap.",
    options: [
      "Only conclusion I follows",
      "Only conclusion II follows",
      "Either I or II follows",
      "Neither I nor II follows",
      "Both I and II follow"
    ],
    correct: 1,
  },
  {
    id: 3,
    category: "Critical Thinking",
    question: "Which of the following best describes a problem-solving mindset?",
    options: [
      "Ignoring challenges.",
      "Blaming others.",
      "Seeing obstacles as opportunities.",
      "Avoiding risks."
    ],
    correct: 2,
  },
  {
    id: 4,
    category: "Critical Thinking",
    question: "Argument: 'People generally wear light-coloured clothes in summer.' Which statement strengthens this argument?",
    options: [
      "They are easy to wash.",
      "Light-coloured clothes are bad absorbers of heat.",
      "These clothes are thick and warm.",
      "They are cheap."
    ],
    correct: 1,
  },
  {
    id: 5,
    category: "Critical Thinking",
    question: "A decision benefits 80% of people but harms 20%. What is the most logical approach?",
    options: [
      "Ignore the 20%",
      "Cancel the decision",
      "Try to reduce harm while keeping benefits",
      "Focus only on majority"
    ],
    correct: 2,
  },
  {
    id: 6,
    category: "Critical Thinking",
    question: "A person is facing north. They turn right, then right again. Which direction are they facing?",
    options: [
      "East",
      "South",
      "West",
      "North"
    ],
    correct: 1,
  },
  {
    id: 7,
    category: "Critical Thinking",
    question: "You are given two solutions to a problem—one is quick but risky, the other is slow but reliable. What should you do?",
    options: [
      "Always choose the quick one",
      "Always choose the slow one",
      "Evaluate the situation before deciding",
      "Avoid making a decision"
    ],
    correct: 2,
  },
  {
    id: 8,
    category: "Critical Thinking",
    question: "Statements: Some books are pens. All pens are papers. No paper is plastic. Conclusion:",
    options: [
      "Some books are plastic",
      "Some books are papers",
      "All books are papers",
      "No books are papers"
    ],
    correct: 1,
  },
  {
    id: 9,
    category: "Critical Thinking",
    question: "Ravi says: 'The woman is the daughter of my grandfather's only son.' Who is the woman to Ravi?",
    options: [
      "Sister",
      "Cousin",
      "Mother",
      "Aunt"
    ],
    correct: 0,
  },
  {
    id: 10,
    category: "Critical Thinking",
    question: "Statement: 'We should reduce plastic use to protect the environment.' Which assumption is implicit?",
    options: [
      "Plastic has no benefits",
      "Plastic harms the environment",
      "Environment cannot be protected",
      "People don't use plastic"
    ],
    correct: 1,
  },

  // Logic Based (10 questions)
  {
    id: 11,
    category: "Logic Based",
    question: "What number should come next: 80, 10, 70, 15, 60, ...?",
    options: ["70", "100", "20", "5"],
    correct: 2,
  },
  {
    id: 12,
    category: "Logic Based",
    question: "What number comes next in the sequence: 3, 9, 27, ?, 243?",
    options: ["18", "81", "30", "15"],
    correct: 1,
  },
  {
    id: 13,
    category: "Logic Based",
    question: "I am an odd number. Take away one letter and I become even. What number am I?",
    options: ["Eleven", "Seven", "Thirteen", "Twenty-one"],
    correct: 0,
  },
  {
    id: 14,
    category: "Logic Based",
    question: "There are five apples in a basket. If you take away three, how many do you have?",
    options: ["Two", "Three", "Five", "Zero"],
    correct: 1,
  },
  {
    id: 15,
    category: "Logic Based",
    question: "Diamond is harder than Gold. Platinum is harder than diamond. Gold is softer than Platinum. If the first two statements are true, the third statement is-",
    options: ["True", "False"],
    correct: 0,
  },
  {
    id: 16,
    category: "Logic Based",
    question: "Which word does not belong with the others?",
    options: ["Index", "Glossary", "Chapter", "Book"],
    correct: 3,
  },
  {
    id: 17,
    category: "Logic Based",
    question: "CUP: LIP :: BIRD: ......",
    options: ["Grass", "Forest", "Beak", "Bush"],
    correct: 2,
  },
  {
    id: 18,
    category: "Logic Based",
    question: "Look at this series: 12, 11, 13, 12, 14, 13, … What number should come next?",
    options: ["10", "16", "13", "15"],
    correct: 1,
  },
  {
    id: 19,
    category: "Logic Based",
    question: "Find next letter: A, C, F, J, O, ?",
    options: ["T", "U", "V", "W"],
    correct: 0,
  },
  {
    id: 20,
    category: "Logic Based",
    question: "If 5 machines take 5 minutes to make 5 items, how long will 100 machines take to make 100 items?",
    options: ["5 minutes", "10 minutes", "100 minutes", "1 minute"],
    correct: 0,
  },

  // Situation Based (6 questions)
  {
    id: 21,
    category: "Situation Based",
    question: "You hear a rumour that a teacher is going to change the strict seating plan, but you aren't sure if it's true. What is the most appropriate action?",
    options: [
      "Spread the rumour immediately so others are prepared.",
      "Ignore the rumour completely.",
      "Ask the teacher directly if the information is accurate before acting.",
      "Post about it on social media to see if others heard it."
    ],
    correct: 2,
  },
  {
    id: 22,
    category: "Situation Based",
    question: "A council member has not been attending meetings and is failing their classes. What is the best course of action?",
    options: [
      "Ignore it because they are your friend.",
      "Secretly vote them out immediately.",
      "Speak to them privately, express concern, and discuss a solution, following school rules.",
      "Post about it on the group chat."
    ],
    correct: 2,
  },
  {
    id: 23,
    category: "Situation Based",
    question: "Which of the following is an opinion?",
    options: [
      "The school day begins at 8:00 AM.",
      "Reading books improves vocabulary.",
      "Math is easier than History.",
      "Water freezes at 0 degrees Celsius."
    ],
    correct: 2,
  },
  {
    id: 24,
    category: "Situation Based",
    question: "A popular student promises that if elected, they will abolish homework and extend lunch times. As a candidate, you know the council cannot change these policies. What is the most constructive action?",
    options: [
      "Make similar promises to ensure you get votes.",
      "Publicly confront the student and call them a liar.",
      "Explain that this isn't possible but pledge to discuss more reasonable, student-suggested changes with administration.",
      "Stay quiet to avoid conflict with the popular student."
    ],
    correct: 2,
  },
  {
    id: 25,
    category: "Situation Based",
    question: "How do you define 'leadership' in a student council member?",
    options: [
      "Telling other students what to do.",
      "Being the loudest voice in the room.",
      "Representing the student body's voice, acting with integrity, and serving others.",
      "Having the highest grades in the school."
    ],
    correct: 2,
  },
  {
    id: 26,
    category: "Situation Based",
    question: "When considering a new school policy, what is the best first step?",
    options: [
      "Immediately support it to show loyalty to the authorities.",
      "Review all perspectives—pros and cons—before forming an opinion.",
      "Ask your friends what they think and do the same.",
      "Oppose it because change is usually difficult"
    ],
    correct: 1,
  },

  // General Knowledge (8 questions)
  {
    id: 27,
    category: "General Knowledge",
    question: "India's GST collection in FY26 crossed approximately:",
    options: [
      "₹15 lakh crore",
      "₹18 lakh crore",
      "₹22 lakh crore",
      "₹25 lakh crore"
    ],
    correct: 2,
  },
  {
    id: 28,
    category: "General Knowledge",
    question: "India recently topped the medal tally in which event?",
    options: [
      "Asian Games",
      "ISSF Junior World Cup (Cairo)",
      "Commonwealth Games",
      "Olympics"
    ],
    correct: 1,
  },
  {
    id: 29,
    category: "General Knowledge",
    question: "Recently, which major expressway project was extended toward Uttarakhand?",
    options: [
      "Yamuna Expressway",
      "Ganga Expressway",
      "Delhi–Mumbai Expressway",
      "Purvanchal Expressway"
    ],
    correct: 1,
  },
  {
    id: 30,
    category: "General Knowledge",
    question: "Uttarakhand Board Class 10th pass percentage in 2026 was approximately:",
    options: [
      "85.10%",
      "90.50%",
      "92.10%",
      "95.00%"
    ],
    correct: 2,
  },
  {
    id: 31,
    category: "General Knowledge",
    question: "Which vital maritime bottleneck connects the Persian Gulf to the Arabian Sea, frequently cited in discussions about maritime security and regional tensions?",
    options: [
      "Strait of Malacca.",
      "Strait of Gibraltar.",
      "Suez Canal.",
      "Strait of Hormuz."
    ],
    correct: 3,
  },
  {
    id: 32,
    category: "General Knowledge",
    question: "The Russia–Ukraine war (ongoing since 2022) has recently entered which phase in 2026?",
    options: [
      "Ceasefire phase",
      "Fifth year of conflict",
      "Peace treaty signed",
      "Fully resolved war"
    ],
    correct: 1,
  },
  {
    id: 33,
    category: "General Knowledge",
    question: "Which war is currently involving the United States and Israel against Iran?",
    options: [
      "Gulf War",
      "2026 Iran War",
      "Iraq War",
      "Syria Civil War"
    ],
    correct: 1,
  },
  {
    id: 34,
    category: "General Knowledge",
    question: "One major global impact of current wars in the Middle East is:",
    options: [
      "Oil prices remain stable",
      "Global food surplus",
      "Disruption of oil supply routes like Strait of Hormuz",
      "No effect on world economy"
    ],
    correct: 2,
  },
];

export default function TestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [testStarted, setTestStarted] = useState(false);
  const [categoryScores, setCategoryScores] = useState({});

  // Timer effect
  useEffect(() => {
    if (!testStarted || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, showResults, currentQuestion]);

  const handleTimeUp = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(60);
    } else {
      handleTestComplete();
    }
  };

  const handleAnswer = (optionIndex) => {
    const question = allQuestions[currentQuestion];
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: optionIndex,
    });

    if (optionIndex === question.correct) {
      setScore(score + 1);
      setCategoryScores({
        ...categoryScores,
        [question.category]: (categoryScores[question.category] || 0) + 1,
      });
    }

    if (currentQuestion < allQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(60);
      }, 500);
    } else {
      handleTestComplete();
    }
  };

  const handleTestComplete = () => {
    setShowResults(true);
  };

  const startTest = () => {
    setTestStarted(true);
    setTimeLeft(60);
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswers({});
    setTimeLeft(60);
    setTestStarted(false);
    setCategoryScores({});
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 py-12 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-neon transition-colors mb-8"
        >
          ← Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-ink-800 bg-ink-900/50 backdrop-blur-sm p-8 sm:p-12 text-center"
          >
            <h1 className="text-4xl font-bold text-ink-50 mb-4">
              DOON SCHOLARS
            </h1>
            <p className="text-xl text-neon mb-2">
              Student Council Entrance Preliminary Test
            </p>

            <div className="bg-ink-800/30 rounded-lg p-6 my-8 border border-ink-700">
              <h2 className="text-2xl font-semibold text-ink-50 mb-4">
                Test Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-ink-400">Total Questions</p>
                  <p className="text-2xl font-bold text-neon">{allQuestions.length}</p>
                </div>
                <div>
                  <p className="text-ink-400">Time per Question</p>
                  <p className="text-2xl font-bold text-neon">1 Minute</p>
                </div>
                <div>
                  <p className="text-ink-400">Total Time</p>
                  <p className="text-2xl font-bold text-neon">{allQuestions.length} Minutes</p>
                </div>
                <div>
                  <p className="text-ink-400">Sections</p>
                  <p className="text-2xl font-bold text-neon">4</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-lg p-6 mb-8 text-left">
              <p className="text-ink-200 mb-3">
                <span className="font-semibold text-cyan-400">Sections:</span>
              </p>
              <ul className="space-y-2 text-ink-300">
                <li>• <span className="font-semibold">Critical Thinking</span> - 10 questions</li>
                <li>• <span className="font-semibold">Logic Based</span> - 10 questions</li>
                <li>• <span className="font-semibold">Situation Based</span> - 6 questions</li>
                <li>• <span className="font-semibold">General Knowledge</span> - 8 questions</li>
              </ul>
            </div>

            <button
              onClick={startTest}
              className="px-8 py-3 font-semibold text-ink-950 bg-neon rounded-lg hover:bg-neon/90 transition-all text-lg"
            >
              Start Test →
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const categoryNames = ["Critical Thinking", "Logic Based", "Situation Based", "General Knowledge"];
    const categoryTotals = {
      "Critical Thinking": 10,
      "Logic Based": 10,
      "Situation Based": 6,
      "General Knowledge": 8,
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 py-12 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Score Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
                className="inline-block mb-6"
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-neon to-cyan-400 flex flex-col items-center justify-center">
                  <span className="text-6xl font-bold text-ink-950">
                    {Math.round((score / allQuestions.length) * 100)}%
                  </span>
                  <span className="text-sm text-ink-950 font-semibold mt-2">Score</span>
                </div>
              </motion.div>

              <h1 className="text-4xl font-bold text-ink-50 mb-2 mt-6">
                Test Complete!
              </h1>
              <p className="text-2xl text-neon mb-2">
                You scored {score} out of {allQuestions.length}
              </p>

              {score === allQuestions.length && (
                <p className="text-lg text-cyan-400 mb-4">
                  🎉 Perfect Score! Outstanding performance!
                </p>
              )}
              {score >= allQuestions.length * 0.8 && score < allQuestions.length && (
                <p className="text-lg text-cyan-400 mb-4">
                  ✨ Excellent! Keep this up!
                </p>
              )}
              {score >= allQuestions.length * 0.6 && score < allQuestions.length * 0.8 && (
                <p className="text-lg text-yellow-400 mb-4">
                  👍 Good performance! Practice more!
                </p>
              )}
              {score < allQuestions.length * 0.6 && (
                <p className="text-lg text-orange-400 mb-4">
                  💡 Keep practicing! Review the concepts!
                </p>
              )}
            </div>

            {/* Category-wise Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {categoryNames.map((category) => {
                const correct = categoryScores[category] || 0;
                const total = categoryTotals[category];
                const percentage = Math.round((correct / total) * 100);

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-ink-800/30 border border-ink-700 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-ink-50 mb-3">
                      {category}
                    </h3>
                    <div className="mb-3">
                      <div className="h-3 bg-ink-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            percentage >= 80
                              ? "bg-green-500"
                              : percentage >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-300">
                        {correct}/{total} Correct
                      </span>
                      <span
                        className={`font-bold ${
                          percentage >= 80
                            ? "text-green-400"
                            : percentage >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Answer Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-ink-800/30 rounded-lg p-6 border border-ink-700 mb-8"
            >
              <h2 className="text-2xl font-bold text-ink-50 mb-6">
                Answer Review
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allQuestions.map((q, idx) => {
                  const isCorrect = selectedAnswers[idx] === q.correct;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? "bg-green-900/20 border-green-600/50"
                          : "bg-red-900/20 border-red-600/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-ink-50">
                          Q{idx + 1}. {q.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded text-sm font-bold ${
                            isCorrect
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {isCorrect ? "✓ Correct" : "✗ Wrong"}
                        </span>
                      </div>
                      <p className="text-ink-300 text-sm mb-2">
                        Your Answer: <span className="text-neon">{q.options[selectedAnswers[idx]]}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-ink-300 text-sm">
                          Correct Answer: <span className="text-green-400">{q.options[q.correct]}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetTest}
                className="px-8 py-3 font-semibold text-ink-950 bg-neon rounded-lg hover:bg-neon/90 transition-all"
              >
                Retake Test
              </button>
              <Link
                href="/"
                className="px-8 py-3 font-semibold text-neon border border-neon rounded-lg hover:bg-neon/10 transition-all text-center"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const question = allQuestions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / allQuestions.length) * 100;
  const timerColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-yellow-400" : "text-neon";

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 py-12 sm:px-10 lg:px-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-neon transition-colors mb-8"
      >
        ← Back to Home
      </Link>

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-lg border border-ink-800 bg-ink-900/50 backdrop-blur-sm p-8 sm:p-12"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-ink-400 mb-1">
                  {question.category}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink-50">
                  Question {currentQuestion + 1} of {allQuestions.length}
                </h1>
              </div>
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: timeLeft <= 10 ? 1.1 : 1 }}
                className={`text-4xl font-bold ${timerColor} text-center min-w-20`}
              >
                {timeLeft}
                <p className="text-xs text-ink-400 mt-1">seconds</p>
              </motion.div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-ink-50 mb-6 leading-relaxed">
              {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswers[currentQuestion] !== undefined}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 font-medium disabled:cursor-not-allowed ${
                    selectedAnswers[currentQuestion] === index
                      ? "border-neon bg-neon/10 text-neon"
                      : "border-ink-700 bg-ink-800/30 text-ink-200 hover:border-neon/50 hover:bg-ink-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedAnswers[currentQuestion] === index
                          ? "border-neon bg-neon text-ink-950"
                          : "border-ink-600"
                      }`}
                    >
                      {selectedAnswers[currentQuestion] === index && (
                        <span className="text-sm font-bold">✓</span>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
              }}
              disabled={currentQuestion === 0 || selectedAnswers[currentQuestion] === undefined}
              className="px-6 py-2 text-sm font-semibold text-ink-400 border border-ink-700 rounded-lg hover:border-ink-500 hover:text-ink-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {selectedAnswers[currentQuestion] !== undefined && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-cyan-400 font-semibold"
              >
                ✓ Answer Selected
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
