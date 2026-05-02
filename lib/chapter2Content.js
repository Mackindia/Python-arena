export const chapterMeta = {
  chapterNumber: 2,
  title: "Variables & Data Types",
  breadcrumb: ["Home", "Class XI", "Chapter 2"],
  progressPercent: 35,
};

export const topicOrder = [
  { id: "introduction", label: "Introduction" },
  { id: "variables", label: "Variables" },
  { id: "data-types", label: "Data Types" },
  { id: "examples", label: "Examples" },
  { id: "practice-questions", label: "Practice Questions" },
];

export const topicSections = [
  {
    id: "introduction",
    title: "Introduction",
    concept:
      "Python stores information while a program runs. This information can be text, numbers, or true/false values. In this chapter, you will learn how to save, update, and use these values in your own programs.",
    keyPoints: [
      "A value is any piece of data, such as 10 or 'Hello'.",
      "A variable is a name that refers to a value.",
      "Different data types are used for different tasks.",
    ],
    callout:
      "Think of memory as a school locker room. Each locker has a label, and each label can store one item at a time.",
    program: {
      code: "student_name = \"Aarav\"\nmarks = 92\nprint(student_name)\nprint(marks)",
      output: "Aarav\n92",
    },
    practice: {
      mcq: [
        {
          question: "Which statement is true?",
          options: [
            "A) Variables store websites",
            "B) Variables store data values",
            "C) Variables only store integers",
            "D) Variables cannot be printed",
          ],
          answer: "B",
          explanation: "Variables are names used to store data values that a program can use later.",
        },
      ],
      trueFalse: [
        {
          statement: "Python values can be numbers and text.",
          answer: "True",
        },
      ],
      short: [
        {
          question: "What is a variable in your own words?",
          sampleAnswer: "A variable is a named place in memory that stores a value used by the program.",
        },
      ],
    },
  },
  {
    id: "variables",
    title: "Variables",
    concept:
      "A variable is created when you assign a value using the equals sign. Python decides the type automatically. You can also change the value of the same variable later.",
    keyPoints: [
      "Variable names should be meaningful.",
      "Use lowercase and underscores for readability.",
      "Avoid reserved words like if, for, while as variable names.",
    ],
    callout:
      "A variable is like a labeled box. The label stays the same, but what is inside can change.",
    program: {
      code: "age = 16\nage = age + 1\nprint(\"Updated age:\", age)",
      output: "Updated age: 17",
    },
    practice: {
      mcq: [
        {
          question: "Which is the best variable name?",
          options: ["A) x1", "B) student_total_marks", "C) if", "D) 2marks"],
          answer: "B",
          explanation: "Meaningful names like student_total_marks are easy to understand and follow Python naming rules.",
        },
      ],
      trueFalse: [
        {
          statement: "You can reassign a new value to the same variable.",
          answer: "True",
        },
      ],
      short: [
        {
          question: "Write one variable name for storing mobile number.",
          sampleAnswer: "mobile_number",
        },
      ],
    },
    has3D: true,
  },
  {
    id: "data-types",
    title: "Data Types",
    concept:
      "Data type means the kind of data stored in a variable. Common Python data types are int, float, str, and bool.",
    keyPoints: [
      "int stores whole numbers, e.g., 25",
      "float stores decimal numbers, e.g., 3.14",
      "str stores text, e.g., 'Python'",
      "bool stores True or False",
    ],
    callout:
      "Correct data types help you perform correct operations. For example, math works on numbers, not plain text.",
    program: {
      code: "roll_no = 12\npercentage = 84.5\nstudent = \"Meera\"\nis_passed = True\n\nprint(type(roll_no))\nprint(type(percentage))\nprint(type(student))\nprint(type(is_passed))",
      output: "<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>",
    },
    practice: {
      mcq: [
        {
          question: "Which type is used for decimal values?",
          options: ["A) int", "B) bool", "C) float", "D) str"],
          answer: "C",
          explanation: "A float stores decimal numbers such as 84.5 or 3.14.",
        },
      ],
      trueFalse: [
        {
          statement: "'45' and 45 are the same type.",
          answer: "False",
        },
      ],
      short: [
        {
          question: "Give one example each of int and str values.",
          sampleAnswer: "int: 25, str: 'Python'",
        },
      ],
    },
  },
  {
    id: "examples",
    title: "Examples",
    concept:
      "Let us combine variables and data types in simple school-based examples. Practice changing values and observing outputs.",
    keyPoints: [
      "Use print statements to verify variable values.",
      "Use type() to inspect data types.",
      "Experiment by changing one line at a time.",
    ],
    callout:
      "Small experiments build coding confidence. Change values and run again.",
    program: {
      code: "subject = \"Computer Science\"\nperiods = 5\navg_score = 88.2\n\nprint(subject, \"periods:\", periods)\nprint(\"Average score:\", avg_score)",
      output: "Computer Science periods: 5\nAverage score: 88.2",
    },
    practice: {
      mcq: [
        {
          question: "What is type of avg_score in the above code?",
          options: ["A) int", "B) str", "C) float", "D) bool"],
          answer: "C",
          explanation: "The value 88.2 contains a decimal, so Python treats it as a float.",
        },
      ],
      trueFalse: [
        {
          statement: "type() can be used to check data type in Python.",
          answer: "True",
        },
      ],
      short: [
        {
          question: "Write a program that stores your name and age, then prints both.",
          sampleAnswer: "name = 'Riya'\nage = 16\nprint(name)\nprint(age)",
        },
      ],
    },
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    concept:
      "Use these mixed-format questions to check your understanding before moving to the next chapter.",
    keyPoints: [
      "Read each question carefully.",
      "Answer without looking at notes first.",
      "Review incorrect answers and revise the concept.",
    ],
    callout:
      "Practice is most effective when you explain why an answer is correct.",
    program: {
      code: "city = \"Dehradun\"\npincode = 248001\nprint(city, pincode)",
      output: "Dehradun 248001",
    },
    practice: {
      mcq: [
        {
          question: "Which option is a boolean value?",
          options: ["A) 10", "B) \"True\"", "C) True", "D) 2.5"],
          answer: "C",
          explanation: "True without quotes is the boolean value. \"True\" with quotes is a string.",
        },
        {
          question: "Choose a valid variable name:",
          options: ["A) my-name", "B) class", "C) total_marks", "D) 5score"],
          answer: "C",
          explanation: "total_marks uses letters and underscore correctly and does not start with a number.",
        },
      ],
      trueFalse: [
        {
          statement: "Variable names can start with a number.",
          answer: "False",
        },
        {
          statement: "A string must be inside quotes.",
          answer: "True",
        },
      ],
      short: [
        {
          question: "Differentiate between int and float with one example each.",
          sampleAnswer: "int stores whole numbers like 7, while float stores decimal numbers like 7.5.",
        },
        {
          question: "Why should variable names be meaningful?",
          sampleAnswer: "Meaningful names make code easier to read, understand, and debug.",
        },
      ],
    },
  },
];
