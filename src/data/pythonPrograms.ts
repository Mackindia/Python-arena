export type Category =
  | "Basics" | "Strings" | "Math & Logic" | "Loops & Patterns"
  | "Sets" | "Lists" | "Tuples" | "Dictionaries"
  | "Functions" | "File Handling" | "Error Handling" | "OOP"
  | "Modules & Projects" | "Number Systems"

export type ClassLevel = "Class 8" | "Class 9" | "Class 10" | "Class 11"
export type Difficulty = "Easy" | "Medium" | "Hard"
export type Language = "python" | "web"

export interface PythonProgram {
  id: string
  title: string
  language: Language
  category: Category
  difficulty: Difficulty
  classLevel: ClassLevel
  description: string
  code: string
  funFact?: string
}

export const categoryColors: Record<Category, { bg: string; text: string }> = {
  Basics: { bg: "bg-emerald-50", text: "text-emerald-700" },
  Strings: { bg: "bg-sky-50", text: "text-sky-700" },
  "Math & Logic": { bg: "bg-blue-50", text: "text-blue-700" },
  "Loops & Patterns": { bg: "bg-amber-50", text: "text-amber-700" },
  Sets: { bg: "bg-orange-50", text: "text-orange-700" },
  Lists: { bg: "bg-rose-50", text: "text-rose-700" },
  Tuples: { bg: "bg-cyan-50", text: "text-cyan-700" },
  Dictionaries: { bg: "bg-teal-50", text: "text-teal-700" },
  Functions: { bg: "bg-violet-50", text: "text-violet-700" },
  "File Handling": { bg: "bg-indigo-50", text: "text-indigo-700" },
  "Error Handling": { bg: "bg-red-50", text: "text-red-700" },
  OOP: { bg: "bg-pink-50", text: "text-pink-700" },
  "Modules & Projects": { bg: "bg-lime-50", text: "text-lime-700" },
  "Number Systems": { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
}

export const difficultyColors: Record<Difficulty, { bg: string; text: string }> = {
  Easy: { bg: "bg-green-50", text: "text-green-700" },
  Medium: { bg: "bg-yellow-50", text: "text-yellow-700" },
  Hard: { bg: "bg-red-50", text: "text-red-700" },
}

export const classLevelColors: Record<ClassLevel, { bg: string; text: string }> = {
  "Class 8": { bg: "bg-emerald-100", text: "text-emerald-800" },
  "Class 9": { bg: "bg-sky-100", text: "text-sky-800" },
  "Class 10": { bg: "bg-amber-100", text: "text-amber-800" },
  "Class 11": { bg: "bg-rose-100", text: "text-rose-800" },
}

export const categories: Category[] = [
  "Basics",
  "Strings",
  "Math & Logic",
  "Loops & Patterns",
  "Sets",
  "Lists",
  "Tuples",
  "Dictionaries",
  "Functions",
  "File Handling",
  "Error Handling",
  "OOP",
  "Modules & Projects",
  "Number Systems",
]

export const classLevels: ClassLevel[] = ["Class 8", "Class 9", "Class 10", "Class 11"]


export const pythonPrograms: PythonProgram[] = [
  {
    id: "b-1",
    title: "Hello World",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Learn how to display output using Python's print() function",
    code: `"""
==========================================
Program: Hello World
Teaches: Using print() to display output
WHY: Every program needs to communicate results to the user.
      print() is the most basic way to show output.
==========================================

EXECUTION TRACE:
Line 1: print("Hello, World!") → displays "Hello, World!" on screen
Line 2: print("Welcome to Python!") → displays "Welcome to Python!" on screen
Line 3: print("My first program") → displays "My first program" on screen

TRY THIS:
- Change the messages inside print() to your own greetings
- Add a 4th print() statement with your name
- Try printing numbers directly: print(10 + 5)
"""

print("Hello, World!")
print("Welcome to Python!")
print("My first program")
`,
    funFact: "Python's creator Guido van Rossum named it after 'Monty Python's Flying Circus', not the snake!"
  },
  {
    id: "b-2",
    title: "My Bio Data",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Use multiple print() statements to display personal information",
    code: `"""
==========================================
Program: My Bio Data
Teaches: Multiple print() statements, string formatting
WHY: Programs often need to display multiple pieces of information
      in a structured way. This teaches output organization.
==========================================

EXECUTION TRACE:
Line 1: print("Name: Rahul") → displays "Name: Rahul"
Line 2: print("Class: 8") → displays "Class: 8"
Line 3: print("School: Delhi Public School") → displays school name
Line 4: print("Hobby: Programming") → displays hobby
Line 5: print("City: New Delhi") → displays city

TRY THIS:
- Add more details like age, favourite subject, or pet name
- Use a comma to print on the same line: print("Name:", "Rahul")
- Try printing with double quotes: print("She said 'hello'")
"""

print("Name: Rahul")
print("Class: 8")
print("School: Delhi Public School")
print("Hobby: Programming")
print("City: New Delhi")
`,
    funFact: "Python uses indentation (spaces) to group code blocks instead of curly braces like C++ or Java!"
  },
  {
    id: "b-3",
    title: "Add Two Numbers",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Take user input and perform arithmetic operations",
    code: `"""
==========================================
Program: Add Two Numbers
Teaches: input() to get user data, int() to convert text to numbers
WHY: Real programs must accept user input. Numbers come as text
      from input(), so we convert them with int() before math.
==========================================

EXECUTION TRACE:
Line 1: num1 = int(input("Enter first number: "))
        → prompts "Enter first number: ", user types "5"
        → input() returns "5" (text), int() converts to 5 (number)
Line 2: num2 = int(input("Enter second number: "))
        → user types "3", num2 becomes 3
Line 3: result = num1 + num2
        → 5 + 3 = 8, result = 8
Line 4: print("The sum is:", result) → displays "The sum is: 8"

TRY THIS:
- Modify the program to subtract, multiply, and divide
- Try multiplying two numbers with a 3rd print statement
- What happens if you type "hello" instead of a number?
"""

num1 = int(input("Enter first number: "))
num2 = int(input("Enter second number: "))
result = num1 + num2
print("The sum is:", result)
`,
    funFact: "input() always returns a string (text). You MUST convert it to int() or float() to do math!"
  },
  {
    id: "b-4",
    title: "Simple Calculator",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Build a calculator using if-elif-else to choose operations",
    code: `"""
==========================================
Program: Simple Calculator
Teaches: if-elif-else for decision making
WHY: Programs must make choices based on conditions.
      The if-elif-else chain lets us handle multiple options.
==========================================

EXECUTION TRACE:
Line 1: num1 = 10, num2 = 5 (assigned values)
Line 2: op = "+" (user chooses addition)
Line 3: if op == "+": checks → True
Line 4: print("Result:", 10 + 5) → "Result: 15"
        The elif and else blocks are skipped entirely

If op had been "*":
  - if op == "+"? False → skip
  - elif op == "-"? False → skip
  - elif op == "*"? True → execute multiply block
  - else is skipped

TRY THIS:
- Add another elif for modulo (% operator)
- What happens if the user enters "/" and num2 is 0?
- Add support for ** (power) operation
"""

num1 = float(input("Enter first number: "))
num2 = float(input("Enter second number: "))
op = input("Enter operator (+, -, *, /): ")

if op == "+":
    print("Result:", num1 + num2)
elif op == "-":
    print("Result:", num1 - num2)
elif op == "*":
    print("Result:", num1 * num2)
elif op == "/":
    print("Result:", num1 / num2)
else:
    print("Invalid operator!")
`,
    funFact: "Python evaluates conditions top to bottom and stops at the FIRST match — like a checklist!"
  },
  {
    id: "b-5",
    title: "Area of Rectangle",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Use variables and formulas to calculate the area of a rectangle",
    code: `"""
==========================================
Program: Area of Rectangle
Teaches: Variables, assignment, and formula application
WHY: Variables store data for later use. Formulas let us
      compute results from input values — core to all programs.
==========================================

EXECUTION TRACE:
Line 1: length = 10 → variable length stores value 10
Line 2: breadth = 5 → variable breadth stores value 5
Line 3: area = length * breadth → 10 * 5 = 50
Line 4: print("Length:", length) → "Length: 10"
Line 5: print("Breadth:", breadth) → "Breadth: 5"
Line 6: print("Area:", area) → "Area: 50"

TRY THIS:
- Change the values of length and breadth
- Add a third variable for perimeter: 2 * (length + breadth)
- Ask the user to input length and breadth using input()
"""

length = 10
breadth = 5
area = length * breadth
print("Length:", length)
print("Breadth:", breadth)
print("Area:", area)
`,
    funFact: "Variable names in Python are case-sensitive! 'Area' and 'area' are two different variables."
  },
  {
    id: "b-6",
    title: "Area of Circle",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Use the math module to access the value of pi for calculations",
    code: `"""
==========================================
Program: Area of Circle
Teaches: import math, using math.pi for accurate pi value
WHY: Python has built-in modules with useful values and functions.
      Importing math gives us pi (3.14159...) without manual typing.
==========================================

EXECUTION TRACE:
Line 1: import math → loads the math module into memory
Line 2: radius = 7 → stores 7 in radius
Line 3: area = math.pi * radius * radius
        → 3.14159... * 7 * 7 = 153.938...
Line 4: print("Area:", area) → displays the calculated area

TRY THIS:
- Ask the user for the radius with input()
- Also calculate the circumference: 2 * math.pi * radius
- What is math.pi to 5 decimal places? Try: print(round(math.pi, 5))
"""

import math

radius = 7
area = math.pi * radius * radius
print("Area of circle:", area)
`,
    funFact: "Python's math.pi is accurate to 15 decimal places — far more precise than 3.14!"
  },
  {
    id: "b-7",
    title: "Temperature Converter",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Apply multiple formulas to convert temperatures between scales",
    code: `"""
==========================================
Program: Temperature Converter
Teaches: Multiple formulas, float() for decimal input
WHY: Converting between scales uses different formulas.
      This teaches handling multiple operations based on user choice.
==========================================

EXECUTION TRACE:
Line 1: temp = 100 → stores the temperature value
Line 2: choice = "C" → user wants Celsius to Fahrenheit
Line 3: if choice == "C": → True
Line 4: result = (temp * 9/5) + 32
        → (100 * 9/5) + 32 = 180 + 32 = 212.0
Line 5: print("Result:", 212.0) → "Result: 212.0"

TRY THIS:
- Add support for Kelvin conversion
- Use float(input()) to let users enter decimal temperatures
- Add an "else" clause for invalid choices
"""

temp = 100
choice = input("Enter C for Celsius or F for Fahrenheit: ")

if choice == "C":
    result = (temp * 9/5) + 32
    print("Result:", result)
elif choice == "F":
    result = (temp - 32) * 5/9
    print("Result:", result)
else:
    print("Invalid choice!")
`,
    funFact: "0°C = 32°F and 100°C = 212°F — the boiling point of water is exactly 180°F above freezing!"
  },
  {
    id: "b-8",
    title: "BMI Calculator",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Calculate Body Mass Index using a real-world health formula",
    code: `"""
==========================================
Program: BMI Calculator
Teaches: Using float() for decimal numbers, real-world formulas
WHY: BMI = weight(kg) / height(m)^2 is a real health metric.
      Programs can solve practical problems like this one.
==========================================

EXECUTION TRACE:
Line 1: weight = 65.0 → stores weight as a float
Line 2: height = 1.75 → stores height as a float
Line 3: bmi = 65.0 / (1.75 * 1.75)
        → 65.0 / 3.0625 = 21.22
Line 4: if bmi < 18.5: → 21.22 < 18.5? False
Line 5: elif bmi < 25: → 21.22 < 25? True
Line 6: print("Result: Normal weight") → category displayed

TRY THIS:
- Ask user to input weight and height
- Round BMI to 2 decimal places: round(bmi, 2)
- Add a category for obesity (bmi >= 30)
"""

weight = float(input("Enter weight in kg: "))
height = float(input("Enter height in meters: "))
bmi = weight / (height * height)

if bmi < 18.5:
    print("Result: Underweight")
elif bmi < 25:
    print("Result: Normal weight")
elif bmi < 30:
    print("Result: Overweight")
else:
    print("Result: Obese")
`,
    funFact: "BMI was invented in the 1830s by Adolphe Quetelet, a Belgian mathematician — not a doctor!"
  },
  {
    id: "b-9",
    title: "Swap Two Numbers",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Swap values between variables using temp variable and tuple unpacking",
    code: `"""
==========================================
Program: Swap Two Numbers
Teaches: Temp variable swap vs Python's tuple swap
WHY: Swapping values is fundamental in sorting algorithms
      and data manipulation. Python offers an elegant shortcut.
==========================================

EXECUTION TRACE:

--- Method 1: Temp Variable ---
Line 1: a = 5 → a stores 5
Line 2: b = 10 → b stores 10
Line 3: temp = a → temp stores 5 (backup a's value)
Line 4: a = b → a stores 10 (b's value)
Line 5: b = temp → b stores 5 (old a's value)
Result: a=10, b=5

--- Method 2: Tuple Swap ---
Line 1: a = 5, b = 10
Line 2: a, b = b, a
        → Right side evaluates to (10, 5)
        → Unpacks: a gets 10, b gets 5
Result: a=10, b=5

TRY THIS:
- Swap three variables: a, b, c = b, c, a
- What happens if you try: a = b; b = a (without temp)?
- Create variables x=3, y=7 and swap them both ways
"""

# Method 1: Using a temp variable
a = 5
b = 10
temp = a
a = b
b = temp
print("Method 1 → a:", a, "b:", b)

# Method 2: Python's tuple swap (no temp needed!)
a = 5
b = 10
a, b = b, a
print("Method 2 → a:", a, "b:", b)
`,
    funFact: "Python's tuple swap a, b = b, a works because the right side is fully evaluated BEFORE assignment!"
  },
  {
    id: "b-10",
    title: "Type of Variable",
    language: "python",
    category: "Basics",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Explore variable types using type() and isinstance() functions",
    code: `"""
==========================================
Program: Type of Variable
Teaches: type() function, isinstance(), Python data types
WHY: Knowing data types prevents bugs. You can't multiply
      text by text or subtract a word from a number!
==========================================

EXECUTION TRACE:
Line 1: x = 10 → x is an integer
Line 2: type(x) returns <class 'int'>
Line 3: y = 3.14 → y is a float
Line 4: type(y) returns <class 'float'>
Line 5: z = "Hello" → z is a string
Line 6: isinstance(x, int) returns True
Line 7: isinstance(z, float) returns False

TRY THIS:
- Check the type of True, [1,2,3], and {"key": "value"}
- What is type(True)? (Hint: it's bool, not int!)
- Create a variable with type() and print the result
"""

x = 10
y = 3.14
z = "Hello"
flag = True

print("x =", x, "→ Type:", type(x))
print("y =", y, "→ Type:", type(y))
print("z =", z, "→ Type:", type(z))
print("flag =", flag, "→ Type:", type(flag))

print("\\\nUsing isinstance():")
print("x is int?", isinstance(x, int))
print("z is str?", isinstance(z, str))
print("y is int?", isinstance(y, int))
`,
    funFact: "In Python, everything is an object — even integers and functions have methods and properties!"
  },
  {
    id: "s-1",
    title: "String Methods Demo",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Learn common string methods like upper(), lower(), title(), and strip()",
    code: `"""
==========================================
Program: String Methods Demo
Teaches: Built-in string methods for text manipulation
WHY: Text processing is everywhere — names, emails, messages.
      String methods let us clean, format, and transform text.
==========================================

EXECUTION TRACE:
Line 1: name = "  Python Programming  " (with extra spaces)
Line 2: name.upper() → "  PYTHON PROGRAMMING  " (all caps)
Line 3: name.lower() → "  python programming  " (all lowercase)
Line 4: name.title() → "  Python Programming  " (first letter caps)
Line 5: name.strip() → "Python Programming" (removes spaces)
Line 6: name.strip().upper() → "PYTHON PROGRAMMING" (chained!)

TRY THIS:
- Try name.replace("Python", "Java")
- What does name.find("Prog") return?
- Chain 3 methods together in one line!
"""

text = "  Python Programming  "
print("Original:", text)
print("upper():", text.upper())
print("lower():", text.lower())
print("title():", text.title())
print("strip():", text.strip())
print("strip().upper():", text.strip().upper())
print("len():", len(text))
`,
    funFact: "String methods in Python never change the original string — they ALWAYS return a new one!"
  },
  {
    id: "s-2",
    title: "String Slicing",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Extract substrings using slice notation [start:end:step]",
    code: `"""
==========================================
Program: String Slicing
Teaches: [start:end:step] slice notation for strings
WHY: Slicing lets you extract parts of strings — useful for
      parsing data, formatting output, and text analysis.
==========================================

EXECUTION TRACE:
text = "PYTHON"
Index:   0 1 2 3 4 5

Line: text[0]     → "P"     (first character)
Line: text[5]     → "N"     (last character)
Line: text[0:3]   → "PYT"   (index 0,1,2 — stop BEFORE 3)
Line: text[2:]    → "THON"  (from index 2 to end)
Line: text[:4]    → "PYTH"  (from start to index 3)
Line: text[-1]    → "N"     (last character, negative index)
Line: text[::-1]  → "NOHTYP" (reversed string!)

TRY THIS:
- Extract "PY" from "PYTHON" using slicing
- Get every other letter: text[::2]
- Reverse your name using slicing
"""

text = "PYTHON"
print("String:", text)
print("text[0]:", text[0])
print("text[5]:", text[5])
print("text[0:3]:", text[0:3])
print("text[2:]:", text[2:])
print("text[:4]:", text[:4])
print("text[-1]:", text[-1])
print("text[::-1]:", text[::-1])
print("text[::2]:", text[::2])
`,
    funFact: "Python's negative indexing lets you count from the end: -1 is the last character!"
  },
  {
    id: "s-3",
    title: "Count Vowels",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Loop through a string and count vowels using a for loop",
    code: `"""
==========================================
Program: Count Vowels
Teaches: Iterating over strings with for, counting pattern
WHY: Counting specific characters is useful for text analysis,
      data validation, and solving word puzzles.
==========================================

EXECUTION TRACE:
text = "Hello World"
vowels = "aeiouAEIOU"
count = 0

For each character in "Hello World":
  'H' → in vowels? No → count stays 0
  'e' → in vowels? Yes → count = 1
  'l' → in vowels? No → count stays 1
  'l' → in vowels? No → count stays 1
  'o' → in vowels? Yes → count = 2
  ' ' → in vowels? No → count stays 2
  'W' → in vowels? No → count stays 2
  'o' → in vowels? Yes → count = 3
  'r' → in vowels? No → count stays 3
  'l' → in vowels? No → count stays 3
  'd' → in vowels? No → count stays 3

Final count: 3

TRY THIS:
- Count consonants instead of vowels
- Count how many times the letter 'l' appears
- Use input() to let the user enter any text
"""

text = "Hello World"
vowels = "aeiouAEIOU"
count = 0

for char in text:
    if char in vowels:
        count = count + 1

print("Text:", text)
print("Vowel count:", count)
`,
    funFact: "The 'in' keyword checks membership — it returns True if the item exists in the collection!"
  },
  {
    id: "lp-1",
    title: "Multiplication Table",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Generate a multiplication table using a for loop with range()",
    code: `"""
==========================================
Program: Multiplication Table
Teaches: for loop with range(), formatted output
WHY: Tables help learn multiplication. Loops automate
      repetitive tasks — a core programming concept.
==========================================

EXECUTION_TRACE:
num = 5
for i in range(1, 11):
  range(1,11) produces: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

  i=1  → print("5 x 1 = 5")
  i=2  → print("5 x 2 = 10")
  i=3  → print("5 x 3 = 15")
  i=4  → print("5 x 4 = 20")
  i=5  → print("5 x 5 = 25")
  i=6  → print("5 x 6 = 30")
  i=7  → print("5 x 7 = 35")
  i=8  → print("5 x 8 = 40")
  i=9  → print("5 x 9 = 45")
  i=10 → print("5 x 10 = 50")

TRY THIS:
- Ask the user for a number and print its table
- Print tables from 1 to 10 using a nested loop
- Use f-strings: print(f"{num} x {i} = {num*i}")
"""

num = 5
print("Multiplication table of", num)
for i in range(1, 11):
    print(num, "x", i, "=", num * i)
`,
    funFact: "range(1, 11) generates numbers 1 to 10 — the end value 11 is EXCLUDED!"
  },
  {
    id: "lp-2",
    title: "Even and Odd Numbers",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Classify numbers as even or odd using the modulo operator",
    code: `"""
==========================================
Program: Even and Odd Numbers
Teaches: Modulo operator %, conditional logic in loops
WHY: Checking even/odd is fundamental in math and programming.
      The % operator finds remainders — used in many algorithms.
==========================================

EXECUTION_TRACE:
for i in range(1, 11):
  i=1  → 1 % 2 = 1 → not 0 → "1 is Odd"
  i=2  → 2 % 2 = 0 → equals 0 → "2 is Even"
  i=3  → 3 % 2 = 1 → not 0 → "3 is Odd"
  i=4  → 4 % 2 = 0 → equals 0 → "4 is Even"
  ...continues to 10

TRY THIS:
- Print only even numbers from 1 to 20
- Print only odd numbers using a different approach
- What is 0 % 2? Is 0 even or odd?
"""

print("Even and Odd numbers from 1 to 10:")
for i in range(1, 11):
    if i % 2 == 0:
        print(i, "is Even")
    else:
        print(i, "is Odd")
`,
    funFact: "A number is even if it has NO remainder when divided by 2 — the modulo test is the fastest way to check!"
  },
  {
    id: "lp-3",
    title: "Sum of N Numbers",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Calculate the sum of numbers using an accumulator pattern",
    code: `"""
==========================================
Program: Sum of N Numbers
Teaches: Accumulator pattern — running total in a loop
WHY: Accumulators are used everywhere: summing scores,
      counting items, accumulating data in real programs.
==========================================

EXECUTION_TRACE:
n = 5, total = 0

i=1: total = 0 + 1 = 1
i=2: total = 1 + 2 = 3
i=3: total = 3 + 3 = 6
i=4: total = 6 + 4 = 10
i=5: total = 10 + 5 = 15

Final total: 15

TRY THIS:
- Calculate the sum of even numbers from 1 to 10
- Calculate the product of 1 to 5 (hint: start with 1, use *)
- Use input() to let the user choose n
"""

n = 5
total = 0

for i in range(1, n + 1):
    total = total + i

print("Sum of 1 to", n, "is:", total)
`,
    funFact: "Python has a built-in sum() function: sum(range(1, 6)) gives 15 directly!"
  },
  {
    id: "lp-4",
    title: "Star Triangle",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Create a right-angled triangle pattern using nested for loops",
    code: `"""
==========================================
Program: Star Triangle
Teaches: Nested for loops, pattern printing
WHY: Pattern printing builds logic skills and teaches
      how loops can control both rows and columns.
==========================================

EXECUTION_TRACE:
n = 5
Row 1: i=1, j loops 1 time  → "*"
Row 2: i=2, j loops 2 times → "**"
Row 3: i=3, j loops 3 times → "***"
Row 4: i=4, j loops 4 times → "****"
Row 5: i=5, j loops 5 times → "*****"

TRY THIS:
- Print the triangle upside down
- Print a right-aligned triangle with spaces before stars
- Print a full square of stars (n x n)
"""

n = 5
for i in range(1, n + 1):
    for j in range(1, i + 1):
        print("*", end=" ")
    print()
`,
    funFact: "The 'end=\" \"' in print() replaces the default newline with a space!"
  },
  {
    id: "lp-5",
    title: "Number Pyramid",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Medium",
    classLevel: "Class 8",
    description: "Build a centered number pyramid using spaces and nested loops",
    code: `"""
==========================================
Program: Number Pyramid
Teaches: Nested loops with spaces for centered alignment
WHY: Complex patterns require managing spaces and numbers
      simultaneously — this builds strong loop logic skills.
==========================================

EXECUTION_TRACE:
n = 5

Row 1: 4 spaces + "1"
        "    1"
Row 2: 3 spaces + "1 2"
        "   1 2"
Row 3: 2 spaces + "1 2 3"
        "  1 2 3"
Row 4: 1 space  + "1 2 3 4"
        " 1 2 3 4"
Row 5: 0 spaces + "1 2 3 4 5"
        "1 2 3 4 5"

TRY THIS:
- Print a pyramid of stars instead of numbers
- Print an inverted number pyramid
- Add a base line of dashes under the pyramid
"""

n = 5
for i in range(1, n + 1):
    # Print leading spaces
    for s in range(n - i):
        print(" ", end="")
    # Print numbers
    for j in range(1, i + 1):
        print(j, end=" ")
    print()
`,
    funFact: "Pattern problems are common in coding interviews — mastering them builds strong problem-solving skills!"
  },
  {
    id: "ml-1",
    title: "Prime Number Check",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Check if a number is prime by testing divisibility up to its square root",
    code: `"""
==========================================
Program: Prime Number Check
Teaches: range(), sqrt optimization, prime checking logic
WHY: Prime numbers are the foundation of cryptography.
      Checking divisibility up to sqrt(n) is a key optimization.
==========================================

EXECUTION_TRACE:
n = 29
sqrt(29) ≈ 5.38, so range(2, 6) → tests 2, 3, 4, 5

i=2: 29 % 2 = 1 → not 0, continue
i=3: 29 % 3 = 2 → not 0, continue
i=4: 29 % 4 = 1 → not 0, continue
i=5: 29 % 5 = 4 → not 0, continue

Loop ends → no divisor found → "29 is Prime"

TRY THIS:
- Print all prime numbers from 1 to 100
- Why do we only check up to sqrt(n)? (Hint: if n=a*b, one factor must be <= sqrt(n))
- Modify to find the largest prime factor of a number
"""

import math

n = 29
is_prime = True

if n < 2:
    is_prime = False
else:
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            is_prime = False
            break

if is_prime:
    print(n, "is Prime")
else:
    print(n, "is Not Prime")
`,
    funFact: "2 is the only even prime number — all other primes are odd!"
  },
  {
    id: "ml-2",
    title: "Fibonacci Series",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Generate the Fibonacci sequence using tuple assignment",
    code: `"""
==========================================
Program: Fibonacci Series
Teaches: Tuple assignment a, b = b, a+b, sequence generation
WHY: Fibonacci appears in nature (flower petals, pinecones).
      The tuple swap trick makes generating it elegant.
==========================================

EXECUTION_TRACE:
a = 0, b = 1

Step 1: print 0 → a, b = 1, 1  (b becomes 1, a+b becomes 1)
Step 2: print 1 → a, b = 1, 2  (a=1, b=2)
Step 3: print 1 → a, b = 2, 3  (a=2, b=3)
Step 4: print 2 → a, b = 3, 5  (a=3, b=5)
Step 5: print 3 → a, b = 5, 8  (a=5, b=8)
Step 6: print 5 → a, b = 8, 13 (a=8, b=13)
Step 7: print 8 → a, b = 13, 21
Step 8: print 13 → a, b = 21, 34

Output: 0 1 1 2 3 5 8 13

TRY THIS:
- Print Fibonacci numbers up to 100
- Store the series in a list and print it
- What is the ratio of consecutive Fibonacci numbers approaching?
"""

a = 0
b = 1
n = 8

print("Fibonacci Series:")
for i in range(n):
    print(a, end=" ")
    a, b = b, a + b
print()
`,
    funFact: "Fibonacci numbers appear in sunflower seed patterns, rabbit populations, and even galaxy spirals!"
  },
  {
    id: "ml-3",
    title: "Factorial Program",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Calculate the factorial of a number using a for loop",
    code: `"""
==========================================
Program: Factorial Program
Teaches: Loop-based multiplication, accumulator pattern
WHY: Factorial (n!) = n × (n-1) × ... × 1 is used in
      permutations, combinations, and probability.
==========================================

EXECUTION_TRACE:
n = 5
fact = 1

i=1: fact = 1 * 1 = 1
i=2: fact = 1 * 2 = 2
i=3: fact = 2 * 3 = 6
i=4: fact = 6 * 4 = 24
i=5: fact = 24 * 5 = 120

Factorial of 5 = 120

TRY THIS:
- Use input() to get n from the user
- What is 0! (factorial of 0)? (Hint: it's 1!)
- Python has math.factorial() — try importing and using it
"""

n = 5
fact = 1

for i in range(1, n + 1):
    fact = fact * i

print("Factorial of", n, "is:", fact)
`,
    funFact: "By definition, 0! = 1 — this makes many mathematical formulas work correctly!"
  },
  {
    id: "ml-4",
    title: "Leap Year Checker",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Check if a year is a leap year using multiple conditions",
    code: `"""
==========================================
Program: Leap Year Checker
Teaches: Nested conditions, logical operators (and, or)
WHY: Leap year logic demonstrates how multiple rules combine.
      A year is leap if divisible by 4, but NOT by 100
      unless also divisible by 400.
==========================================

EXECUTION_TRACE:
year = 2024

Condition 1: 2024 % 4 == 0? → True (2024/4 = 506, no remainder)
Condition 2: 2024 % 100 == 0? → False (2024/100 = 20.24)
Since Condition 2 is False, we skip the "else" part
→ 2024 IS a leap year!

TRY year = 2000:
  2000 % 4 == 0? True
  2000 % 100 == 0? True → enter else
  2000 % 400 == 0? True → IS leap year!

TRY year = 1900:
  1900 % 4 == 0? True
  1900 % 100 == 0? True → enter else
  1900 % 400 == 0? False → NOT leap year!

TRY THIS:
- Check years 2100, 2400, 2023
- Print all leap years from 2000 to 2024
- How many leap years are there in a century?
"""

year = int(input("Enter a year: "))

if year % 4 == 0:
    if year % 100 == 0:
        if year % 400 == 0:
            print(year, "is a Leap Year")
        else:
            print(year, "is NOT a Leap Year")
    else:
        print(year, "is a Leap Year")
else:
    print(year, "is NOT a Leap Year")
`,
    funFact: "February 29 (leap day) babies are called 'leaplings' — they technically have a birthday only every 4 years!"
  },
  {
    id: "st-1",
    title: "Sets Basics",
    language: "python",
    category: "Sets",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Learn set creation, add(), remove(), and unique elements",
    code: `"""
==========================================
Program: Sets Basics
Teaches: set(), add(), remove(), len(), 'in' operator
WHY: Sets store UNIQUE items only. They're perfect for
      removing duplicates and checking membership quickly.
==========================================

EXECUTION_TRACE:
Line 1: fruits = {"apple", "banana", "cherry"}
        → Creates a set with 3 unique items
Line 2: add("orange") → set becomes {"apple","banana","cherry","orange"}
Line 3: add("apple") → "apple" already exists → set UNCHANGED
Line 4: remove("banana") → set becomes {"apple","cherry","orange"}
Line 5: len(fruits) → 3
Line 6: "apple" in fruits → True

TRY THIS:
- Create a set from a list with duplicates: set([1,1,2,2,3])
- Try adding a number that already exists
- What happens if you try to remove an item that doesn't exist?
"""

fruits = {"apple", "banana", "cherry"}
print("Original set:", fruits)

fruits.add("orange")
print("After add:", fruits)

fruits.add("apple")
print("After adding duplicate:", fruits)

fruits.remove("banana")
print("After remove:", fruits)
print("Length:", len(fruits))
print("apple in fruits?", "apple" in fruits)
`,
    funFact: "Sets are unordered — the print order may differ each time you run the program!"
  },
  {
    id: "st-2",
    title: "Set Operations",
    language: "python",
    category: "Sets",
    difficulty: "Medium",
    classLevel: "Class 8",
    description: "Perform union, intersection, and difference on sets",
    code: `"""
==========================================
Program: Set Operations
Teaches: union(), intersection(), difference(), symmetric_difference()
WHY: Set operations are used in databases, data analysis,
      and finding common/different items between groups.
==========================================

EXECUTION_TRACE:
A = {1, 2, 3, 4, 5}
B = {4, 5, 6, 7, 8}

Union (A | B):
  All items from both sets → {1, 2, 3, 4, 5, 6, 7, 8}

Intersection (A & B):
  Items in BOTH sets → {4, 5}

Difference (A - B):
  Items in A but NOT in B → {1, 2, 3}

Difference (B - A):
  Items in B but NOT in A → {6, 7, 8}

Symmetric Difference (A ^ B):
  Items in A or B but NOT both → {1, 2, 3, 6, 7, 8}

TRY THIS:
- Create two sets of student names (Math club and Science club)
- Find students in both clubs (intersection)
- Find students only in Math club (difference)
"""

A = {1, 2, 3, 4, 5}
B = {4, 5, 6, 7, 8}

print("Set A:", A)
print("Set B:", B)
print("Union:", A | B)
print("Intersection:", A & B)
print("A - B:", A - B)
print("B - A:", B - A)
print("Symmetric Diff:", A ^ B)
`,
    funFact: "The pipe | and ampersand & operators work on sets just like they do on numbers!"
  },
  {
    id: "st-3",
    title: "Remove Duplicates",
    language: "python",
    category: "Sets",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Remove duplicate elements from a list by converting to a set",
    code: `"""
==========================================
Program: Remove Duplicates
Teaches: Converting list to set and back, deduplication
WHY: Real data often has duplicates. Sets automatically
      remove them — a quick and elegant solution.
==========================================

EXECUTION_TRACE:
original = [1, 2, 2, 3, 4, 4, 4, 5]

Step 1: set(original) → {1, 2, 3, 4, 5}
        Duplicates removed automatically!
Step 2: list({1, 2, 3, 4, 5}) → [1, 2, 3, 4, 5]
        Converted back to a list

Result: 5 unique items instead of 8 with duplicates

TRY THIS:
- Remove duplicates from ["apple", "banana", "apple", "cherry"]
- Count how many duplicates were removed (original length - new length)
- Use sorted() to sort the unique list: sorted(list(set(original)))
"""

original = [1, 2, 2, 3, 4, 4, 4, 5]
print("Original list:", original)
print("Length:", len(original))

unique = list(set(original))
print("Unique list:", unique)
print("Length:", len(unique))
print("Duplicates removed:", len(original) - len(unique))
`,
    funFact: "Converting to a set loses the original order in Python versions before 3.7!"
  },
  {
    id: "mp-1",
    title: "Turtle Star Drawing",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Use the turtle module to draw a star with graphics",
    code: `"""
==========================================
Program: Turtle Star Drawing
Teaches: import turtle, coordinate system, pen control
WHY: Turtle graphics make programming visual and fun.
      It teaches geometry, angles, and sequential thinking.
==========================================

EXECUTION_TRACE:
Step 1: import turtle → loads graphics module
Step 2: t = turtle.Turtle() → creates a turtle object
Step 3: for i in range(5):
  i=0: forward(100) → moves right 100 pixels
        right(144) → turns clockwise 144 degrees
  i=1: forward(100) → moves 100 pixels in new direction
        right(144) → turns again
  ...repeats 5 times → forms a 5-pointed star

The angle 144° works because: 5 × 144° = 720° = 2 full turns

TRY THIS:
- Change the number of points (try 6, 7, 8)
- Change the forward distance (try 50, 200)
- Change the color: t.color("red")
- Add t.speed(0) for fastest drawing
"""

import turtle

t = turtle.Turtle()
t.speed(3)

for i in range(5):
    t.forward(100)
    t.right(144)

turtle.done()
`,
    funFact: "Turtle graphics was invented in 1967 at MIT — it's one of the oldest ways to teach programming!"
  },
  {
    id: "mp-2",
    title: "Random Number Game",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Easy",
    classLevel: "Class 8",
    description: "Use the random module to generate random numbers for a guessing game",
    code: `"""
==========================================
Program: Random Number Game
Teaches: import random, random.randint(), game loop with while
WHY: Random numbers power games, simulations, and security.
      This project combines input, loops, and conditions.
==========================================

EXECUTION_TRACE:
Step 1: import random → loads random module
Step 2: secret = random.randint(1, 10) → generates random number 1-10
        (Let's say secret = 7)
Step 3: while attempts > 0: → enters game loop
  Attempt 1: guess = 5, 5 < 7 → "Too low!"
  Attempt 2: guess = 8, 8 > 7 → "Too high!"
  Attempt 3: guess = 7, 7 == 7 → "Correct!" → break

TRY THIS:
- Change the range to 1-100 for harder difficulty
- Add a message showing how many attempts they used
- Track high scores across multiple games
"""

import random

secret = random.randint(1, 10)
attempts = 3

print("Welcome to the Number Guessing Game!")
print("I'm thinking of a number between 1 and 10")
print("You have 3 attempts. Good luck!")

while attempts > 0:
    guess = int(input("Your guess: "))
    if guess == secret:
        print("Congratulations! You got it!")
        break
    elif guess < secret:
        print("Too low!")
    else:
        print("Too high!")
    attempts = attempts - 1

if attempts == 0:
    print("Game Over! The number was:", secret)
`,
    funFact: "random.randint(a, b) can return EITHER a or b — both endpoints are included!"
  },
  // ==================== STRINGS ====================
  {
    id: "s-4",
    title: "Reverse String",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Reverse a string using Python's slice notation [::-1].",
    code: `# ============================================
# Reverse a String using Slicing
# ============================================
# Slicing syntax: string[start:stop:step]
# A step of -1 reverses the string!
# ============================================

# --- Input ---
word = input("Enter a word: ")

# --- Process ---
reversed_word = word[::-1]  # [::-1] means reverse!

# --- Output ---
print("Original:", word)
print("Reversed:", reversed_word)

# ============================================
# Execution Trace:
# Input: "Python"
# word[::-1] -> "nohtyP"
# Output: Reversed: nohtyP
# ============================================

# TRY THIS: Check if the reversed word is the same as original (palindrome)
`,
    funFact: "The word 'level' reversed is still 'level' — it's a palindrome!"
  },
  {
    id: "s-5",
    title: "Palindrome String",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Check if a string reads the same forwards and backwards.",
    code: `# ============================================
# Palindrome String Checker
# ============================================
# A palindrome reads the same forwards & backwards
# Example: "madam", "racecar", "level"
# ============================================

# --- Input ---
text = input("Enter a word: ")

# --- Process ---
if text == text[::-1]:
    result = "Yes"
else:
    result = "No"

# --- Output ---
print(f"Is '{text}' a palindrome? {result}")

# ============================================
# Execution Trace:
# Input: "madam"
# text[::-1] -> "madam"
# "madam" == "madam" -> True
# Output: Is 'madam' a palindrome? Yes
# ============================================

# TRY THIS: Check if a sentence is a palindrome (ignore spaces and case)
`,
    funFact: "'Racecar' is the longest single-word palindrome in common English usage."
  },
  {
    id: "s-6",
    title: "String Methods Chain",
    language: "python",
    category: "Strings",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Chain multiple string methods together: .strip().lower().split().",
    code: `# ============================================
# String Methods Chain
# ============================================
# Python lets you chain methods one after another
# Each method returns a new string
# ============================================

# --- Input ---
sentence = "  Python Programming is FUN  "

# --- Method by Method ---
print("Original:", repr(sentence))        # '  Python Programming is FUN  '
print("After strip():", repr(sentence.strip()))  # 'Python Programming is FUN'
print("After lower():", repr(sentence.strip().lower()))  # 'python programming is fun'
print("After split():", sentence.strip().lower().split())  # ['python', 'programming', 'is', 'fun']

# --- All Chained Together ---
words = sentence.strip().lower().split()
print("\\\nWords list:", words)
print("Number of words:", len(words))

# ============================================
# Execution Trace:
# Input: "  Python Programming is FUN  "
# .strip() -> "Python Programming is FUN"
# .lower() -> "python programming is fun"
# .split() -> ['python', 'programming', 'is', 'fun']
# Output: 4 words
# ============================================

# TRY THIS: Reverse the order of words in the sentence
`,
    funFact: "Python has over 40 built-in string methods!"
  },
  {
    id: "s-7",
    title: "F-String Formatting",
    language: "python",
    category: "Strings",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Format strings beautifully using f-strings with alignment and precision.",
    code: `# ============================================
# F-String Formatting
# ============================================
# f-strings (format strings) let you embed
# expressions inside strings using {braces}
# ============================================

# --- Basic F-String ---
name = "Alice"
age = 15
print(f"Hello, {name}! You are {age} years old.")

# --- Alignment ---
print(f"{'Name':>10} {'Age':>5}")
print(f"{'Alice':>10} {age:>5}")
print(f"{'Bob':>10} {16:>5}")
print(f"{'Charlie':>10} {14:>5}")

# --- Number Formatting ---
pi = 3.14159
print(f"Pi to 2 decimal places: {pi:.2f}")
print(f"Pi to 4 decimal places: {pi:.4f}")

# --- Width and Fill ---
for i in range(1, 6):
    print(f"Step {i:>2}: {'#' * (i * 5)}")

# ============================================
# Execution Trace:
# name = "Alice", age = 15
# f"Hello, {name}!" -> "Hello, Alice!"
# f"{'Alice':>10}" -> "     Alice" (right-aligned, width 10)
# f"{3.14159:.2f}" -> "3.14"
# Output: Formatted strings with proper alignment
# ============================================

# TRY THIS: Create a price tag: "Item: Widget | Price: $  9.99"
`,
    funFact: "F-strings were introduced in Python 3.6 and are 6x faster than format()!"
  },

  // ==================== MATH & LOGIC ====================
  {
    id: "ml-5",
    title: "Largest of Three",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Find the largest among three numbers using if-elif-else.",
    code: `# ============================================
# Find the Largest of Three Numbers
# ============================================
# Using chained comparison: if a > b > c
# ============================================

# --- Input ---
a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
c = int(input("Enter third number: "))

# --- Process ---
if a > b and a > c:
    largest = a
elif b > a and b > c:
    largest = b
else:
    largest = c

# --- Output ---
print(f"The largest of {a}, {b}, {c} is {largest}")

# ============================================
# Execution Trace:
# Input: a=10, b=25, c=15
# a > b? 10 > 25? No
# b > a and b > c? 25 > 10 and 25 > 15? Yes!
# Output: The largest of 10, 25, 15 is 25
# ============================================

# TRY THIS: Modify to find the smallest of three numbers
`,
    funFact: "You can also use max(a, b, c) — but learning if-else builds logic skills!"
  },
  {
    id: "ml-6",
    title: "Sum of Digits",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Calculate the sum of all digits in a number using a while loop.",
    code: `# ============================================
# Sum of Digits
# ============================================
# Use modulo (%) to get last digit
# Use integer division (//) to remove last digit
# ============================================

# --- Input ---
n = int(input("Enter a number: "))

# --- Process ---
original = n  # Save original for display
digit_sum = 0

while n > 0:
    digit = n % 10      # Get last digit
    digit_sum += digit   # Add to sum
    n = n // 10          # Remove last digit

# --- Output ---
print(f"Digits of {original} sum to {digit_sum}")

# ============================================
# Execution Trace:
# Input: 1234
# Step 1: n=1234, digit=4, sum=4, n=123
# Step 2: n=123,  digit=3, sum=7, n=12
# Step 3: n=12,   digit=2, sum=9, n=1
# Step 4: n=1,    digit=1, sum=10, n=0
# Loop ends. Output: Digits of 1234 sum to 10
# ============================================

# TRY THIS: Find the product of all digits instead of sum
`,
    funFact: "The digital root of any number is found by repeatedly summing digits until one digit remains!"
  },
  {
    id: "ml-7",
    title: "Reverse Number",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Reverse a number digit by digit using a while loop.",
    code: `# ============================================
# Reverse a Number
# ============================================
# Extract digits from right, build reversed number
# ============================================

# --- Input ---
n = int(input("Enter a number: "))

# --- Process ---
original = n
reversed_num = 0

while n > 0:
    digit = n % 10              # Get last digit
    reversed_num = reversed_num * 10 + digit  # Append digit
    n = n // 10                 # Remove last digit

# --- Output ---
print(f"Original:  {original}")
print(f"Reversed:  {reversed_num}")

# ============================================
# Execution Trace:
# Input: 1234
# Step 1: n=1234, digit=4, reversed=4,    n=123
# Step 2: n=123,  digit=3, reversed=43,   n=12
# Step 3: n=12,   digit=2, reversed=432,  n=1
# Step 4: n=1,    digit=1, reversed=4321, n=0
# Output: Original: 1234, Reversed: 4321
# ============================================

# TRY THIS: Check if original number equals reversed number (palindrome number)
`,
    funFact: "123456789 × 9 = 1111111101 — almost a palindrome!"
  },
  {
    id: "ml-8",
    title: "Palindrome Number",
    language: "python",
    category: "Math & Logic",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Check if a number reads the same forwards and backwards.",
    code: `# ============================================
# Palindrome Number Checker
# ============================================
# Reverse the number and compare with original
# ============================================

# --- Input ---
n = int(input("Enter a number: "))

# --- Process ---
original = n
reversed_num = 0

while n > 0:
    digit = n % 10
    reversed_num = reversed_num * 10 + digit
    n = n // 10

# --- Output ---
if original == reversed_num:
    print(f"{original} IS a palindrome!")
else:
    print(f"{original} is NOT a palindrome.")
    print(f"Reversed: {reversed_num}")

# ============================================
# Execution Trace:
# Input: 121
# Reversed: 121
# 121 == 121? Yes!
# Output: 121 IS a palindrome!
# ============================================

# TRY THIS: Find all palindrome numbers between 1 and 1000
`,
    funFact: "The largest known palindrome prime is 10^314400 + 1 — it has 314,401 digits!"
  },
  {
    id: "ml-9",
    title: "Armstrong Number",
    language: "python",
    category: "Math & Logic",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Check if a number equals the sum of its digits each raised to the power of total digits.",
    code: `# ============================================
# Armstrong Number Checker
# ============================================
# An Armstrong (narcissistic) number equals
# the sum of its digits each raised to the
# power of the number of digits.
# Example: 153 = 1^3 + 5^3 + 3^3 = 1 + 125 + 27
# ============================================

# --- Input ---
n = int(input("Enter a number: "))

# --- Process ---
original = n
temp = n

# Count digits
num_str = str(n)
num_digits = len(num_str)

# Calculate sum of powers
armstrong_sum = 0
while temp > 0:
    digit = temp % 10
    armstrong_sum += digit ** num_digits  # digit ^ num_digits
    temp = temp // 10

# --- Output ---
if original == armstrong_sum:
    print(f"{original} IS an Armstrong number!")
    print(f"Calculation: {' + '.join(f'{int(d)}^{num_digits}' for d in num_str)} = {armstrong_sum}")
else:
    print(f"{original} is NOT an Armstrong number.")
    print(f"Calculated sum: {armstrong_sum}")

# ============================================
# Execution Trace:
# Input: 153 (3 digits)
# 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153
# 153 == 153? Yes!
# Output: 153 IS an Armstrong number!
# ============================================

# TRY THIS: Find all Armstrong numbers between 1 and 10000
`,
    funFact: "Armstrong numbers are named after Michael F. Armstrong, a math professor!"
  },

  // ==================== LOOPS & PATTERNS ====================
  {
    id: "lp-6",
    title: "Count Even and Odd",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Count how many even and odd numbers are in a list.",
    code: `# ============================================
# Count Even and Odd Numbers
# ============================================
# Use modulo (%) to check even or odd
# Even: n % 2 == 0, Odd: n % 2 != 0
# ============================================

# --- Input ---
numbers = [12, 7, 23, 8, 15, 4, 30, 11, 2, 19]

# --- Process ---
even_count = 0
odd_count = 0

for num in numbers:
    if num % 2 == 0:
        even_count += 1
        print(f"{num} is Even")
    else:
        odd_count += 1
        print(f"{num} is Odd")

# --- Output ---
print(f"\\\nEven numbers: {even_count}")
print(f"Odd numbers: {odd_count}")
print(f"Total: {even_count + odd_count}")

# ============================================
# Execution Trace:
# [12,7,23,8,15,4,30,11,2,19]
# 12: Even, 7: Odd, 23: Odd, 8: Even, 15: Odd,
# 4: Even, 30: Even, 11: Odd, 2: Even, 19: Odd
# Even: 5, Odd: 5, Total: 10
# ============================================

# TRY THIS: Also count how many are divisible by 3
`,
    funFact: "Zero is the only number that is both even and neither positive nor negative!"
  },
  {
    id: "lp-7",
    title: "Multiplication Grid",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Generate a multiplication table grid using nested loops.",
    code: `# ============================================
# Multiplication Grid
# ============================================
# Nested for loops create rows and columns
# ============================================

# --- Input ---
size = int(input("Enter table size (e.g., 5): "))

# --- Process ---
# Print header
print(f"{'':>4}", end="")
for i in range(1, size + 1):
    print(f"{i:>5}", end="")
print()

# Print separator
print("-" * (5 * size + 5))

# Print rows
for row in range(1, size + 1):
    print(f"{row:>3} |", end="")
    for col in range(1, size + 1):
        print(f"{row * col:>5}", end="")
    print()

# ============================================
# Execution Trace:
# Input: 5
# Header:     1    2    3    4    5
# Row 1:  1 |    1    2    3    4    5
# Row 2:  2 |    2    4    6    8   10
# Row 3:  3 |    3    6    9   12   15
# ...
# ============================================

# TRY THIS: Highlight even products with a star (*)
`,
    funFact: "The multiplication table was invented by the ancient Babylonians around 3000 BC!"
  },
  {
    id: "lp-8",
    title: "Floyds Triangle",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Print Floyd's Triangle — a right-angled triangle of consecutive numbers.",
    code: `# ============================================
# Floyd's Triangle
# ============================================
# A right-angled triangle with consecutive numbers
# Row 1: 1
# Row 2: 2 3
# Row 3: 4 5 6
# Row 4: 7 8 9 10
# ============================================

# --- Input ---
rows = int(input("Enter number of rows: "))

# --- Process ---
num = 1  # Starting number

for i in range(1, rows + 1):
    for j in range(1, i + 1):
        print(f"{num:>3}", end="")
        num += 1
    print()  # New line after each row

# --- Output ---
print(f"\\\nLast number: {num - 1}")

# ============================================
# Execution Trace:
# Input: 4
# Row 1:   1
# Row 2:   2   3
# Row 3:   4   5   6
# Row 4:   7   8   9  10
# Last number: 10
# ============================================

# TRY THIS: Modify to print Floyd's Triangle with 1s and 0s (binary Floyd's)
`,
    funFact: "Floyd's Triangle is named after Robert Floyd, a computer scientist!"
  },
  {
    id: "lp-9",
    title: "Diamond Pattern",
    language: "python",
    category: "Loops & Patterns",
    difficulty: "Hard",
    classLevel: "Class 9",
    description: "Print a diamond pattern using two triangles (upper and lower).",
    code: `# ============================================
# Diamond Pattern
# ============================================
# Upper triangle (expanding) + Lower triangle (shrinking)
# ============================================

# --- Input ---
n = int(input("Enter half-height (e.g., 5): "))

# --- Upper Triangle ---
for i in range(1, n + 1):
    # Print spaces
    for j in range(n - i):
        print(" ", end="")
    # Print stars
    for k in range(2 * i - 1):
        print("*", end="")
    print()

# --- Lower Triangle ---
for i in range(n - 1, 0, -1):
    # Print spaces
    for j in range(n - i):
        print(" ", end="")
    # Print stars
    for k in range(2 * i - 1):
        print("*", end="")
    print()

# ============================================
# Execution Trace:
# Input: 5
# Upper:
#     *
#    ***
#   *****
#  *******
# *********
# Lower:
#  *******
#   *****
#    ***
#     *
# ============================================

# TRY THIS: Fill the diamond with numbers instead of stars
`,
    funFact: "The diamond pattern combines two skills: expanding and shrinking triangles!"
  },

  // ==================== LISTS ====================
  {
    id: "lt-1",
    title: "List Operations",
    language: "python",
    category: "Lists",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Learn append, insert, remove, and other list operations.",
    code: `# ============================================
# List Operations
# ============================================
# Lists are mutable — you can change them
# ============================================

# --- Create a list ---
fruits = ["apple", "banana", "cherry"]
print("Initial:", fruits)

# --- Append (add to end) ---
fruits.append("date")
print("After append:", fruits)

# --- Insert (add at position) ---
fruits.insert(1, "blueberry")
print("After insert:", fruits)

# --- Remove (delete by value) ---
fruits.remove("banana")
print("After remove:", fruits)

# --- Pop (remove by index) ---
popped = fruits.pop(0)
print(f"Popped: {popped}")
print("After pop:", fruits)

# --- Sort ---
fruits.sort()
print("After sort:", fruits)

# --- Length ---
print("Number of fruits:", len(fruits))

# ============================================
# Execution Trace:
# Initial: ['apple', 'banana', 'cherry']
# append('date') -> ['apple', 'banana', 'cherry', 'date']
# insert(1, 'blueberry') -> ['apple', 'blueberry', 'banana', 'cherry', 'date']
# remove('banana') -> ['apple', 'blueberry', 'cherry', 'date']
# pop(0) -> 'apple', ['blueberry', 'cherry', 'date']
# ============================================

# TRY THIS: Add a fruit at the end, then remove the one at index 2
`,
    funFact: "Python lists can hold mixed types — numbers, strings, even other lists!"
  },
  {
    id: "lt-2",
    title: "Largest in List",
    language: "python",
    category: "Lists",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Find the largest element in a list using max() and manual method.",
    code: `# ============================================
# Find the Largest in a List
# ============================================
# Two approaches: built-in max() and manual loop
# ============================================

# --- Input ---
numbers = [34, 12, 56, 78, 23, 91, 45]

# --- Method 1: Using max() ---
largest_builtin = max(numbers)
print(f"Using max(): {largest_builtin}")

# --- Method 2: Manual loop ---
largest_manual = numbers[0]  # Start with first element
for num in numbers:
    if num > largest_manual:
        largest_manual = num
print(f"Using loop:  {largest_manual}")

# --- Find position ---
position = numbers.index(largest_manual) + 1
print(f"Largest value {largest_manual} is at position {position}")

# ============================================
# Execution Trace:
# numbers = [34, 12, 56, 78, 23, 91, 45]
# max() -> 91
# Manual: 34 > 34? no, 12 > 34? no, 56 > 34? yes,
#   78 > 56? yes, 23 > 78? no, 91 > 78? yes
# Output: 91 at position 6
# ============================================

# TRY THIS: Also find the smallest element and its position
`,
    funFact: "Python's max() function can also find the largest string alphabetically!"
  },
  {
    id: "lt-3",
    title: "Bubble Sort",
    language: "python",
    category: "Lists",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Sort a list using the Bubble Sort algorithm with nested loops.",
    code: `# ============================================
# Bubble Sort
# ============================================
# Repeatedly compare adjacent elements and swap
# them if they're in the wrong order.
# Like bubbles rising to the surface!
# ============================================

# --- Input ---
numbers = [64, 34, 25, 12, 22, 11, 90]
print("Unsorted:", numbers)

# --- Bubble Sort Algorithm ---
n = len(numbers)

for i in range(n):
    for j in range(0, n - i - 1):
        # Compare adjacent elements
        if numbers[j] > numbers[j + 1]:
            # Swap them
            numbers[j], numbers[j + 1] = numbers[j + 1], numbers[j]
            print(f"  Swapped: {numbers}")

# --- Output ---
print("Sorted:  ", numbers)

# ============================================
# Execution Trace:
# [64, 34, 25, 12, 22, 11, 90]
# Pass 1: 34<->64, 25<->34, 12<->25, 22<->12, 11<->22, 64<->90
# [34, 25, 12, 22, 11, 64, 90]
# Pass 2: ... continues until sorted
# Final: [11, 12, 22, 25, 34, 64, 90]
# ============================================

# TRY THIS: Count how many swaps were made in total
`,
    funFact: "Bubble Sort is named because smaller elements 'bubble' to the top!"
  },
  {
    id: "lt-4",
    title: "List Comprehension",
    language: "python",
    category: "Lists",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Create lists elegantly using list comprehension syntax.",
    code: `# ============================================
# List Comprehension
# ============================================
# A concise way to create lists
# Syntax: [expression for item in iterable if condition]
# ============================================

# --- Basic Comprehension ---
squares = [x**2 for x in range(1, 11)]
print("Squares:", squares)

# --- With Condition (filter) ---
evens = [x for x in range(1, 21) if x % 2 == 0]
print("Evens:", evens)

# --- With Transformation ---
words = ["hello", "world", "python"]
upper_words = [word.upper() for word in words]
print("Uppercase:", upper_words)

# --- With String Operation ---
names = ["alice", "bob", "charlie"]
formatted = [f"Mr. {name.title()}" for name in names]
print("Formatted:", formatted)

# --- Compare with Loop ---
# Traditional way:
result_traditional = []
for x in range(1, 11):
    if x % 2 == 0:
        result_traditional.append(x ** 2)

# Comprehension way:
result_comp = [x**2 for x in range(1, 11) if x % 2 == 0]
print("Even squares:", result_comp)

# ============================================
# Execution Trace:
# [x**2 for x in range(1,11)] -> [1,4,9,16,25,36,49,64,81,100]
# [x for x in range(1,21) if x%2==0] -> [2,4,6,8,10,12,14,16,18,20]
# [word.upper() for word in words] -> ['HELLO','WORLD','PYTHON']
# ============================================

# TRY THIS: Create a list of all numbers from 1-100 divisible by both 3 and 5
`,
    funFact: "List comprehensions are up to 30% faster than regular for loops!"
  },

  // ==================== TUPLES ====================
  {
    id: "tp-1",
    title: "Tuple Basics",
    language: "python",
    category: "Tuples",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Learn about tuples — immutable sequences that can't be changed after creation.",
    code: `# ============================================
# Tuple Basics
# ============================================
# Tuples use parentheses () and are IMMUTABLE
# (cannot be changed after creation)
# ============================================

# --- Create Tuples ---
colors = ("red", "green", "blue")
numbers = (1, 2, 3, 4, 5)
mixed = ("hello", 42, 3.14, True)
single = (42,)  # Note: comma required for single-element tuple

print("Colors:", colors)
print("Numbers:", numbers)
print("Mixed:", mixed)
print("Single:", single)

# --- Access Elements ---
print(f"First color: {colors[0]}")
print(f"Last number: {numbers[-1]}")

# --- Slice ---
print(f"First two: {colors[:2]}")
print(f"Last two: {numbers[-2:]}")

# --- Try to modify (will cause error!) ---
try:
    colors[0] = "yellow"
except TypeError as e:
    print(f"Error: {e}")

# --- Tuple Methods ---
print(f"Count of 3: {numbers.count(3)}")
print(f"Index of 'blue': {colors.index('blue')}")

# ============================================
# Execution Trace:
# colors = ("red", "green", "blue")
# colors[0] -> "red"
# colors[-1] -> "blue"
# colors[:2] -> ("red", "green")
# numbers.count(3) -> 1
# ============================================

# TRY THIS: Create a tuple of your favorite numbers and print the sum
`,
    funFact: "Tuples are faster than lists and use less memory — Python prefers them internally!"
  },
  {
    id: "tp-2",
    title: "Tuple Unpacking",
    language: "python",
    category: "Tuples",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Assign tuple values to multiple variables in one line.",
    code: `# ============================================
# Tuple Unpacking
# ============================================
# Assign multiple values at once from a tuple
# ============================================

# --- Basic Unpacking ---
point = (3, 7)
x, y = point
print(f"Point: x={x}, y={y}")

# --- Swap Variables ---
a = 10
b = 20
print(f"Before swap: a={a}, b={b}")
a, b = b, a  # Pythonic swap!
print(f"After swap:  a={a}, b={b}")

# --- Unpack in Loop ---
students = [
    ("Alice", 15, "A"),
    ("Bob", 14, "B"),
    ("Charlie", 16, "A")
]

for name, age, grade in students:
    print(f"{name} is {age} years old, grade: {grade}")

# --- Star Unpacking ---
first, *rest = (1, 2, 3, 4, 5)
print(f"First: {first}")
print(f"Rest: {rest}")

first, *middle, last = (1, 2, 3, 4, 5)
print(f"First: {first}, Middle: {middle}, Last: {last}")

# ============================================
# Execution Trace:
# point = (3, 7)
# x, y = point -> x=3, y=7
# a=10, b=20 -> a, b = b, a -> a=20, b=10
# (1,2,3,4,5) -> first=1, *middle=[2,3,4], last=5
# ============================================

# TRY THIS: Swap three variables: a=1, b=2, c=3 -> a=3, b=1, c=2
`,
    funFact: "Tuple unpacking is used in Python's for loops, function returns, and even error handling!"
  },

  // ==================== DICTIONARIES ====================
  {
    id: "dc-1",
    title: "Dictionary Basics",
    language: "python",
    category: "Dictionaries",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Learn dictionary creation, access, and basic methods.",
    code: `# ============================================
# Dictionary Basics
# ============================================
# Dictionaries store key-value pairs
# Like a real dictionary: word -> definition
# ============================================

# --- Create Dictionary ---
student = {
    "name": "Alice",
    "age": 15,
    "class": "9th",
    "grade": "A"
}

print("Student:", student)

# --- Access Values ---
print(f"Name: {student['name']}")
print(f"Age: {student.get('age', 'Unknown')}")
print(f"Phone: {student.get('phone', 'Not provided')}")

# --- Add/Update ---
student["email"] = "alice@school.com"  # Add new
student["age"] = 16                     # Update existing
print("Updated:", student)

# --- Remove ---
del student["email"]
print("After delete:", student)

# --- Keys and Values ---
print("Keys:", list(student.keys()))
print("Values:", list(student.values()))
print("Items:", list(student.items()))

# --- Check Key ---
print("'name' in student:", "name" in student)
print("'phone' in student:", "phone" in student)

# ============================================
# Execution Trace:
# student = {"name": "Alice", "age": 15, "class": "9th", "grade": "A"}
# student['name'] -> "Alice"
# student.get('phone', 'Not provided') -> "Not provided"
# student["email"] = "alice@school.com" -> adds new key
# del student["email"] -> removes key
# ============================================

# TRY THIS: Create a dictionary of 3 countries and their capitals
`,
    funFact: "Dictionary keys can be any immutable type — strings, numbers, even tuples!"
  },
  {
    id: "dc-2",
    title: "Dictionary Iteration",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Iterate through dictionaries using keys(), values(), and items().",
    code: `# ============================================
# Dictionary Iteration
# ============================================
# Three ways to loop through a dictionary
# ============================================

# --- Sample Dictionary ---
marks = {
    "Math": 95,
    "Science": 88,
    "English": 92,
    "Hindi": 85,
    "Computer": 98
}

# --- Method 1: Iterate Keys ---
print("Subjects:")
for subject in marks:
    print(f"  {subject}")

# --- Method 2: Iterate Values ---
print("\\\nMarks:")
for mark in marks.values():
    print(f"  {mark}")

# --- Method 3: Iterate Items (key-value pairs) ---
print("\\\nSubject-wise Marks:")
for subject, mark in marks.items():
    print(f"  {subject}: {mark}")

# --- Find Average ---
total = sum(marks.values())
average = total / len(marks)
print(f"\\\nAverage: {average:.1f}")
print(f"Total: {total}")

# --- Find Highest ---
best_subject = max(marks, key=marks.get)
print(f"Best subject: {best_subject} ({marks[best_subject]})")

# ============================================
# Execution Trace:
# marks = {"Math": 95, "Science": 88, "English": 92, ...}
# for subject in marks -> iterates keys
# for mark in marks.values() -> iterates values
# for subject, mark in marks.items() -> both
# Average: 91.6, Best: Computer (98)
# ============================================

# TRY THIS: Find all subjects where marks are above 90
`,
    funFact: "Dictionary iteration order is guaranteed in Python 3.7+ (insertion order)!"
  },
  {
    id: "dc-3",
    title: "Word Counter",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Count word frequencies in text using dictionary counting technique.",
    code: `# ============================================
# Word Counter
# ============================================
# Count how many times each word appears in text
# Classic dictionary counting pattern!
# ============================================

# --- Input Text ---
text = "the cat sat on the mat the cat ate the rat"

# --- Split into Words ---
words = text.split()
print("Words:", words)

# --- Count Using Dictionary ---
word_count = {}

for word in words:
    if word in word_count:
        word_count[word] += 1  # Already seen, increment
    else:
        word_count[word] = 1   # First time, set to 1

# --- Output ---
print("\\\nWord Frequencies:")
for word, count in sorted(word_count.items()):
    print(f"  '{word}': {count} times")

# --- Find Most Common ---
most_common = max(word_count, key=word_count.get)
print(f"\\\nMost common word: '{most_common}' ({word_count[most_common]} times)")

# --- Alternative: Using .get() ---
print("\\\nUsing .get() method:")
word_count2 = {}
for word in words:
    word_count2[word] = word_count2.get(word, 0) + 1
print(word_count2)

# ============================================
# Execution Trace:
# text = "the cat sat on the mat the cat ate the rat"
# words = ['the','cat','sat','on','the','mat','the','cat','ate','the','rat']
# Counting: 'the':4, 'cat':2, 'sat':1, 'on':1, 'mat':1, 'ate':1, 'rat':1
# Most common: 'the' (4 times)
# ============================================

# TRY THIS: Modify to count characters instead of words
`,
    funFact: "This word counting technique is used in search engines and text analysis!"
  },

  // ==================== FUNCTIONS ====================
  {
    id: "fn-1",
    title: "What is a Function",
    language: "python",
    category: "Functions",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Understand functions — reusable blocks of code defined with 'def'.",
    code: `# ============================================
# What is a Function?
# ============================================
# A function is a reusable block of code
# that performs a specific task.
# Think of it like a recipe: define once, use many times!
# ============================================

# --- Define a Function ---
def greet():
    """This function prints a greeting."""
    print("Hello! Welcome to Python Functions!")
    print("Functions make code reusable!")

# --- Call the Function ---
greet()   # First call
print()   # Blank line
greet()   # Second call (reuse!)

# --- Function with Return ---
def get_pi():
    """Returns the value of Pi."""
    return 3.14159

pi_value = get_pi()
print(f"Pi = {pi_value}")

# --- Anatomy of a Function ---
# def keyword:  Tells Python you're defining a function
# function_name: What you call it (use descriptive names!)
# ():           Parentheses (can hold parameters)
# docstring:    Optional documentation (""" """)
# body:         The code that runs when called
# return:       Optional - sends a value back

print("\\\nFunction anatomy:")
print("def function_name():")
print("    \\"Optional docstring\\"")
print("    # code here")
print("    return value  # optional")

# ============================================
# Execution Trace:
# def greet(): defines a function (doesn't run yet!)
# greet() calls the function -> prints greeting
# greet() again -> same output (reusable!)
# get_pi() returns 3.14159 -> stored in pi_value
# ============================================

# TRY THIS: Create a function that prints your name and age, then call it twice
`,
    funFact: "Functions were invented to avoid writing the same code twice — the DRY principle!"
  },
  {
    id: "fn-2",
    title: "Function with Arguments",
    language: "python",
    category: "Functions",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Pass data into functions using parameters and arguments.",
    code: `# ============================================
# Function with Arguments
# ============================================
# Parameters: Variables in function definition
# Arguments: Actual values passed when calling
# ============================================

# --- Function with Parameters ---
def greet_person(name, age):
    """Greets a person with their name and age."""
    print(f"Hello, {name}! You are {age} years old.")

# --- Call with Arguments ---
greet_person("Alice", 15)
greet_person("Bob", 14)

# --- Multiple Arguments ---
def add_numbers(a, b, c):
    """Adds three numbers."""
    result = a + b + c
    return result

total = add_numbers(10, 20, 30)
print(f"\\\nSum: {total}")

# --- Keyword Arguments ---
def student_info(name, grade, subject):
    """Display student information."""
    print(f"{name} | Grade: {grade} | Subject: {subject}")

# Positional (order matters):
student_info("Alice", "A", "Math")
# Keyword (order doesn't matter):
student_info(grade="B", subject="Science", name="Bob")

# --- Return Multiple Values ---
def min_max(numbers):
    """Returns minimum and maximum."""
    return min(numbers), max(numbers)

lowest, highest = min_max([5, 2, 8, 1, 9])
print(f"\\\nMin: {lowest}, Max: {highest}")

# ============================================
# Execution Trace:
# greet_person("Alice", 15) -> name="Alice", age=15
# add_numbers(10, 20, 30) -> a=10, b=20, c=30, returns 60
# min_max([5,2,8,1,9]) -> returns (1, 9)
# ============================================

# TRY THIS: Create a function that takes 3 numbers and returns their average
`,
    funFact: "Parameters are like slots; arguments are the values you fill them with!"
  },
  {
    id: "fn-3",
    title: "Default Parameters",
    language: "python",
    category: "Functions",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Set default values for parameters so functions work with fewer arguments.",
    code: `# ============================================
# Default Parameters
# ============================================
# Give parameters default values
# Caller can skip them if the default is fine
# ============================================

# --- Function with Default Parameter ---
def greet(name, greeting="Hello"):
    """Greets with customizable greeting."""
    print(f"{greeting}, {name}!")

greet("Alice")                  # Uses default "Hello"
greet("Bob", "Good Morning")    # Overrides default

# --- Multiple Defaults ---
def power(base, exponent=2):
    """Raises base to exponent (default: square)."""
    return base ** exponent

print(f"\\\n5^2 = {power(5)}")      # Default exponent=2
print(f"5^3 = {power(5, 3)}")    # Override exponent=3
print(f"2^10 = {power(2, 10)}")  # Override exponent=10

# --- Practical Example ---
def calculate_price(quantity, price_per_item, discount=0):
    """Calculates total price with optional discount."""
    total = quantity * price_per_item
    discount_amount = total * (discount / 100)
    final = total - discount_amount
    return total, discount_amount, final

# Without discount:
t, d, f = calculate_price(5, 100)
print(f"\\\nNo discount: Total={t}, Final={f}")

# With discount:
t, d, f = calculate_price(5, 100, discount=20)
print(f"20% discount: Total={t}, Discount={d}, Final={f}")

# ============================================
# Execution Trace:
# greet("Alice") -> greeting="Hello" (default)
# greet("Bob", "Good Morning") -> greeting="Good Morning"
# power(5) -> exponent=2, returns 25
# power(5, 3) -> exponent=3, returns 125
# ============================================

# TRY THIS: Create a function greet(name, language="English") that prints greetings in 3 languages
`,
    funFact: "Default parameters must come AFTER non-default parameters in the function definition!"
  },
  {
    id: "fn-4",
    title: "Return vs Print",
    language: "python",
    category: "Functions",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Understand the critical difference between return and print in functions.",
    code: `# ============================================
# Return vs Print — CRITICAL DIFFERENCE!
# ============================================
# print(): Displays output on screen (for user)
# return: Sends a value back to the caller (for code)
# ============================================

# --- Function with PRINT ---
def add_print(a, b):
    """Adds and prints result."""
    result = a + b
    print(f"Sum is: {result}")  # Just shows on screen

# --- Function with RETURN ---
def add_return(a, b):
    """Adds and returns result."""
    result = a + b
    return result  # Sends value back!

# --- The Difference ---
print("Using print():")
output1 = add_print(5, 3)  # Prints "Sum is: 8"
print(f"Output1 value: {output1}")  # None! print doesn't return anything

print("\\\nUsing return:")
output2 = add_return(5, 3)  # Returns 8
print(f"Output2 value: {output2}")  # 8! return sends value back

# --- Why Return is More Useful ---
total = add_return(10, 20)
doubled = total * 2
print(f"\\\nTotal: {total}, Doubled: {doubled}")

# Can't do this with print():
# total = add_print(10, 20)
# doubled = total * 2  # Error! total is None

# --- Side by Side ---
def square_print(x):
    print(x ** 2)     # Shows result

def square_return(x):
    return x ** 2     # Sends result back

square_print(4)       # Prints: 16
result = square_return(4)  # Returns: 16
print(f"Returned: {result}")

# ============================================
# Execution Trace:
# add_print(5,3) -> prints "Sum is: 8", returns None
# add_return(5,3) -> returns 8 (no print!)
# output1 = None, output2 = 8
# Total: 30, Doubled: 60
# ============================================

# TRY THIS: Rewrite a function that both prints AND returns the result
`,
    funFact: "Using return makes functions more flexible and testable — it's a best practice!"
  },
  {
    id: "fn-5",
    title: "Lambda One-Liner",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Create small anonymous functions using the lambda keyword.",
    code: `# ============================================
# Lambda One-Liner Functions
# ============================================
# Lambda creates tiny, anonymous functions
# Syntax: lambda parameters: expression
# ============================================

# --- Regular Function vs Lambda ---
def double(x):
    return x * 2

double_lambda = lambda x: x * 2

print(f"Regular: {double(5)}")
print(f"Lambda:  {double_lambda(5)}")

# --- Lambda with Multiple Arguments ---
add = lambda a, b: a + b
print(f"\\\nAdd: {add(3, 4)}")

multiply = lambda a, b: a * b
print(f"Multiply: {multiply(3, 4)}")

# --- Lambda for Quick Sorting ---
students = [("Alice", 15), ("Bob", 14), ("Charlie", 16)]
students.sort(key=lambda student: student[1])
print(f"\\\nSorted by age: {students}")

# --- Lambda in a List ---
operations = {
    "square": lambda x: x ** 2,
    "cube": lambda x: x ** 3,
    "double": lambda x: x * 2,
}

print(f"\\\nSquare of 5: {operations['square'](5)}")
print(f"Cube of 5: {operations['cube'](5)}")

# --- When to Use Lambda ---
# Good for: Short, one-time operations
# Bad for: Complex logic (use regular functions instead)

# ============================================
# Execution Trace:
# double_lambda = lambda x: x * 2
# double_lambda(5) -> 5 * 2 = 10
# add = lambda a, b: a + b -> add(3, 4) = 7
# students sorted by age -> [(Bob,14), (Alice,15), (Charlie,16)]
# ============================================

# TRY THIS: Create a lambda that checks if a number is even, return True/False
`,
    funFact: "Lambda functions are named after the Greek letter λ (lambda) in mathematics!"
  },
  {
    id: "fn-6",
    title: "Map and Filter",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Transform and filter lists using map() and filter() functions.",
    code: `# ============================================
# Map and Filter
# ============================================
# map(): Apply a function to every element
# filter(): Keep only elements that pass a test
# ============================================

# --- Sample Data ---
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# --- Map: Transform Each Element ---
# Double every number
doubled = list(map(lambda x: x * 2, numbers))
print("Doubled:", doubled)

# Convert to strings
string_nums = list(map(str, numbers))
print("As strings:", string_nums)

# Square every number
squared = list(map(lambda x: x**2, numbers))
print("Squared:", squared)

# --- Filter: Keep Certain Elements ---
# Keep only even numbers
evens = list(filter(lambda x: x % 2 == 0, numbers))
print("\\\nEvens:", evens)

# Keep numbers greater than 5
big_numbers = list(filter(lambda x: x > 5, numbers))
print("Greater than 5:", big_numbers)

# --- Combine Map and Filter ---
# Square only even numbers
result = list(map(lambda x: x**2, filter(lambda x: x % 2 == 0, numbers)))
print("\\\nSquared evens:", result)

# --- Practical Example ---
words = ["hello", "world", "python", "is", "awesome"]
long_words = list(filter(lambda w: len(w) > 3, words))
upper_words = list(map(lambda w: w.upper(), long_words))
print(f"\\\nLong words (upper): {upper_words}")

# ============================================
# Execution Trace:
# numbers = [1,2,3,4,5,6,7,8,9,10]
# map(x*2) -> [2,4,6,8,10,12,14,16,18,20]
# filter(x%2==0) -> [2,4,6,8,10]
# filter(len>3) on words -> ['hello','world','python','awesome']
# ============================================

# TRY THIS: From numbers 1-20, find the sum of all numbers divisible by 3
`,
    funFact: "Map and filter are functional programming concepts used in many languages!"
  },

  // ==================== FILE HANDLING ====================
  {
    id: "fh-1",
    title: "File Write",
    language: "python",
    category: "File Handling",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Create and write content to files using open() and write().",
    code: `# ============================================
# File Write Operations
# ============================================
# Use open() to create/write files
# Modes: 'w' (write), 'a' (append), 'r' (read)
# ============================================

# --- Write to a File (creates/overwrites) ---
filename = "sample_output.txt"

# Method 1: Using write()
file = open(filename, "w")
file.write("Hello, File!\\\n")
file.write("This is line 2.\\\n")
file.write("This is line 3.\\\n")
file.close()  # Always close the file!

# --- Append to File ---
file = open(filename, "a")  # 'a' for append
file.write("This line was appended!\\\n")
file.close()

# --- Read Back to Verify ---
file = open(filename, "r")
content = file.read()
file.close()

print("File content:")
print(content)

# --- Better Way: Using 'with' statement ---
# Auto-closes the file even if error occurs!
with open("data_output.txt", "w") as f:
    f.write("Using 'with' statement\\\n")
    f.write("File auto-closes!\\\n")
    f.write(f"Written at line 3\\\n")

# Read and display
with open("data_output.txt", "r") as f:
    print("\\\n'with' statement output:")
    print(f.read())

# ============================================
# Execution Trace:
# open("sample_output.txt", "w") -> creates file
# file.write("Hello, File!\\\n") -> writes text
# file.close() -> saves and closes
# open("data_output.txt", "w") -> new file
# with statement -> auto-closes on exit
# ============================================

# TRY THIS: Write a program that saves a student's name, age, and grade to a file
`,
    funFact: "The 'with' statement uses Python's context manager — it's the recommended way!"
  },

  // ==================== MODULES & PROJECTS ====================
  {
    id: "mp-3",
    title: "Datetime Program",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Easy",
    classLevel: "Class 9",
    description: "Work with dates and times using Python's datetime module.",
    code: `# ============================================
# Datetime Program
# ============================================
# Python's datetime module handles dates & times
# ============================================

import datetime

# --- Current Date and Time ---
now = datetime.datetime.now()
print("Current date and time:", now)
print("Date:", now.date())
print("Time:", now.time())

# --- Individual Components ---
print(f"\\\nYear: {now.year}")
print(f"Month: {now.month}")
print(f"Day: {now.day}")
print(f"Hour: {now.hour}")
print(f"Minute: {now.minute}")
print(f"Second: {now.second}")

# --- Format the Date ---
print(f"\\\nFormatted: {now.strftime('%d/%m/%Y')}")
print(f"Day name: {now.strftime('%A')}")
print(f"Month name: {now.strftime('%B')}")
print(f"Full: {now.strftime('%A, %d %B %Y')}")

# --- Time Difference ---
birthday = datetime.date(2010, 5, 15)
today = datetime.date.today()
age_days = (today - birthday).days
age_years = age_days // 365
print(f"\\\nDays since birthday: {age_days}")
print(f"Approximate age: {age_years} years")

# --- Create Specific Date ---
exam_date = datetime.date(2026, 3, 15)
days_until_exam = (exam_date - today).days
print(f"\\\nExam date: {exam_date}")
print(f"Days until exam: {days_until_exam}")

# ============================================
# Execution Trace:
# datetime.datetime.now() -> current timestamp
# now.strftime('%d/%m/%Y') -> "26/06/2026"
# (today - birthday).days -> calculates difference
# ============================================

# TRY THIS: Create a countdown timer to a specific event date
`,
    funFact: "Python's datetime module can even handle time zones and leap years!"
  },
  {
    id: "mp-4",
    title: "Random Password Generator",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Generate secure random passwords using the random module.",
    code: `# ============================================
# Random Password Generator
# ============================================
# Uses random.choice() to pick random characters
# ============================================

import random
import string

# --- Characters to Use ---
letters = string.ascii_letters  # a-z, A-Z
digits = string.digits          # 0-9
special = "!@#$%^&*"
all_chars = letters + digits + special

# --- Generate Password ---
def generate_password(length=12):
    """Generates a random password of given length."""
    password = ""
    for _ in range(length):
        password += random.choice(all_chars)
    return password

# --- Generate Multiple Passwords ---
print("Generated Passwords:")
print("-" * 30)
for i in range(5):
    pwd = generate_password(12)
    print(f"  {i+1}. {pwd}")

# --- Generate with Guaranteed Characters ---
def generate_strong_password(length=12):
    """Ensures at least one of each type."""
    if length < 4:
        length = 4  # Minimum length

    # Start with one of each type
    password = [
        random.choice(string.ascii_lowercase),
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice(special)
    ]

    # Fill the rest randomly
    for _ in range(length - 4):
        password.append(random.choice(all_chars))

    # Shuffle to mix positions
    random.shuffle(password)
    return "".join(password)

print("\\\nStrong Passwords (guaranteed variety):")
print("-" * 40)
for i in range(3):
    pwd = generate_strong_password(16)
    print(f"  {i+1}. {pwd}")

# ============================================
# Execution Trace:
# random.choice("!@#$%^&*0123...") -> picks one character
# Loop 12 times -> builds password string
# random.shuffle() -> mixes character positions
# Output: Random 12-16 character passwords
# ============================================

# TRY THIS: Add a function that checks password strength (weak/medium/strong)
`,
    funFact: "Never use random passwords for real accounts — use a password manager instead!"
  },

  // ==================== FUNCTIONS (OOP PREVIEW) ====================
  {
    id: "fn-7",
    title: "Calculator Class Preview",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 9",
    description: "Introduction to classes and objects — the foundation of Object-Oriented Programming.",
    code: `# ============================================
# Calculator Class Preview (OOP Introduction)
# ============================================
# Classes are blueprints for creating objects
# They bundle data (attributes) and behavior (methods)
# ============================================

# --- Define a Class ---
class Calculator:
    """A simple calculator class."""

    # Constructor: runs when object is created
    def __init__(self):
        self.history = []  # Store calculation history

    # Methods (functions inside a class)
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

    def subtract(self, a, b):
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result

    def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} × {b} = {result}")
        return result

    def divide(self, a, b):
        if b == 0:
            return "Error: Division by zero!"
        result = a / b
        self.history.append(f"{a} ÷ {b} = {result:.2f}")
        return result

    def show_history(self):
        print("\\\nCalculation History:")
        for calc in self.history:
            print(f"  {calc}")

# --- Create an Object ---
calc = Calculator()  # Creates a Calculator object

# --- Use Methods ---
print("5 + 3 =", calc.add(5, 3))
print("10 - 4 =", calc.subtract(10, 4))
print("6 × 7 =", calc.multiply(6, 7))
print("15 ÷ 3 =", calc.divide(15, 3))

# --- See History ---
calc.show_history()

# --- What Happened Behind the Scenes ---
# calc = Calculator()  -> creates object, calls __init__
# calc.add(5, 3)       -> calls add method on the object
# self.history         -> each object has its own history!

# ============================================
# Execution Trace:
# calc = Calculator() -> history = []
# calc.add(5, 3) -> result=8, history=["5 + 3 = 8"]
# calc.subtract(10, 4) -> result=6, history=[..., "10 - 4 = 6"]
# Output: 8, 6, 42, 5.0
# ============================================

# TRY THIS: Add a 'power' method that raises a to the power of b
`,
    funFact: "Python was designed to make OOP accessible — even beginners can learn classes!"
  },
  {
    id: "s-8",
    title: "String Methods Exam",
    language: "python",
    category: "Strings",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Combine split, join, and replace to manipulate strings in creative ways.",
    code: `# String Methods Exam Program
# ==========================
# Learn to combine split, join, and replace for string manipulation

def process_sentence(sentence):
    # Replace all spaces with hyphens
    hyphenated = sentence.replace(" ", "-")
    print(f"Step 1 - Replace spaces: {hyphenated}")

    # Split the sentence into words using hyphen as delimiter
    words = hyphenated.split("-")
    print(f"Step 2 - Split into words: {words}")

    # Join words with a comma
    joined = ", ".join(words)
    print(f"Step 3 - Join with comma: {joined}")

    return joined

# Main program
text = "Python is a powerful programming language"
print(f"Original: {text}")
print("-" * 40)
result = process_sentence(text)

# Execution trace:
# Original: "Python is a powerful programming language"
# Step 1 - Replace spaces: "Python-is-a-powerful-programming-language"
# Step 2 - Split into words: ["Python", "is", "a", "powerful", "programming", "language"]
# Step 3 - Join with comma: "Python, is, a, powerful, programming, language"

# TRY THIS: Write a function that reverses the word order in a sentence
# Example: "I love Python" -> "Python love I"
`,
    funFact: "Python's string methods are chainable and can transform text in powerful ways!"
  },
  {
    id: "s-9",
    title: "Anagram Check",
    language: "python",
    category: "Strings",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Check if two words are anagrams using sorted() comparison.",
    code: `# Anagram Check Program
# =====================
# Two words are anagrams if they have the same characters in different order

def is_anagram(word1, word2):
    # Convert both to lowercase and remove spaces
    w1 = word1.lower().replace(" ", "")
    w2 = word2.lower().replace(" ", "")

    # Sort characters and compare
    sorted_w1 = sorted(w1)
    sorted_w2 = sorted(w2)

    print(f"  '{word1}' sorted: {sorted_w1}")
    print(f"  '{word2}' sorted: {sorted_w2}")

    return sorted_w1 == sorted_w2

# Test cases
word_pairs = [
    ("listen", "silent"),
    ("hello", "world"),
    ("Dormitory", "Dirty Room"),
    ("python", "typhon")
]

for w1, w2 in word_pairs:
    print(f"Checking '{w1}' and '{w2}':")
    if is_anagram(w1, w2):
        print(f"  Result: Anagrams!")
    else:
        print(f"  Result: Not anagrams")
    print()

# Execution trace:
# 'listen' sorted: ['e', 'i', 'l', 'n', 's', 't']
# 'silent' sorted: ['e', 'i', 'l', 'n', 's', 't']
# Result: Anagrams!

# TRY THIS: Count how many character swaps are needed to make two strings equal
`,
    funFact: "The longest known anagram is 'Florence Nightingale' which rearranges to 'Flit on, cheering Angel'!"
  },
  {
    id: "lt-5",
    title: "Matrix Addition",
    language: "python",
    category: "Lists",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Add two matrices using nested loops to traverse rows and columns.",
    code: `# Matrix Addition Program
# ======================
# Add two matrices element by element using nested loops

def add_matrices(matrix1, matrix2):
    rows = len(matrix1)
    cols = len(matrix1[0])

    # Create result matrix filled with zeros
    result = [[0 for _ in range(cols)] for _ in range(rows)]

    # Add corresponding elements
    for i in range(rows):
        for j in range(cols):
            result[i][j] = matrix1[i][j] + matrix2[i][j]

    return result

def print_matrix(matrix, name):
    print(f"{name}:")
    for row in matrix:
        print(f"  {row}")

# Define two 3x3 matrices
matrix_a = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

matrix_b = [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1]
]

print_matrix(matrix_a, "Matrix A")
print()
print_matrix(matrix_b, "Matrix B")
print()

result = add_matrices(matrix_a, matrix_b)
print_matrix(result, "Sum (A + B)")

# Execution trace:
# Matrix A: [1,2,3]    Matrix B: [9,8,7]
#           [4,5,6]              [6,5,4]
#           [7,8,9]              [3,2,1]
# Sum:      [10,10,10]
#           [10,10,10]
#           [10,10,10]

# TRY THIS: Write a function to multiply two matrices
`,
    funFact: "Matrix addition is used in image processing to combine visual effects!"
  },
  {
    id: "lt-6",
    title: "Matrix Transpose",
    language: "python",
    category: "Lists",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Transpose a matrix using list comprehension to swap rows and columns.",
    code: `# Matrix Transpose Program
# =======================
# Transpose converts rows to columns using list comprehension

def transpose(matrix):
    # List comprehension: matrix[j][i] for each row j and column i
    rows = len(matrix)
    cols = len(matrix[0])
    return [[matrix[j][i] for j in range(rows)] for i in range(cols)]

def print_matrix(matrix, name):
    print(f"{name}:")
    for row in matrix:
        print(f"  {row}")

# Original 3x4 matrix
original = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12]
]

print_matrix(original, "Original (3x4)")
print()

# Transpose becomes 4x3
transposed = transpose(original)
print_matrix(transposed, "Transposed (4x3)")

# Execution trace:
# Original:          Transposed:
# [1, 2, 3, 4]      [1, 5, 9]
# [5, 6, 7, 8]      [2, 6, 10]
# [9, 10, 11, 12]   [3, 7, 11]
#                    [4, 8, 12]

# TRY THIS: Check if a matrix is symmetric (matrix == transpose)
`,
    funFact: "Matrix transpose is used in machine learning to prepare data for calculations!"
  },
  {
    id: "lt-7",
    title: "Linear Search",
    language: "python",
    category: "Lists",
    difficulty: "Easy",
    classLevel: "Class 10",
    description: "Search for an element in a list by checking each element one by one.",
    code: `# Linear Search Program
# ====================
# Simple search that checks each element sequentially

def linear_search(arr, target):
    # Traverse the list from index 0 to end
    for i in range(len(arr)):
        print(f"  Checking index {i}: {arr[i]}")
        if arr[i] == target:
            return i  # Found! Return index
    return -1  # Not found

# Search in a list
numbers = [23, 45, 12, 67, 89, 34, 56]
target = 67

print(f"List: {numbers}")
print(f"Searching for: {target}")
print("-" * 30)

result = linear_search(numbers, target)

if result != -1:
    print(f"Found at index {result}")
else:
    print("Element not found")

# Execution trace:
# Index 0: 23 (not 67)
# Index 1: 45 (not 67)
# Index 2: 12 (not 67)
# Index 3: 67 (found!)
# Output: Found at index 3

# TRY THIS: Modify to return all indices where the element appears
`,
    funFact: "Linear search has O(n) time complexity - it checks every element in worst case!"
  },
  {
    id: "lt-8",
    title: "Binary Search",
    language: "python",
    category: "Lists",
    difficulty: "Hard",
    classLevel: "Class 10",
    description: "Efficiently search a sorted list by repeatedly dividing the search range in half.",
    code: `# Binary Search Program
# ====================
# Fast search on sorted arrays using divide and conquer

def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    comparisons = 0

    while low <= high:
        mid = (low + high) // 2
        comparisons += 1
        print(f"  Comparison {comparisons}: checking index {mid} = {arr[mid]}")

        if arr[mid] == target:
            return mid  # Found
        elif arr[mid] < target:
            low = mid + 1  # Search right half
            print(f"    Target is larger, searching right: {arr[low:high+1]}")
        else:
            high = mid - 1  # Search left half
            print(f"    Target is smaller, searching left: {arr[low:high+1]}")

    return -1  # Not found

# MUST be sorted for binary search
sorted_list = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91]
target = 23

print(f"Sorted list: {sorted_list}")
print(f"Searching for: {target}")
print("-" * 40)

result = binary_search(sorted_list, target)

if result != -1:
    print(f"Found at index {result} in {result + 1} comparisons")
else:
    print("Element not found")

# Execution trace:
# low=0, high=10, mid=5, arr[5]=23 (found!)
# Binary search finds 23 in just 1 comparison!
# Linear search would need 6 comparisons

# TRY THIS: Implement recursive binary search
`,
    funFact: "Binary search has O(log n) complexity - for 1 million items, it takes only ~20 comparisons!"
  },
  {
    id: "tp-3",
    title: "Nested Tuple",
    language: "python",
    category: "Tuples",
    difficulty: "Easy",
    classLevel: "Class 10",
    description: "Access elements in nested tuples using double indexing.",
    code: `# Nested Tuple Program
# ====================
# Accessing elements in tuples within tuples

# Create nested tuple - each inner tuple is a student record
students = (
    ("Alice", 95, "A"),
    ("Bob", 82, "B"),
    ("Charlie", 78, "B+")
)

# Accessing nested elements
print("Student Records:")
print("=" * 40)

# t[outer_index][inner_index]
first_student = students[0]
print(f"First student tuple: {first_student}")
print(f"First student name: {students[0][0]}")
print(f"First student grade: {students[0][2]}")

print()

# Loop through nested tuples
for i, student in enumerate(students):
    name = student[0]
    score = student[1]
    grade = student[2]
    print(f"Student {i+1}: {name} scored {score} ({grade})")

# Execution trace:
# students[0] = ("Alice", 95, "A")
# students[0][0] = "Alice"
# students[0][1] = 95
# students[1][2] = "B"

# TRY THIS: Find the student with the highest score
`,
    funFact: "Nested tuples are commonly used in databases to store related records!"
  },
  {
    id: "tp-4",
    title: "Tuple as Dict Key",
    language: "python",
    category: "Tuples",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Use tuples as dictionary keys because they are hashable and immutable.",
    code: `# Tuple as Dictionary Key Program
# ===============================
# Tuples can be dict keys (they're hashable), lists cannot

# Using tuple coordinates as dictionary keys
# Maps (x, y) coordinates to their labels

locations = {
    (0, 0): "Origin",
    (1, 0): "East",
    (0, 1): "North",
    (-1, 0): "West",
    (0, -1): "South"
}

print("Location Map:")
print("=" * 30)

# Access using tuple key
point = (1, 0)
print(f"Point {point} is: {locations[point]}")

# Loop through tuple keys
for coord, label in locations.items():
    print(f"  {coord} -> {label}")

# Why tuples work but lists don't:
print()
print("Why tuples as keys work:")
print("  Tuples are immutable and hashable")
print("  Lists are mutable and not hashable")

# This would cause a TypeError:
# locations[(1, 2)] = "Custom"  # Works (tuple)
# locations[[1, 2]] = "Custom"  # Fails (list)

# Execution trace:
# (0, 0) -> "Origin"
# (1, 0) -> "East"
# Accessing locations[(1,0)] returns "East"

# TRY THIS: Create a chess board mapping using tuple keys for positions
`,
    funFact: "The hashability of tuples makes them perfect for use as dictionary keys and set elements!"
  },
  {
    id: "tp-5",
    title: "Tuple to Dict",
    language: "python",
    category: "Tuples",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Convert tuples to dictionaries using the zip() function.",
    code: `# Tuple to Dictionary Program
# ==========================
# Use zip() to combine tuples into a dictionary

# Two tuples: one for keys, one for values
names = ("Alice", "Bob", "Charlie")
scores = (95, 82, 78)

# zip() pairs elements from both tuples
# dict() converts the pairs to a dictionary
student_scores = dict(zip(names, scores))

print("Converting tuples to dictionary:")
print(f"  Names tuple: {names}")
print(f"  Scores tuple: {scores}")
print(f"  Dictionary: {student_scores}")

print()

# Access values
print("Student scores:")
for name, score in student_scores.items():
    print(f"  {name}: {score}")

# Another example: multiple tuples
subjects = ("Math", "Science", "English")
grades = ("A", "B+", "A-")

subject_grades = dict(zip(subjects, grades))
print()
print("Subject grades:")
print(f"  {subject_grades}")

# Execution trace:
# zip(names, scores) = [("Alice", 95), ("Bob", 82), ("Charlie", 78)]
# dict() converts to: {"Alice": 95, "Bob": 82, "Charlie": 78}

# TRY THIS: Merge three tuples (names, ages, cities) into a nested dict
`,
    funFact: "zip() is named after the zipper - it interlocks two sequences just like a zipper!"
  },
  {
    id: "dc-4",
    title: "Nested Dictionary",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Create and access dictionaries within dictionaries to model complex data.",
    code: `# Nested Dictionary Program
# ========================
# Dictionaries can contain other dictionaries

# School database with nested dictionaries
school = {
    "class10A": {
        "teacher": "Mrs. Sharma",
        "students": 40,
        "room": "101"
    },
    "class10B": {
        "teacher": "Mr. Gupta",
        "students": 38,
        "room": "102"
    },
    "class10C": {
        "teacher": "Ms. Patel",
        "students": 42,
        "room": "103"
    }
}

print("School Database:")
print("=" * 40)

# Access nested values
print(f"Class 10A teacher: {school['class10A']['teacher']}")
print(f"Class 10B room: {school['class10B']['room']}")

print()

# Loop through nested dictionary
for class_name, details in school.items():
    print(f"{class_name}:")
    print(f"  Teacher: {details['teacher']}")
    print(f"  Students: {details['students']}")
    print(f"  Room: {details['room']}")
    print()

# Add new entry
school["class10D"] = {
    "teacher": "Dr. Singh",
    "students": 39,
    "room": "104"
}

# Execution trace:
# school['class10A']['teacher'] = "Mrs. Sharma"
# school['class10B']['room'] = "102"

# TRY THIS: Calculate total students across all classes
`,
    funFact: "Nested dictionaries are used in real-world applications like JSON APIs and databases!"
  },
  {
    id: "dc-5",
    title: "Dictionary of Lists",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Use dictionary values as lists to store multiple items per key.",
    code: `# Dictionary of Lists Program
# ==========================
# One key maps to many values using lists

# Shopping cart with multiple items per category
cart = {
    "fruits": ["apple", "banana", "orange"],
    "vegetables": ["carrot", "potato", "onion"],
    "dairy": ["milk", "cheese", "yogurt"]
}

print("Shopping Cart:")
print("=" * 40)

# Access and loop through lists
for category, items in cart.items():
    print(f"{category.title()}:")
    for item in items:
        print(f"  - {item}")
    print()

# Add items to existing lists
cart["fruits"].append("mango")
cart["snacks"].append("chips")  # This creates a new key

print("Updated cart:")
print(f"  Fruits: {cart['fruits']}")
print(f"  Snacks: {cart['snacks']}")

# Count total items
total = sum(len(items) for items in cart.values())
print(f"\\\nTotal items in cart: {total}")

# Execution trace:
# cart["fruits"] = ["apple", "banana", "orange"]
# After append: cart["fruits"] = ["apple", "banana", "orange", "mango"]

# TRY THIS: Find which category has the most items
`,
    funFact: "Dictionary of lists is a common data structure for grouping related data!"
  },
  {
    id: "dc-6",
    title: "Merge Dictionaries",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Combine two dictionaries using the unpacking operator **.",
    code: `# Merge Dictionaries Program
# =========================
# Combine dictionaries using ** unpacking operator

# Two dictionaries to merge
dict1 = {"name": "Alice", "age": 15, "grade": "A"}
dict2 = {"city": "Delhi", "hobby": "reading", "grade": "A+"}

print("Dictionary 1:", dict1)
print("Dictionary 2:", dict2)
print()

# Method 1: Using ** unpacking (Python 3.5+)
merged = {**dict1, **dict2}
print("Merged (unpacking):", merged)

# Method 2: Using update() method
merged2 = dict1.copy()
merged2.update(dict2)
print("Merged (update):", merged2)

# Note: If same key exists, second dict's value overwrites
print()
print("Note: 'grade' appears in both - dict2's value wins!")
print(f"  grade value: {merged['grade']}")

# Execution trace:
# dict1 = {"name": "Alice", "age": 15, "grade": "A"}
# dict2 = {"city": "Delhi", "hobby": "reading", "grade": "A+"}
# merged = {"name": "Alice", "age": 15, "grade": "A+", "city": "Delhi", "hobby": "reading"}

# TRY THIS: Merge three dictionaries and remove duplicates
`,
    funFact: "Dictionary merging with ** was added in Python 3.5 - it's the fastest method!"
  },
  {
    id: "fn-8",
    title: "Recursive Fibonacci",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Generate Fibonacci numbers using recursion with memoization for efficiency.",
    code: `# Recursive Fibonacci Program
# ===========================
# Each number is sum of two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13...

# Without memoization (slow for large n)
def fib_basic(n):
    if n <= 1:
        return n
    return fib_basic(n-1) + fib_basic(n-2)

# With memoization (much faster)
memo = {}
def fib_memo(n):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n-1) + fib_memo(n-2)
    return memo[n]

# Generate first 10 Fibonacci numbers
print("Fibonacci Sequence (first 10):")
print("=" * 40)

for i in range(10):
    result = fib_memo(i)
    print(f"  fib({i}) = {result}")

# Execution trace:
# fib(0) = 0
# fib(1) = 1
# fib(2) = fib(1) + fib(0) = 1 + 0 = 1
# fib(3) = fib(2) + fib(1) = 1 + 1 = 2
# fib(4) = fib(3) + fib(2) = 2 + 1 = 3
# Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34

# TRY THIS: Use Fibonacci to model rabbit population growth
`,
    funFact: "Fibonacci appears in nature: sunflower spirals, pinecone patterns, and shell curves!"
  },
  {
    id: "fn-9",
    title: "Recursive Power",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Calculate powers using recursion: power(base, exp) = power(base, exp-1) * base.",
    code: `# Recursive Power Program
# =======================
# Calculate base^exp using recursion

def power(base, exp):
    # Base case: any number to power 0 is 1
    if exp == 0:
        return 1

    # Recursive case: multiply base by power(base, exp-1)
    result = base * power(base, exp - 1)
    print(f"  power({base}, {exp}) = {base} * power({base}, {exp-1}) = {result}")
    return result

# Test the function
print("Power Calculation:")
print("=" * 40)

test_cases = [(2, 3), (3, 4), (5, 2)]
for base, exp in test_cases:
    print(f"\\\n{base}^{exp}:")
    result = power(base, exp)
    print(f"  Final: {base}^{exp} = {result}")

# Execution trace for power(2, 3):
# power(2, 3) = 2 * power(2, 2) = 8
# power(2, 2) = 2 * power(2, 1) = 4
# power(2, 1) = 2 * power(2, 0) = 2
# power(2, 0) = 1 (base case)

# TRY THIS: Add exponentiation by squaring for O(log n) efficiency
`,
    funFact: "Python has a built-in ** operator, but recursive power helps understand recursion!"
  },
  {
    id: "fn-10",
    title: "Higher Order Function",
    language: "python",
    category: "Functions",
    difficulty: "Hard",
    classLevel: "Class 10",
    description: "Create functions that return other functions, enabling powerful patterns.",
    code: `# Higher Order Function Program
# =============================
# Functions that return other functions

# Factory function that creates multiplier functions
def create_multiplier(factor):
    # This inner function "remembers" the factor value
    def multiplier(number):
        return number * factor
    return multiplier

# Create different multiplier functions
double = create_multiplier(2)
triple = create_multiplier(3)
quadruple = create_multiplier(4)

print("Function Factory:")
print("=" * 40)
print(f"double(5) = {double(5)}")
print(f"triple(5) = {triple(5)}")
print(f"quadruple(5) = {quadruple(5)}")

print()

# Another example: function that returns a greeting function
def create_greeting(language):
    def greet(name):
        if language == "en":
            return f"Hello, {name}!"
        elif language == "es":
            return f"Hola, {name}!"
        elif language == "fr":
            return f"Bonjour, {name}!"
    return greet

hello = create_greeting("en")
hola = create_greeting("es")
bonjour = create_greeting("fr")

print("Greeting Factory:")
print(f"  {hello('Alice')}")
print(f"  {hola('Bob')}")
print(f"  {bonjour('Charlie')}")

# Execution trace:
# create_multiplier(2) returns a function that multiplies by 2
# double(5) = 5 * 2 = 10
# triple(5) = 5 * 3 = 15

# TRY THIS: Create a function factory that generates power functions (square, cube, etc.)
`,
    funFact: "Higher-order functions are the foundation of functional programming!"
  },
  {
    id: "fn-11",
    title: "Scope Variables",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Understand global, local, and nonlocal variable scopes in Python.",
    code: `# Scope Variables Program
# =======================
# Understanding global, local, and nonlocal scopes

# Global variable
counter = 0

def increment():
    # Local scope - can read global but need 'global' to modify
    global counter
    counter += 1
    local_var = "I'm local"
    print(f"  Inside function: counter = {counter}")

def outer():
    message = "Hello"

    def inner():
        # nonlocal allows modifying enclosing function's variable
        nonlocal message
        message = "Hi"
        print(f"  Inner sees: {message}")

    inner()
    print(f"  Outer sees: {message}")

print("Global Scope:")
print("=" * 40)
print(f"Before: counter = {counter}")
increment()
increment()
increment()
print(f"After: counter = {counter}")

print()
print("Nonlocal Scope:")
print("=" * 40)
outer()

# Execution trace:
# Global counter = 0
# increment() uses 'global' to modify counter
# After 3 calls: counter = 3
# nonlocal in inner() modifies outer's message

# TRY THIS: Create a counter class using closures instead of global
`,
    funFact: "Python follows LEGB rule: Local, Enclosing, Global, Built-in scope!"
  },
  {
    id: "fh-2",
    title: "File Read and Write",
    language: "python",
    category: "File Handling",
    difficulty: "Easy",
    classLevel: "Class 10",
    description: "Read from and write to files using the with open() context manager.",
    code: `# File Read and Write Program
# ==========================
# Safe file handling using 'with' statement

# Writing to a file
filename = "poem.txt"
content = """Roses are red,
Violets are blue,
Python is fun,
And so are you!"""

# 'w' mode creates/overwrites file
with open(filename, 'w') as file:
    file.write(content)
print(f"Written to {filename}")

# Reading from file
print(f"\\\nReading from {filename}:")
print("-" * 30)

with open(filename, 'r') as file:
    # Read entire file
    full_content = file.read()
    print(full_content)

# Reading line by line
print("\\\nLine by line:")
with open(filename, 'r') as file:
    for line_num, line in enumerate(file, 1):
        print(f"  Line {line_num}: {line.strip()}")

# Execution trace:
# write() creates poem.txt with the content
# read() returns entire file as string
# for loop iterates through each line

# TRY THIS: Add line numbers to each line when displaying
`,
    funFact: "The 'with' statement automatically closes files, even if an error occurs!"
  },
  {
    id: "fh-3",
    title: "Count Words in File",
    language: "python",
    category: "File Handling",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Read a file and count total words, lines, and characters.",
    code: `# Count Words in File Program
# ===========================
# Analyze text file content

def analyze_file(filename):
    with open(filename, 'r') as file:
        content = file.read()

    # Split content into words (splits on whitespace)
    words = content.split()

    # Count using splitlines for lines
    lines = content.splitlines()

    # Analyze
    word_count = len(words)
    line_count = len(lines)
    char_count = len(content)

    # Find longest word
    longest = max(words, key=len) if words else ""

    return {
        "words": word_count,
        "lines": line_count,
        "characters": char_count,
        "longest": longest
    }

# Create a sample file first
sample_text = """Python is a versatile programming language.
It is used for web development, data science, and automation.
Python's simple syntax makes it great for beginners."""

with open("sample.txt", "w") as f:
    f.write(sample_text)

# Analyze the file
stats = analyze_file("sample.txt")

print("File Analysis:")
print("=" * 40)
print(f"  Lines: {stats['lines']}")
print(f"  Words: {stats['words']}")
print(f"  Characters: {stats['characters']}")
print(f"  Longest word: {stats['longest']}")

# Execution trace:
# read() gets entire content
# split() without args splits on any whitespace
# len() counts the resulting list elements

# TRY THIS: Count frequency of each word in the file
`,
    funFact: "Python's split() method handles multiple spaces and tabs automatically!"
  },
  {
    id: "fh-4",
    title: "CSV Data Program",
    language: "python",
    category: "File Handling",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Read and process CSV data using Python's built-in csv module.",
    code: `# CSV Data Program
# ================
# Work with CSV files using the csv module

import csv

# Create sample CSV data
students_data = [
    ["Name", "Age", "Grade", "City"],
    ["Alice", 15, "A", "Delhi"],
    ["Bob", 16, "B+", "Mumbai"],
    ["Charlie", 15, "A-", "Bangalore"],
    ["Diana", 16, "B", "Chennai"]
]

# Writing CSV file
print("Writing CSV file...")
with open("students.csv", 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(students_data)

# Reading CSV file
print("\\\nReading CSV file:")
print("=" * 50)

with open("students.csv", 'r') as file:
    reader = csv.reader(file)

    # Read header row
    header = next(reader)
    print(f"  {'  '.join(header)}")
    print("-" * 50)

    # Read data rows
    for row in reader:
        print(f"  {row[0]:<10} {row[1]:<6} {row[2]:<8} {row[3]}")

# Processing: find students older than 15
print("\\\nStudents older than 15:")
with open("students.csv", 'r') as file:
    reader = csv.DictReader(file)  # DictReader uses header as keys
    for row in reader:
        if int(row['Age']) > 15:
            print(f"  {row['Name']} ({row['Age']} years old)")

# Execution trace:
# csv.writer creates proper CSV format
# csv.reader parses CSV back into lists
# csv.DictReader maps rows to dictionaries using headers

# TRY THIS: Calculate average age of students from CSV
`,
    funFact: "CSV stands for Comma-Separated Values - one of the oldest data formats still in use!"
  },
  {
    id: "eh-1",
    title: "Try Except Basics",
    language: "python",
    category: "Error Handling",
    difficulty: "Easy",
    classLevel: "Class 10",
    description: "Handle runtime errors gracefully using try-except blocks.",
    code: `# Try Except Basics Program
# =========================
# Catch and handle errors without crashing

def safe_divide(a, b):
    try:
        # Attempt the division
        result = a / b
        print(f"  {a} / {b} = {result}")
        return result
    except ZeroDivisionError:
        # Handle division by zero
        print(f"  Error: Cannot divide {a} by zero!")
        return None

# Test cases
print("Safe Division:")
print("=" * 40)

safe_divide(10, 2)
safe_divide(10, 0)
safe_divide(25, 5)

# Handling type errors
print()
print("Type Error Handling:")

def convert_to_int(value):
    try:
        result = int(value)
        print(f"  Converted '{value}' to {result}")
        return result
    except ValueError:
        print(f"  Error: '{value}' cannot be converted to integer")
        return None

convert_to_int("42")
convert_to_int("hello")
convert_to_int("3.14")

# Execution trace:
# 10 / 2 = 5.0 (success)
# 10 / 0 triggers ZeroDivisionError
# except block catches and prints error message

# TRY THIS: Create a calculator that handles all errors gracefully
`,
    funFact: "Python has over 60 built-in exception types for different error scenarios!"
  },
  {
    id: "eh-2",
    title: "Multiple Exceptions",
    language: "python",
    category: "Error Handling",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Handle different types of exceptions with separate except blocks.",
    code: `# Multiple Exceptions Program
# ===========================
# Handle different errors with specific except blocks

def process_data(data):
    try:
        # Attempt to access and process data
        value = data["value"]
        result = 100 / value
        print(f"  Result: {result}")

    except KeyError as e:
        # Handle missing dictionary key
        print(f"  Key Error: Missing key {e}")

    except ZeroDivisionError:
        # Handle division by zero
        print(f"  Math Error: Cannot divide by zero")

    except TypeError as e:
        # Handle wrong data type
        print(f"  Type Error: {e}")

    except Exception as e:
        # Catch any other unexpected error
        print(f"  Unexpected error: {type(e).__name__}: {e}")

# Test different scenarios
print("Processing Data:")
print("=" * 40)

# Test 1: Missing key
print("Test 1 - Missing key:")
process_data({"name": "test"})

# Test 2: Division by zero
print("\\\nTest 2 - Division by zero:")
process_data({"value": 0})

# Test 3: Wrong type
print("\\\nTest 3 - Wrong type:")
process_data({"value": "abc"})

# Test 4: Success
print("\\\nTest 4 - Success:")
process_data({"value": 5})

# Execution trace:
# Test 1: KeyError caught (no 'value' key)
# Test 2: ZeroDivisionError caught (100/0)
# Test 3: TypeError caught (100/"abc")
# Test 4: No error, prints Result: 20.0

# TRY THIS: Add input validation before processing
`,
    funFact: "Always catch specific exceptions first - Python checks except blocks in order!"
  },
  {
    id: "eh-3",
    title: "Finally Block",
    language: "python",
    category: "Error Handling",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Use finally to execute code that must run regardless of errors.",
    code: `# Finally Block Program
# =====================
# 'finally' runs whether or not an exception occurred

def process_file(filename):
    file = None
    try:
        print(f"  Opening {filename}...")
        file = open(filename, 'r')
        content = file.read()
        print(f"  Read {len(content)} characters")
        return content

    except FileNotFoundError:
        print(f"  Error: File '{filename}' not found!")
        return None

    except PermissionError:
        print(f"  Error: No permission to read '{filename}'")
        return None

    finally:
        # This ALWAYS executes - cleanup code
        if file:
            file.close()
            print(f"  Closed {filename}")
        print("  Cleanup complete")

# Test cases
print("File Processing:")
print("=" * 40)

# Create a test file first
with open("test.txt", "w") as f:
    f.write("Hello, Python!")

print("Test 1 - Existing file:")
content = process_file("test.txt")

print()
print("Test 2 - Non-existent file:")
content = process_file("missing.txt")

print()
print("Test 3 - After exception:")
print("  Program continues running!")

# Execution trace:
# Success: try block runs, finally closes file
# Error: except block runs, finally still runs
# finally ALWAYS executes, even after return/exception

# TRY THIS: Use try-except-finally with database connections
`,
    funFact: "The finally block is crucial for releasing resources like files, network connections, and memory!"
  },
  {
    id: "mp-5",
    title: "Caesar Cipher",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Encrypt and decrypt messages by shifting letters in the alphabet.",
    code: `# Caesar Cipher Program
# =====================
# Ancient encryption: shift each letter by a fixed number

def encrypt(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            # Get ASCII value, shift, wrap around using modulo
            base = ord('A') if char.isupper() else ord('a')
            shifted = (ord(char) - base + shift) % 26
            result += chr(base + shifted)
        else:
            # Non-alphabetic characters stay the same
            result += char
    return result

def decrypt(text, shift):
    # Decrypt is just encrypt with negative shift
    return encrypt(text, -shift)

# Main program
message = "Hello, World!"
shift = 3

print("Caesar Cipher:")
print("=" * 40)
print(f"Original:  {message}")

encrypted = encrypt(message, shift)
print(f"Encrypted: {encrypted}")

decrypted = decrypt(encrypted, shift)
print(f"Decrypted: {decrypted}")

# Execution trace for 'H' with shift 3:
# ord('H') = 72, ord('A') = 65
# shifted = (72 - 65 + 3) % 26 = 10
# chr(65 + 10) = chr(75) = 'K'

# TRY THIS: Try different shift values to create your own secret codes!
`,
    funFact: "Julius Caesar used this cipher with a shift of 3 to protect military messages!"
  },
  {
    id: "mp-6",
    title: "Tic Tac Toe",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Hard",
    classLevel: "Class 10",
    description: "Build a two-player Tic Tac Toe game with win detection.",
    code: `# Tic Tac Toe Game
# ================
# Two-player game on a 3x3 grid

# Initialize empty board
board = [' '] * 9  # positions 0-8

def display_board():
    print()
    for i in range(3):
        row = board[i*3:(i+1)*3]
        print(f"  {row[0]} | {row[1]} | {row[2]}")
        if i < 2:
            print(" ---|---|---")
    print()

def check_winner(player):
    # All winning combinations
    wins = [
        [0,1,2], [3,4,5], [6,7,8],  # rows
        [0,3,6], [1,4,7], [2,5,8],  # columns
        [0,4,8], [2,4,6]             # diagonals
    ]
    return any(board[i] == board[j] == board[k] == player
               for i, j, k in wins)

def is_board_full():
    return ' ' not in board

# Main game loop
print("Tic Tac Toe!")
print("Enter position 0-8 to place your mark")
display_board()

current_player = 'X'
game_over = False

while not game_over:
    try:
        pos = int(input(f"Player {current_player}, enter position (0-8): "))
        if board[pos] == ' ':
            board[pos] = current_player
            display_board()

            if check_winner(current_player):
                print(f"Player {current_player} wins!")
                game_over = True
            elif is_board_full():
                print("It's a draw!")
                game_over = True
            else:
                current_player = 'O' if current_player == 'X' else 'X'
        else:
            print("Position taken! Try again.")
    except (ValueError, IndexError):
        print("Invalid input! Enter a number 0-8.")

# Execution trace:
# Player X places at position 4 (center)
# board = [' ',' ',' ',' ','X',' ',' ',' ',' ']
# check_winner checks all combinations

# TRY THIS: Add an AI opponent that makes random moves
`,
    funFact: "Tic Tac Toe is a solved game - optimal play always results in a draw!"
  },
  {
    id: "mp-7",
    title: "Quiz App",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Build a quiz application with scoring and feedback.",
    code: `# Quiz App Program
# ================
# Interactive quiz with scoring

# Store questions as list of dictionaries
questions = [
    {
        "question": "What is the capital of France?",
        "options": ["A) London", "B) Paris", "C) Berlin", "D) Madrid"],
        "answer": "B"
    },
    {
        "question": "Which planet is known as Red Planet?",
        "options": ["A) Venus", "B) Jupiter", "C) Mars", "D) Saturn"],
        "answer": "C"
    },
    {
        "question": "What is 7 x 8?",
        "options": ["A) 54", "B) 56", "C) 48", "D) 63"],
        "answer": "B"
    }
]

def run_quiz():
    score = 0
    total = len(questions)

    print("Welcome to the Quiz!")
    print("=" * 40)

    for i, q in enumerate(questions, 1):
        print(f"\\\nQuestion {i}/{total}:")
        print(f"  {q['question']}")

        for option in q['options']:
            print(f"  {option}")

        answer = input("Your answer (A/B/C/D): ").upper()

        if answer == q['answer']:
            print("  Correct!")
            score += 1
        else:
            print(f"  Wrong! The answer was {q['answer']}")

    # Final score
    percentage = (score / total) * 100
    print("\\\n" + "=" * 40)
    print(f"Final Score: {score}/{total} ({percentage}%)")

    if percentage >= 80:
        print("Excellent!")
    elif percentage >= 60:
        print("Good job!")
    else:
        print("Keep practicing!")

run_quiz()

# Execution trace:
# Loop through questions list
# Get user input, compare with correct answer
# Update score, show final results

# TRY THIS: Add more questions and a high score tracker
`,
    funFact: "The first computer-based quiz game was 'Computer Quiz' in 1976!"
  },
  {
    id: "mp-8",
    title: "Student Manager",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Manage student records with add, view, search, and save functionality.",
    code: `# Student Manager Program
# =======================
# CRUD operations on student records

import json

# List to store student dictionaries
students = []

def add_student():
    name = input("Enter name: ")
    age = int(input("Enter age: "))
    grade = input("Enter grade: ")

    student = {
        "name": name,
        "age": age,
        "grade": grade
    }
    students.append(student)
    print(f"Added {name} successfully!")

def view_students():
    if not students:
        print("No students found!")
        return

    print("\\\nStudent List:")
    print("=" * 50)
    for i, s in enumerate(students, 1):
        print(f"{i}. {s['name']} - Age: {s['age']}, Grade: {s['grade']}")

def search_student():
    name = input("Enter name to search: ")
    found = [s for s in students if name.lower() in s['name'].lower()]

    if found:
        print(f"Found {len(found)} result(s):")
        for s in found:
            print(f"  {s['name']} - Age: {s['age']}, Grade: {s['grade']}")
    else:
        print("No students found!")

def save_to_file():
    with open("students.json", "w") as f:
        json.dump(students, f, indent=2)
    print(f"Saved {len(students)} students to file")

# Main menu
while True:
    print("\\\n=== Student Manager ===")
    print("1. Add Student")
    print("2. View All")
    print("3. Search")
    print("4. Save & Exit")

    choice = input("Choice (1-4): ")

    if choice == "1":
        add_student()
    elif choice == "2":
        view_students()
    elif choice == "3":
        search_student()
    elif choice == "4":
        save_to_file()
        break

# Execution trace:
# Add: append dict to list
# View: loop through list
# Search: list comprehension with filter
# Save: json.dump writes to file

# TRY THIS: Add delete and edit functionality
`,
    funFact: "JSON (JavaScript Object Notation) is the most popular data interchange format!"
  },
  {
    id: "mp-9",
    title: "OS Module Basics",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 10",
    description: "Explore the OS module for file system operations and path manipulation.",
    code: `# OS Module Basics Program
# ========================
# Interact with the operating system

import os

# Get current working directory
cwd = os.getcwd()
print(f"Current Directory: {cwd}")

# List files in current directory
print("\\\nFiles in current directory:")
files = os.listdir(".")
for file in files[:5]:  # Show first 5
    print(f"  - {file}")
print(f"  ... and {len(files)-5} more files")

# Path operations
print("\\\nPath Operations:")
print(f"  Join: {os.path.join('folder', 'subfolder', 'file.txt')}")
print(f"  Basename: {os.path.basename('/home/user/file.txt')}")
print(f"  Directory: {os.path.dirname('/home/user/file.txt')}")
print(f"  Exists: {os.path.exists('README.md')}")

# Create and remove directory
test_dir = "test_folder"
if not os.path.exists(test_dir):
    os.makedirs(test_dir)
    print(f"\\\nCreated directory: {test_dir}")

# File information
print("\\\nFile Information:")
if os.path.exists("README.md"):
    size = os.path.getsize("README.md")
    print(f"  README.md size: {size} bytes")
    print(f"  Is file: {os.path.isfile('README.md')}")
    print(f"  Is dir: {os.path.isdir('README.md')}")

# Clean up
if os.path.exists(test_dir):
    os.rmdir(test_dir)
    print(f"\\\nRemoved directory: {test_dir}")

# Execution trace:
# os.getcwd() returns current directory path
# os.listdir() returns list of files/folders
# os.path.join() creates platform-safe paths
# os.path.exists() checks if path exists

# TRY THIS: Write a program to find all .txt files in a directory
`,
    funFact: "The os module works on Windows, Mac, and Linux - it handles path differences automatically!"
  },
  // ========== STRINGS (87-88) ==========
  {
    id: "s-10",
    title: "String Traversal",
    language: "python",
    category: "Strings",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Traverse a string character by character using loops, with index access and character counting.",
    code: `# ============================================
# String Traversal - Character by Character
# Program 87 | CBSE Class 11 - Python
# ============================================

# --- Example 1: Basic for-loop traversal ---
message = "Hello Python"
print("Original string:", message)
print()

print("Characters in order:")
for char in message:
    print(char, end=" ")
print()

# --- Example 2: Using enumerate to get index + character ---
print("\\nWith index and character:")
for index, char in enumerate(message):
    print(f"Index {index}: '{char}'")

# --- Example 3: While-loop traversal ---
print("\\nWhile loop traversal:")
i = 0
while i < len(message):
    print(f"message[{i}] = '{message[i]}'")
    i += 1

# --- Example 4: Reverse traversal ---
print("\\nReverse traversal:")
for i in range(len(message) - 1, -1, -1):
    print(message[i], end="")
print()

# --- Example 5: Character frequency counter ---
text = "banana"
frequency = {}
for char in text:
    if char in frequency:
        frequency[char] += 1
    else:
        frequency[char] = 1

print(f"\\nFrequency of '{text}':", frequency)

# ============================================
# 🔍 Execution Trace:
# message = "Hello Python"
# Iteration 1: char = 'H'
# Iteration 2: char = 'e'
# ...
# Iteration 12: char = 'n'
# Result: All characters printed one by one
# ============================================

# TRY THIS: Modify the program to count ONLY vowels
# in the input string and print their positions.
`,
    funFact: "Python strings are immutable! Traversal doesn't modify them."
  },
  {
    id: "s-11",
    title: "Custom String Split",
    language: "python",
    category: "Strings",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Implement a custom split function manually without using the built-in split() method.",
    code: `# ============================================
# Custom String Split - Manual Implementation
# Program 88 | CBSE Class 11 - Python
# ============================================

# --- Built-in split for comparison ---
data = "apple,banana,cherry,date"
print("Original string:", data)
print("Built-in split:", data.split(","))

# --- Manual split implementation ---
def custom_split(text, delimiter):
    """Manually split a string by a delimiter."""
    result = []
    current_word = ""

    for char in text:
        if char == delimiter:
            # Found delimiter - add accumulated word to result
            result.append(current_word)
            current_word = ""  # Reset for next word
        else:
            # Not delimiter - keep building current word
            current_word += char

    # Don't forget the last word (no trailing delimiter)
    result.append(current_word)
    return result

# Test with comma delimiter
parts = custom_split(data, ",")
print("\\nCustom split result:", parts)

# --- Manual split with space delimiter ---
sentence = "Python is fun and powerful"
words = custom_split(sentence, " ")
print("Split by space:", words)

# --- Manual split with multiple characters ---
complex_data = "one::two::three::four"
result = custom_split(complex_data, "::")
print("Split by '::':", result)

# --- Edge cases ---
print("\\nEdge cases:")
print("Empty string:", custom_split("", ","))
print("No delimiter found:", custom_split("hello", ","))
print("Starts with delimiter:", custom_split(",hello", ","))
print("Ends with delimiter:", custom_split("hello,", ","))

# ============================================
# 🔍 Execution Trace:
# custom_split("apple,banana", ",")
# i=0: char='a' → current_word="a"
# i=1: char='p' → current_word="ap"
# i=2: char='p' → current_word="app"
# i=3: char='l' → current_word="appl"
# i=4: char='e' → current_word="apple"
# i=5: char=',' → result=["apple"], current_word=""
# i=6-11: → current_word="banana"
# Final: result=["apple", "banana"]
# ============================================

# TRY THIS: Extend custom_split to handle multiple
# consecutive delimiters by treating them as one.
`,
    funFact: "Python's built-in split() also handles multiple delimiters and strips whitespace!"
  },

  // ========== LISTS (89-90) ==========
  {
    id: "lt-9",
    title: "List as Function Argument",
    language: "python",
    category: "Lists",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Understand how lists behave when passed to functions - mutable references vs immutable copies.",
    code: `# ============================================
# List as Function Argument - Mutable Behavior
# Program 89 | CBSE Class 11 - Python
# ============================================

# --- Lists are MUTABLE - changes affect original ---
def modify_list(lst):
    """Modify a list in-place."""
    lst.append(99)
    lst[0] = "MODIFIED"
    return lst

original = [1, 2, 3, 4]
print("Original before:", original)

modified = modify_list(original)
print("After modify_list:", modified)
print("Original after:", original)  # SAME reference!

# --- Creating a COPY prevents mutation ---
def safe_modify(lst):
    """Work on a copy, leaving original unchanged."""
    new_lst = lst.copy()  # or lst[:]
    new_lst.append(100)
    return new_lst

original_2 = [10, 20, 30]
print("\\nOriginal:", original_2)
copy_result = safe_modify(original_2)
print("After safe_modify:", copy_result)
print("Original unchanged:", original_2)

# --- Reassignment doesn't affect original ---
def reassign_list(lst):
    """Reassignment creates new local reference."""
    lst = [999, 888, 777]  # This does NOT modify original
    return lst

original_3 = [1, 2, 3]
result = reassign_list(original_3)
print("\\nOriginal:", original_3)
print("After reassign:", result)

# --- Function that modifies specific positions ---
def double_elements(lst):
    """Double every element in place."""
    for i in range(len(lst)):
        lst[i] *= 2

numbers = [1, 2, 3, 4, 5]
print("\\nBefore double:", numbers)
double_elements(numbers)
print("After double:", numbers)

# ============================================
# 🔍 Execution Trace:
# original = [1, 2, 3, 4]
# lst.append(99) → original = [1, 2, 3, 4, 99]
# lst[0] = "MODIFIED" → original = ["MODIFIED", 2, 3, 4, 99]
# Lists passed by REFERENCE, not by VALUE!
# ============================================

# TRY THIS: Write a function that removes all even
# numbers from a list in-place and returns the count removed.
`,
    funFact: "In Python, mutable objects like lists are passed by object reference!"
  },
  {
    id: "lt-10",
    title: "Shallow vs Deep Copy",
    language: "python",
    category: "Lists",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Explore the difference between shallow copy and deep copy for nested data structures.",
    code: `# ============================================
# Shallow vs Deep Copy - Nested Structures
# Program 90 | CBSE Class 11 - Python
# ============================================

import copy

# --- Nested list scenario ---
original = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
print("Original:", original)

# Shallow copy - only copies outer list references
shallow = original.copy()
print("\\nShallow copy:", shallow)

# Deep copy - recursively copies everything
deep = copy.deepcopy(original)
print("Deep copy:", deep)

# --- Modify nested element ---
original[0][0] = 999
print("\\nAfter modifying original[0][0] = 999:")
print("Original:", original)
print("Shallow:", shallow)  # ALSO changed!
print("Deep:", deep)         # UNCHANGED!

# --- Creating fresh copies for next test ---
original = [[1, 2], [3, 4]]
shallow = original.copy()
deep = copy.deepcopy(original)

# --- Different copy methods ---
import copy
list1 = [[10, 20], [30, 40]]
list2 = list(list1)       # Also shallow copy
list3 = list1[:]          # Slice copy (shallow)
list4 = copy.deepcopy(list1)  # Deep copy

list1[0][0] = "X"
print("\\nCopy comparison:")
print("Original:", list1)
print("list(list1):", list2)      # Changed
print("list1[:]:", list3)          # Changed
print("deepcopy:", list4)          # Unchanged

# --- Dictionary deep copy ---
config = {"settings": {"theme": "dark", "font": 12}}
shallow_config = config.copy()
deep_config = copy.deepcopy(config)

config["settings"]["theme"] = "light"
print("\\nDict shallow vs deep:")
print("Original:", config["settings"]["theme"])
print("Shallow:", shallow_config["settings"]["theme"])  # light
print("Deep:", deep_config["settings"]["theme"])         # dark

# ============================================
# 🔍 Execution Trace:
# original = [[1, 2, 3], [4, 5, 6]]
# shallow = original.copy() → same nested references
# deep = copy.deepcopy(original) → new nested objects
# Modifying original[0][0] affects shallow but NOT deep
# ============================================

# TRY THIS: Create a nested dictionary and show how
# shallow and deep copies behave differently when
# you modify a nested key.
`,
    funFact: "The 'copy' module's deepcopy is essential when working with complex nested data in real applications!"
  },

  // ========== TUPLES (91) ==========
  {
    id: "tp-6",
    title: "Tuple Hashing Deep Dive",
    language: "python",
    category: "Tuples",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Understand why tuples can be dictionary keys and set elements while lists cannot.",
    code: `# ============================================
# Tuple Hashing Deep Dive - Why Tuples Work as Keys
# Program 91 | CBSE Class 11 - Python
# ============================================

# --- Tuples are HASHABLE (immutable) ---
point = (3, 4)
print("Tuple:", point)
print("Hash of (3,4):", hash(point))

# Tuples as dictionary keys
coordinates = {
    (0, 0): "Origin",
    (1, 0): "East",
    (0, 1): "North",
    (3, 4): "Point A"
}
print("\\nCoordinates:", coordinates)
print("Value at (3,4):", coordinates[(3, 4)])

# Tuples in sets
unique_points = {(1, 2), (3, 4), (1, 2)}  # Duplicate removed
print("\\nUnique points:", unique_points)

# --- Lists are NOT hashable ---
try:
    bad_dict = {[1, 2]: "value"}
except TypeError as e:
    print(f"\\nError with list key: {e}")

try:
    bad_set = {[1, 2], [3, 4]}
except TypeError as e:
    print(f"Error with list in set: {e}")

# --- What makes something hashable? ---
print("\\nHashable examples:")
print("hash(42):", hash(42))
print("hash('hello'):", hash("hello"))
print("hash((1, 2, 3)):", hash((1, 2, 3)))
print("hash(True):", hash(True))

# --- Nested tuple hashing ---
nested = ((1, 2), (3, 4))
print("\\nNested tuple hash:", hash(nested))
data = {nested: "nested pairs"}
print("Dict with nested tuple:", data)

# --- Hashable custom key pattern ---
student_grades = {
    ("Alice", "Math"): 95,
    ("Bob", "Science"): 87,
    ("Alice", "English"): 92
}

name = "Alice"
subject = "Math"
print(f"\\n{name}'s {subject} grade:", student_grades[(name, subject)])

# ============================================
# 🔍 Execution Trace:
# hash((3, 4)) computes once and is cached
# Dictionary uses hash to quickly locate keys
# Lists can't be hashed because they can change
# ============================================

# TRY THIS: Create a dictionary using coordinate tuples
# as keys and store the count of students at each location.
`,
    funFact: "Python caches small integer hashes, which is why hash(42) always returns 42!"
  },

  // ========== DICTIONARIES (92) ==========
  {
    id: "dc-7",
    title: "Dictionary Comprehension",
    language: "python",
    category: "Dictionaries",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Create dictionaries concisely using dictionary comprehension syntax.",
    code: `# ============================================
# Dictionary Comprehension - Concise Creation
# Program 92 | CBSE Class 11 - Python
# ============================================

# --- Basic dictionary comprehension ---
squares = {x: x**2 for x in range(1, 11)}
print("Squares:", squares)

# --- With condition ---
even_squares = {x: x**2 for x in range(1, 11) if x % 2 == 0}
print("Even squares:", even_squares)

# --- From two lists ---
names = ["Alice", "Bob", "Charlie"]
scores = [85, 92, 78]
grade_book = {name: score for name, score in zip(names, scores)}
print("Grade book:", grade_book)

# --- Transform existing dictionary ---
original = {"a": 1, "b": 2, "c": 3}
swapped = {v: k for k, v in original.items()}
print("\\nOriginal:", original)
print("Swapped:", swapped)

# --- With string manipulation ---
words = ["hello", "world", "python"]
word_lengths = {word: len(word) for word in words}
print("Word lengths:", word_lengths)

# --- Nested dictionary comprehension ---
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
position_map = {
    f"row{r}": {f"col{c}": val for c, val in enumerate(row)}
    for r, row in enumerate(matrix)
}
print("\\nPosition map:", position_map)

# --- Filtering and transforming ---
temperatures = {"Mon": 25, "Tue": 30, "Wed": 22, "Thu": 35, "Fri": 28}
hot_days = {day: temp for day, temp in temperatures.items() if temp > 27}
print("Hot days:", hot_days)

# ============================================
# 🔍 Execution Trace:
# {x: x**2 for x in range(1, 6)}
# x=1 → {1: 1}
# x=2 → {1: 1, 2: 4}
# x=3 → {1: 1, 2: 4, 3: 9}
# x=4 → {1: 1, 2: 4, 3: 9, 4: 16}
# x=5 → {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}
# ============================================

# TRY THIS: Create a dictionary where keys are numbers
# 1-20 and values are "Even" or "Odd" using comprehension.
`,
    funFact: "Dictionary comprehensions are faster than using a for-loop with dict assignment!"
  },

  // ========== FUNCTIONS (93-96) ==========
  {
    id: "fn-12",
    title: "Lambda with Sorted",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Use lambda functions with sorted() to customize sorting behavior.",
    code: `# ============================================
# Lambda with Sorted - Custom Sorting
# Program 93 | CBSE Class 11 - Python
# ============================================

# --- Sort by length ---
words = ["banana", "pie", "Washington", "go", "Python"]
by_length = sorted(words, key=lambda w: len(w))
print("By length:", by_length)

# --- Sort dictionary by value ---
scores = {"Alice": 88, "Bob": 95, "Charlie": 72, "Diana": 91}
by_score = dict(sorted(scores.items(), key=lambda item: item[1], reverse=True))
print("\\nScores ranked:", by_score)

# --- Sort list of tuples ---
students = [("Alice", 88), ("Bob", 95), ("Charlie", 72)]
by_grade = sorted(students, key=lambda s: s[1], reverse=True)
print("Students by grade:", by_grade)

# --- Sort by second element ---
pairs = [(1, "b"), (3, "a"), (2, "c")]
by_second = sorted(pairs, key=lambda p: p[1])
print("\\nBy second element:", by_second)

# --- Sort complex data ---
products = [
    {"name": "Laptop", "price": 999},
    {"name": "Phone", "price": 699},
    {"name": "Tablet", "price": 499}
]
by_price = sorted(products, key=lambda p: p["price"])
print("By price:", [p["name"] for p in by_price])

# --- Multiple sort criteria ---
data = [("Alice", 25), ("Bob", 22), ("Charlie", 25), ("Diana", 22)]
# Sort by age, then by name
multi_sort = sorted(data, key=lambda x: (x[1], x[0]))
print("\\nBy age then name:", multi_sort)

# ============================================
# 🔍 Execution Trace:
# sorted(words, key=lambda w: len(w))
# "go" → len=2, "pie" → len=3, "banana" → len=6
# Python calls lambda for each element
# Sorted by the returned key value
# ============================================

# TRY THIS: Sort a list of dictionaries by multiple
# keys - first by city, then by name.
`,
    funFact: "Lambda functions are anonymous functions defined in a single line!"
  },
  {
    id: "fn-13",
    title: "Map Filter Reduce",
    language: "python",
    category: "Functions",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Master the functional programming trio: map(), filter(), and reduce().",
    code: `# ============================================
# Map Filter Reduce - Functional Programming
# Program 94 | CBSE Class 11 - Python
# ============================================

from functools import reduce

# --- MAP: Transform every element ---
numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))
print("Original:", numbers)
print("Doubled:", doubled)

# Map with multiple iterables
names = ["alice", "bob", "charlie"]
capitalized = list(map(str.capitalize, names))
print("Capitalized:", capitalized)

# --- FILTER: Keep elements that pass test ---
numbers = range(1, 21)
evens = list(filter(lambda x: x % 2 == 0, numbers))
print("\\nEven numbers:", evens)

# Filter with complex condition
words = ["hello", "world", "hi", "python", "a"]
long_words = list(filter(lambda w: len(w) > 3, words))
print("Long words:", long_words)

# --- REDUCE: Combine all elements ---
numbers = [1, 2, 3, 4, 5]
total = reduce(lambda acc, x: acc + x, numbers)
print("\\nSum via reduce:", total)

product = reduce(lambda acc, x: acc * x, numbers)
print("Product via reduce:", product)

# Reduce with initial value
concat = reduce(lambda acc, x: acc + "-" + x, ["a", "b", "c"], "start")
print("Concatenation:", concat)

# --- Combining all three ---
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Square even numbers and sum them
result = reduce(
    lambda acc, x: acc + x,
    map(lambda x: x**2,
        filter(lambda x: x % 2 == 0, data))
)
print("\\nSum of squares of evens:", result)

# ============================================
# 🔍 Execution Trace:
# map(lambda x: x*2, [1,2,3]) → [2,4,6]
# filter(lambda x: x>2, [1,2,3,4]) → [3,4]
# reduce(lambda a,x: a+x, [1,2,3]) → 6
# ============================================

# TRY THIS: Use map, filter, and reduce to find the
# average of all odd numbers in a list.
`,
    funFact: "Map, filter, and reduce are originally from functional programming languages like Lisp!"
  },
  {
    id: "fn-14",
    title: "Decorator Basics",
    language: "python",
    category: "Functions",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Learn to use decorators to modify or extend function behavior without changing the function itself.",
    code: `# ============================================
# Decorator Basics - @decorator Syntax
# Program 95 | CBSE Class 11 - Python
# ============================================

import time

# --- Simple decorator ---
def timer_decorator(func):
    """Measure execution time of a function."""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"  [{func.__name__} took {end-start:.4f}s]")
        return result
    return wrapper

# --- Apply decorator with @ syntax ---
@timer_decorator
def slow_add(a, b):
    """Add two numbers with a simulated delay."""
    time.sleep(0.1)
    return a + b

@timer_decorator
def slow_multiply(a, b):
    """Multiply two numbers with a simulated delay."""
    time.sleep(0.15)
    return a * b

print("Using @timer_decorator:")
result1 = slow_add(3, 4)
print(f"  Result: {result1}")

result2 = slow_multiply(5, 6)
print(f"  Result: {result2}")

# --- Logging decorator ---
def log_call(func):
    """Log each function call."""
    def wrapper(*args, **kwargs):
        print(f"  Calling {func.__name__}({args}, {kwargs})")
        result = func(*args, **kwargs)
        print(f"  {func.__name__} returned {result}")
        return result
    return wrapper

@log_call
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print("\\nUsing @log_call:")
greet("Alice")
greet("Bob", greeting="Hi")

# --- Without decorator (manual application) ---
def add(a, b):
    return a + b

decorated_add = timer_decorator(add)
print("\\nManual decoration:")
result = decorated_add(10, 20)
print(f"  Result: {result}")

# ============================================
# 🔍 Execution Trace:
# @timer_decorator
# def slow_add(a, b): ...
# is equivalent to:
# slow_add = timer_decorator(slow_add)
# wrapper wraps the original function
# ============================================

# TRY THIS: Create a decorator that retries a function
# up to 3 times if it raises an exception.
`,
    funFact: "Decorators are widely used in web frameworks like Flask and Django for routing!"
  },
  {
    id: "fn-15",
    title: "Tower of Hanoi",
    language: "python",
    category: "Functions",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Solve the classic Tower of Hanoi puzzle using recursive thinking with 3 recursive calls.",
    code: `# ============================================
# Tower of Hanoi - Classic Recursion
# Program 96 | CBSE Class 11 - Python
# ============================================

def tower_of_hanoi(n, source, auxiliary, target):
    """
    Solve Tower of Hanoi for n disks.
    Moves all disks from source to target using auxiliary.
    """
    if n == 1:
        # Base case: move single disk directly
        print(f"  Move disk 1 from {source} to {target}")
        return 1

    # Recursive case 1: Move n-1 disks from source to auxiliary
    moves = 0
    moves += tower_of_hanoi(n - 1, source, target, auxiliary)

    # Move largest disk from source to target
    print(f"  Move disk {n} from {source} to {target}")
    moves += 1

    # Recursive case 2: Move n-1 disks from auxiliary to target
    moves += tower_of_hanoi(n - 1, auxiliary, source, target)

    return moves

# --- Solve for different numbers of disks ---
print("Tower of Hanoi - 3 disks:")
total = tower_of_hanoi(3, "A", "B", "C")
print(f"  Total moves: {total}\\n")

print("Tower of Hanoi - 4 disks:")
total = tower_of_hanoi(4, "A", "B", "C")
print(f"  Total moves: {total}\\n")

# --- Formula verification ---
print("Minimum moves formula: 2^n - 1")
for n in range(1, 6):
    formula = 2**n - 1
    print(f"  {n} disks: {formula} moves")

# --- Visual representation ---
print("\\nStep-by-step for 3 disks:")
print("=" * 40)
tower_of_hanoi(3, "Source", "Aux", "Target")
print("=" * 40)
print(f"Total: 2^3 - 1 = {2**3 - 1} moves")

# ============================================
# 🔍 Execution Trace:
# tower_of_hanoi(3, A, B, C):
#   Move 2 from A to B (recursive)
#     Move 1 from A to C
#     Move 2 from A to B
#     Move 1 from C to B
#   Move 3 from A to C
#   Move 2 from B to C (recursive)
#     Move 1 from B to A
#     Move 2 from B to C
#     Move 1 from A to C
# ============================================

# TRY THIS: Modify the program to track and print
# the state of all three pegs after each move.
`,
    funFact: "With 64 disks, the Tower of Hanoi would take 18,446,744,073,709,551,615 moves!"
  },

  // ========== ERROR HANDLING (97-99) ==========
  {
    id: "fh-5",
    title: "File Exception Combo",
    language: "python",
    category: "Error Handling",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Handle file operations with proper exception handling for robust file processing.",
    code: `# ============================================
# File Exception Combo - Safe File Operations
# Program 97 | CBSE Class 11 - Python
# ============================================

import os

# --- Safe file reading with multiple exception handlers ---
def safe_read_file(filename):
    """Read a file with comprehensive error handling."""
    try:
        with open(filename, 'r') as file:
            content = file.read()
            print(f"  Read {len(content)} characters from '{filename}'")
            return content
    except FileNotFoundError:
        print(f"  Error: File '{filename}' not found!")
        return None
    except PermissionError:
        print(f"  Error: No permission to read '{filename}'!")
        return None
    except IOError as e:
        print(f"  I/O Error: {e}")
        return None

# --- Safe file writing ---
def safe_write_file(filename, content):
    """Write to a file with error handling."""
    try:
        with open(filename, 'w') as file:
            file.write(content)
            print(f"  Successfully wrote to '{filename}'")
            return True
    except PermissionError:
        print(f"  Error: No permission to write to '{filename}'!")
        return False
    except Exception as e:
        print(f"  Unexpected error: {e}")
        return False

# --- Demo: Create, read, and handle errors ---
print("1. Writing to a file:")
safe_write_file("test_data.txt", "Line 1: Hello\\nLine 2: World\\nLine 3: Python")

print("\\n2. Reading the file:")
content = safe_read_file("test_data.txt")
if content:
    print(f"  Content preview: {content[:30]}...")

print("\\n3. Reading non-existent file:")
safe_read_file("missing_file.txt")

# --- Process multiple files safely ---
def process_files(filenames):
    """Process a list of files safely."""
    results = {}
    for filename in filenames:
        try:
            with open(filename, 'r') as f:
                lines = f.readlines()
                results[filename] = len(lines)
                print(f"  {filename}: {len(lines)} lines")
        except FileNotFoundError:
            print(f"  {filename}: NOT FOUND")
            results[filename] = 0
        except Exception as e:
            print(f"  {filename}: ERROR - {e}")
            results[filename] = -1
    return results

print("\\n4. Processing multiple files:")
file_list = ["test_data.txt", "missing.txt", "another.txt"]
process_files(file_list)

# Clean up
if os.path.exists("test_data.txt"):
    os.remove("test_data.txt")

# ============================================
# 🔍 Execution Trace:
# try: open(file) → succeeds
# except FileNotFoundError: handle missing
# except PermissionError: handle access denied
# except IOError: handle other I/O issues
# ============================================

# TRY THIS: Add a retry mechanism that asks the user
# for a different filename if the first one fails.
`,
    funFact: "Using 'with' statement ensures files are automatically closed even if exceptions occur!"
  },
  {
    id: "eh-4",
    title: "Logger Program",
    language: "python",
    category: "Error Handling",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Use Python's logging module to track program execution and errors professionally.",
    code: `# ============================================
# Logger Program - Professional Logging
# Program 98 | CBSE Class 11 - Python
# ============================================

import logging

# --- Configure logging ---
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# --- Demo different log levels ---
print("Logging demonstration:\\n")

logger.debug("This is a DEBUG message - detailed info")
logger.info("This is an INFO message - general info")
logger.warning("This is a WARNING message - something unexpected")
logger.error("This is an ERROR message - something failed")
logger.critical("This is a CRITICAL message - program may stop")

# --- Practical example: Calculator with logging ---
def divide(a, b):
    """Divide with logging."""
    logger.info(f"Dividing {a} by {b}")
    try:
        result = a / b
        logger.debug(f"Result: {result}")
        return result
    except ZeroDivisionError:
        logger.error("Division by zero attempted!")
        return None
    except TypeError:
        logger.error(f"Invalid types: {type(a)}, {type(b)}")
        return None

print("\\nCalculator with logging:")
divide(10, 3)
divide(10, 0)
divide("10", 5)

# --- Logging to file ---
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.WARNING)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))

logger.addHandler(file_handler)
print("\\nWarnings and errors also logged to 'app.log'")

# ============================================
# 🔍 Execution Trace:
# DEBUG < INFO < WARNING < ERROR < CRITICAL
# Each level shows messages at that level and above
# File handler captures only WARNING+ messages
# ============================================

# TRY THIS: Create a logger that tracks user login
# attempts with timestamps and success/failure status.
`,
    funFact: "The logging module is used in production Python apps at companies like Google and Netflix!"
  },
  {
    id: "eh-5",
    title: "Custom Exception",
    language: "python",
    category: "Error Handling",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Create and raise custom exceptions for specific error conditions in your programs.",
    code: `# ============================================
# Custom Exception - Raise and Handle
# Program 99 | CBSE Class 11 - Python
# ============================================

# --- Define custom exception ---
class InsufficientFundsError(Exception):
    """Raised when withdrawal exceeds balance."""
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(
            f"Cannot withdraw ₹{amount}. Balance: ₹{balance}. "
            f"Need ₹{amount - balance} more."
        )

class InvalidAgeError(Exception):
    """Raised when age is not valid."""
    def __init__(self, age):
        self.age = age
        super().__init__(f"Invalid age: {age}. Must be 0-150.")

# --- Use custom exceptions ---
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return self.balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.balance += amount
        return self.balance

# --- Demo custom exception ---
account = BankAccount("Alice", 1000)

try:
    print(f"Balance: ₹{account.balance}")
    account.withdraw(500)
    print(f"After ₹500 withdrawal: ₹{account.balance}")
    account.withdraw(600)  # This will raise InsufficientFundsError
except InsufficientFundsError as e:
    print(f"\\nCustom Exception Caught!")
    print(f"  {e}")
    print(f"  Balance: ₹{e.balance}, Tried: ₹{e.amount}")

# --- InvalidAgeError demo ---
def validate_age(age):
    if not isinstance(age, int) or age < 0 or age > 150:
        raise InvalidAgeError(age)
    return True

print("\\nAge validation:")
test_ages = [25, -5, 200, "abc", 100]
for age in test_ages:
    try:
        validate_age(age)
        print(f"  Age {age}: Valid")
    except InvalidAgeError as e:
        print(f"  Age {age}: {e}")
    except TypeError:
        print(f"  Age {age}: Must be an integer")

# ============================================
# 🔍 Execution Trace:
# InsufficientFundsError inherits from Exception
# raise creates an exception instance
# try/except catches and handles it
# Custom attributes provide context
# ============================================

# TRY THIS: Create a custom PasswordError exception
# that validates password strength (min 8 chars, has digit,
# has uppercase). Raise it for weak passwords.
`,
    funFact: "Custom exceptions help create clear, maintainable error handling in large applications!"
  },

  // ========== OOP (100-104) ==========
  {
    id: "oo-1",
    title: "Bank Account Class",
    language: "python",
    category: "OOP",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Create a BankAccount class with __init__, deposit, withdraw, and balance checking methods.",
    code: `# ============================================
# Bank Account Class - OOP Basics
# Program 100 | CBSE Class 11 - Python
# ============================================

class BankAccount:
    """A simple bank account class."""

    def __init__(self, owner, balance=0):
        """Initialize account with owner name and balance."""
        self.owner = owner
        self.balance = balance
        self.transactions = []
        self.log(f"Account created with ₹{balance}")

    def deposit(self, amount):
        """Add money to account."""
        if amount <= 0:
            print("Deposit amount must be positive!")
            return False
        self.balance += amount
        self.log(f"Deposited ₹{amount}")
        print(f"  ₹{amount} deposited. Balance: ₹{self.balance}")
        return True

    def withdraw(self, amount):
        """Remove money from account."""
        if amount <= 0:
            print("Withdrawal amount must be positive!")
            return False
        if amount > self.balance:
            print(f"  Insufficient funds! Balance: ₹{self.balance}")
            return False
        self.balance -= amount
        self.log(f"Withdrew ₹{amount}")
        print(f"  ₹{amount} withdrawn. Balance: ₹{self.balance}")
        return True

    def get_balance(self):
        """Return current balance."""
        return self.balance

    def log(self, message):
        """Log transaction with message."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.transactions.append(f"[{timestamp}] {message}")

    def show_transactions(self):
        """Display all transactions."""
        print(f"\\n  Transaction history for {self.owner}:")
        for t in self.transactions:
            print(f"    {t}")

# --- Demo the BankAccount class ---
print("Creating accounts:")
alice = BankAccount("Alice", 5000)
bob = BankAccount("Bob", 1000)

print("\\nAlice's transactions:")
alice.deposit(2000)
alice.withdraw(1500)
alice.withdraw(6000)  # Should fail

print("\\nBob's transactions:")
bob.deposit(500)
bob.withdraw(200)

# Show transaction history
alice.show_transactions()
bob.show_transactions()

# ============================================
# 🔍 Execution Trace:
# alice = BankAccount("Alice", 5000)
#   → __init__ sets owner="Alice", balance=5000
# alice.deposit(2000)
#   → balance becomes 7000
# alice.withdraw(1500)
#   → balance becomes 5500
# ============================================

# TRY THIS: Add a transfer method that moves money
# from one account to another with validation.
`,
    funFact: "The __init__ method in Python is the constructor that runs when you create an object!"
  },
  {
    id: "oo-2",
    title: "Student Class",
    language: "python",
    category: "OOP",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Build a Student class with attributes, __str__ method, and utility functions.",
    code: `# ============================================
# Student Class - Attributes and __str__
# Program 101 | CBSE Class 11 - Python
# ============================================

class Student:
    """Represents a student with marks and grade calculation."""

    def __init__(self, name, roll_no, marks=None):
        """Initialize student with name, roll number, and marks."""
        self.name = name
        self.roll_no = roll_no
        self.marks = marks if marks else []

    def add_mark(self, mark):
        """Add a mark to the student's record."""
        if 0 <= mark <= 100:
            self.marks.append(mark)
        else:
            print(f"Invalid mark: {mark}. Must be 0-100.")

    def get_average(self):
        """Calculate average of all marks."""
        if not self.marks:
            return 0
        return sum(self.marks) / len(self.marks)

    def get_grade(self):
        """Determine grade based on average."""
        avg = self.get_average()
        if avg >= 90:
            return "A+"
        elif avg >= 80:
            return "A"
        elif avg >= 70:
            return "B"
        elif avg >= 60:
            return "C"
        elif avg >= 50:
            return "D"
        else:
            return "F"

    def is_passed(self):
        """Check if student passed (average >= 50)."""
        return self.get_average() >= 50

    def __str__(self):
        """String representation for print()."""
        return (f"Student({self.name}, Roll#{self.roll_no}, "
                f"Avg: {self.get_average():.1f}, Grade: {self.get_grade()})")

    def __repr__(self):
        """Developer-friendly representation."""
        return f"Student('{self.name}', {self.roll_no}, {self.marks})"

# --- Demo the Student class ---
print("Creating students:")
s1 = Student("Alice", 101, [85, 92, 78])
s2 = Student("Bob", 102, [45, 55, 60])
s3 = Student("Charlie", 103)

print("\\nAdding marks to Charlie:")
s3.add_mark(88)
s3.add_mark(92)
s3.add_mark(76)

# Print using __str__
print(f"\\n{s1}")
print(f"{s2}")
print(f"{s3}")

# Detailed info
for student in [s1, s2, s3]:
    print(f"\\n{student.name}'s Report:")
    print(f"  Marks: {student.marks}")
    print(f"  Average: {student.get_average():.1f}")
    print(f"  Grade: {student.get_grade()}")
    print(f"  Status: {'Passed' if student.is_passed() else 'Failed'}")

# ============================================
# 🔍 Execution Trace:
# s1 = Student("Alice", 101, [85, 92, 78])
#   __str__ returns formatted string
#   print(s1) calls __str__ automatically
#   get_average() = (85+92+78)/3 = 85.0
# ============================================

# TRY THIS: Add a class method to find the student
# with the highest average from a list of students.
`,
    funFact: "Python's __str__ method is called automatically when you use print() on an object!"
  },
  {
    id: "oo-3",
    title: "Inheritance Demo",
    language: "python",
    category: "OOP",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Understand inheritance by creating child classes that inherit from a parent class.",
    code: `# ============================================
# Inheritance Demo - Class Child(Parent)
# Program 102 | CBSE Class 11 - Python
# ============================================

# --- Parent class ---
class Animal:
    """Base class for all animals."""

    def __init__(self, name, species):
        self.name = name
        self.species = species
        self.is_alive = True

    def eat(self):
        return f"{self.name} is eating"

    def sleep(self):
        return f"{self.name} is sleeping"

    def __str__(self):
        return f"{self.name} the {self.species}"

# --- Child class 1 ---
class Dog(Animal):
    """Dog inherits from Animal."""

    def __init__(self, name, breed):
        super().__init__(name, species="Dog")
        self.breed = breed
        self.tricks = []

    def bark(self):
        return f"{self.name} says Woof!"

    def learn_trick(self, trick):
        self.tricks.append(trick)

    def perform_trick(self, trick):
        if trick in self.tricks:
            return f"{self.name} performs {trick}!"
        return f"{self.name} doesn't know {trick}"

# --- Child class 2 ---
class Cat(Animal):
    """Cat inherits from Animal."""

    def __init__(self, name, color):
        super().__init__(name, species="Cat")
        self.color = color

    def meow(self):
        return f"{self.name} says Meow!"

    def purr(self):
        return f"{self.name} is purring..."

# --- Demo inheritance ---
print("=== Inheritance Demo ===\\n")

# Animal (parent)
generic = Animal("Generic", "Animal")
print(f"Animal: {generic}")
print(f"  {generic.eat()}")
print(f"  {generic.sleep()}")

# Dog (child)
dog = Dog("Buddy", "Golden Retriever")
print(f"\\nDog: {dog}")
print(f"  {dog.eat()}")     # Inherited from Animal
print(f"  {dog.sleep()}")   # Inherited from Animal
print(f"  {dog.bark()}")    # Dog-specific method
dog.learn_trick("sit")
dog.learn_trick("shake")
print(f"  {dog.perform_trick('sit')}")
print(f"  {dog.perform_trick('roll over')}")

# Cat (child)
cat = Cat("Whiskers", "Orange")
print(f"\\nCat: {cat}")
print(f"  {cat.eat()}")     # Inherited
print(f"  {cat.meow()}")    # Cat-specific
print(f"  {cat.purr()}")

# --- Check inheritance relationships ---
print(f"\\nDog is Animal? {isinstance(dog, Animal)}")
print(f"Dog is Dog? {isinstance(dog, Dog)}")
print(f"Cat is Animal? {isinstance(cat, Animal)}")

# ============================================
# 🔍 Execution Trace:
# Dog.__init__ calls super().__init__() (Animal)
# Dog gets all Animal methods + its own
# dog.eat() works because Dog inherits from Animal
# ============================================

# TRY THIS: Create a Vehicle parent class with
# Car and Motorcycle children that add specific features.
`,
    funFact: "Python supports multiple inheritance - a class can inherit from multiple parents!"
  },
  {
    id: "oo-4",
    title: "Method Overriding",
    language: "python",
    category: "OOP",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Override parent class methods in child classes to provide specialized behavior.",
    code: `# ============================================
# Method Overriding - Same Method Name
# Program 103 | CBSE Class 11 - Python
# ============================================

class Shape:
    """Base class for geometric shapes."""

    def __init__(self, color="Red"):
        self.color = color

    def area(self):
        """Default area calculation."""
        return 0

    def describe(self):
        return f"A {self.color} shape with area {self.area():.2f}"

    def __str__(self):
        return f"{self.__class__.__name__}({self.color})"

# --- Child classes OVERRIDE area() ---
class Circle(Shape):
    """Circle with overridden area method."""

    def __init__(self, radius, color="Red"):
        super().__init__(color)
        self.radius = radius

    def area(self):  # Override parent's area()
        return 3.14159 * self.radius ** 2

    def describe(self):  # Override parent's describe()
        return f"A {self.color} circle (r={self.radius}) with area {self.area():.2f}"

class Rectangle(Shape):
    """Rectangle with overridden area method."""

    def __init__(self, width, height, color="Blue"):
        super().__init__(color)
        self.width = width
        self.height = height

    def area(self):  # Override
        return self.width * self.height

    def describe(self):
        return f"A {self.color} rectangle ({self.width}x{self.height}) with area {self.area():.2f}"

class Triangle(Shape):
    """Triangle with overridden area method."""

    def __init__(self, base, height, color="Green"):
        super().__init__(color)
        self.base = base
        self.height = height

    def area(self):  # Override
        return 0.5 * self.base * self.height

# --- Demo method overriding ---
print("=== Method Overriding Demo ===\\n")

shapes = [
    Circle(5, "Red"),
    Rectangle(4, 6, "Blue"),
    Triangle(3, 8, "Green")
]

for shape in shapes:
    # Polymorphism: same method name, different behavior
    print(f"{shape}")
    print(f"  {shape.describe()}")
    print()

# --- Show method resolution order ---
print("Method Resolution Order (MRO):")
print(f"  Circle MRO: {[c.__name__ for c in Circle.__mro__]}")
print(f"  Rectangle MRO: {[c.__name__ for c in Rectangle.__mro__]}")

# --- Calling parent method explicitly ---
rect = Rectangle(5, 3)
print(f"\\nCalling parent area(): {Shape.area(rect)}")  # Returns 0
print(f"Calling overridden area(): {rect.area()}")      # Returns 15

# ============================================
# 🔍 Execution Trace:
# shape.area() calls Circle.area() → 3.14 * r²
# shape.area() calls Rectangle.area() → w * h
# Same method name, different implementations
# This is POLYMORPHISM in action!
# ============================================

# TRY THIS: Add a Square class that inherits from
# Rectangle and overrides __init__ to accept one side.
`,
    funFact: "Method overriding enables polymorphism - one interface, multiple implementations!"
  },
  {
    id: "oo-5",
    title: "Encapsulation",
    language: "python",
    category: "OOP",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Implement encapsulation using _private attributes and @property decorators.",
    code: `# ============================================
# Encapsulation - _private and @property
# Program 104 | CBSE Class 11 - Python
# ============================================

class Employee:
    """Encapsulated Employee class with controlled access."""

    def __init__(self, name, salary, department):
        self.name = name
        self._salary = salary          # Protected (convention)
        self.__department = department  # Private (name mangled)

    # --- Property decorator for controlled access ---
    @property
    def salary(self):
        """Getter - controlled access to salary."""
        return self._salary

    @salary.setter
    def salary(self, value):
        """Setter - validates before setting."""
        if value < 0:
            raise ValueError("Salary cannot be negative!")
        if value > 1000000:
            raise ValueError("Salary seems unrealistic!")
        self._salary = value

    @property
    def department(self):
        """Getter for private department."""
        return self.__department

    def get_info(self):
        return f"{self.name} | ₹{self._salary:,} | {self.__department}"

    def apply_raise(self, percent):
        """Apply percentage raise with validation."""
        if percent < 0 or percent > 100:
            print("Invalid raise percentage!")
            return
        self._salary += self._salary * (percent / 100)

# --- Demo encapsulation ---
print("=== Encapsulation Demo ===\\n")

emp = Employee("Alice", 75000, "Engineering")
print(f"Employee: {emp.get_info()}")

# Using property getter
print(f"\\nSalary via property: ₹{emp.salary:,}")

# Using property setter (with validation)
print("\\nSetting salary to ₹85,000:")
emp.salary = 85000
print(f"New salary: ₹{emp.salary:,}")

# Attempt invalid set
print("\\nAttempting invalid salary:")
try:
    emp.salary = -5000
except ValueError as e:
    print(f"  Error: {e}")

# Accessing 'private' attribute (name mangling)
print(f"\\nDirect __department access: {emp._Employee__department}")

# --- Demonstrate name mangling ---
print("\\nName mangling demonstration:")
print(f"  emp._salary: {emp._salary}")          # Works (protected)
print(f"  emp.__department: AttributeError!")     # Would fail
print(f"  emp._Employee__department: {emp._Employee__department}")  # Works

# ============================================
# 🔍 Execution Trace:
# @property creates a descriptor
# emp.salary calls the getter
# emp.salary = x calls the setter
# __department becomes _Employee__department
# This is NAME MANGLING for privacy
# ============================================

# TRY THIS: Create a Password class with encapsulation
# that stores a hashed password and only allows setting
# through a verified method.
`,
    funFact: "Python's encapsulation is 'weaker' than Java/C++ - it's more about convention than enforcement!"
  },

  // ========== NUMBER SYSTEMS (105-107) ==========
  {
    id: "ns-1",
    title: "Binary to Decimal",
    language: "python",
    category: "Number Systems",
    difficulty: "Easy",
    classLevel: "Class 11",
    description: "Convert binary numbers to decimal using Python's built-in int() function.",
    code: `# ============================================
# Binary to Decimal Conversion
# Program 105 | CBSE Class 11 - Python
# ============================================

# --- Using int() with base 2 ---
binary_str = "11010"
decimal = int(binary_str, 2)
print(f"Binary: {binary_str}")
print(f"Decimal: {decimal}")

# --- Manual conversion (understanding the math) ---
def binary_to_decimal(binary_str):
    """Convert binary string to decimal manually."""
    decimal = 0
    power = len(binary_str) - 1

    for digit in binary_str:
        decimal += int(digit) * (2 ** power)
        power -= 1

    return decimal

# Test manual conversion
test_cases = ["1010", "1111", "10000", "110011"]
print("\\nManual conversion:")
for binary in test_cases:
    result = binary_to_decimal(binary)
    print(f"  {binary} = {result}")

# --- Verify with built-in ---
print("\\nVerification:")
for binary in test_cases:
    built_in = int(binary, 2)
    manual = binary_to_decimal(binary)
    print(f"  {binary}: built-in={built_in}, manual={manual}, match={built_in==manual}")

# --- Interactive converter ---
print("\\nBinary positions explanation:")
print("  1 1 0 1 0")
print("  | | | | |")
print("  16 8 4 2 1")
print(f"  16+8+0+2+0 = {16+8+0+2+0}")

# ============================================
# 🔍 Execution Trace:
# int("11010", 2)
# 1×2⁴ + 1×2³ + 0×2² + 1×2¹ + 0×2⁰
# = 16 + 8 + 0 + 2 + 0
# = 26
# ============================================

# TRY THIS: Write a function that converts a binary
# string with a decimal point (e.g., "101.101") to decimal.
`,
    funFact: "Binary was invented by Gottfried Leibniz in 1679, but popularized by Claude Shannon!"
  },
  {
    id: "ns-2",
    title: "Decimal to Binary",
    language: "python",
    category: "Number Systems",
    difficulty: "Easy",
    classLevel: "Class 11",
    description: "Convert decimal numbers to binary using Python's bin() function and manual method.",
    code: `# ============================================
# Decimal to Binary Conversion
# Program 106 | CBSE Class 11 - Python
# ============================================

# --- Using bin() function ---
decimal = 42
binary = bin(decimal)
print(f"Decimal: {decimal}")
print(f"Binary (with prefix): {binary}")
print(f"Binary (clean): {binary[2:]}")

# --- Manual conversion using division ---
def decimal_to_binary(n):
    """Convert decimal to binary using repeated division."""
    if n == 0:
        return "0"

    binary = ""
    while n > 0:
        remainder = n % 2
        binary = str(remainder) + binary
        n = n // 2

    return binary

# Test manual conversion
test_cases = [0, 1, 10, 25, 42, 100, 255]
print("\\nManual conversion:")
for num in test_cases:
    result = decimal_to_binary(num)
    print(f"  {num} = {result}")

# --- Division trace (step by step) ---
print("\\nStep-by-step for 42:")
n = 42
steps = []
while n > 0:
    steps.append(f"  {n} ÷ 2 = {n//2} remainder {n%2}")
    n = n // 2
for step in steps:
    print(step)
print("  Read remainders bottom-up: 101010")

# --- Verify with bin() ---
print("\\nVerification:")
for num in test_cases:
    built_in = bin(num)[2:]
    manual = decimal_to_binary(num)
    print(f"  {num}: built-in={built_in}, manual={manual}, match={built_in==manual}")

# ============================================
# 🔍 Execution Trace:
# 42 ÷ 2 = 21 remainder 0
# 21 ÷ 2 = 10 remainder 1
# 10 ÷ 2 = 5  remainder 0
# 5  ÷ 2 = 2  remainder 1
# 2  ÷ 2 = 1  remainder 0
# 1  ÷ 2 = 0  remainder 1
# Read bottom-up: 101010
# ============================================

# TRY THIS: Write a function that converts decimal
# to binary with a fixed width (e.g., 8-bit: "00101010").
`,
    funFact: "The bin() function returns a string prefixed with '0b' to indicate it's a binary literal!"
  },
  {
    id: "ns-3",
    title: "Hex and Octal",
    language: "python",
    category: "Number Systems",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Convert between decimal, hexadecimal, and octal using hex() and oct() functions.",
    code: `# ============================================
# Hex and Octal - Base Conversions
# Program 107 | CBSE Class 11 - Python
# ============================================

# --- Hexadecimal conversion ---
decimal = 255
hex_value = hex(decimal)
print(f"Decimal: {decimal}")
print(f"Hexadecimal: {hex_value}")
print(f"Hex (clean): {hex_value[2:].upper()}")

# --- Octal conversion ---
oct_value = oct(decimal)
print(f"Octal: {oct_value}")
print(f"Octal (clean): {oct_value[2:]}")

# --- Converting from hex/octal back to decimal ---
hex_str = "FF"
decimal_from_hex = int(hex_str, 16)
print(f"\\n'{hex_str}' (hex) = {decimal_from_hex} (decimal)")

oct_str = "377"
decimal_from_oct = int(oct_str, 8)
print(f"'{oct_str}' (octal) = {decimal_from_oct} (decimal)")

# --- Manual hex conversion ---
def decimal_to_hex(n):
    """Convert decimal to hexadecimal manually."""
    if n == 0:
        return "0"
    hex_chars = "0123456789ABCDEF"
    result = ""
    while n > 0:
        remainder = n % 16
        result = hex_chars[remainder] + result
        n = n // 16
    return result

# --- Manual octal conversion ---
def decimal_to_octal(n):
    """Convert decimal to octal manually."""
    if n == 0:
        return "0"
    result = ""
    while n > 0:
        result = str(n % 8) + result
        n = n // 8
    return result

# --- Comparison table ---
print("\\nConversion table for 255:")
print(f"  Decimal:  255")
print(f"  Binary:   {bin(255)[2:]}")
print(f"  Octal:    {oct(255)[2:]}")
print(f"  Hex:      {hex(255)[2:].upper()}")

# Verify manual functions
print("\\nVerification:")
test_values = [10, 16, 255, 1024, 4096]
for num in test_values:
    h = decimal_to_hex(num)
    o = decimal_to_octal(num)
    print(f"  {num}: hex={h}, octal={o}")

# ============================================
# 🔍 Execution Trace:
# hex(255) → 0xFF (16×15 + 15 = 255)
# oct(255) → 0o377 (3×64 + 7×8 + 7 = 255)
# int("FF", 16) → 255
# int("377", 8) → 255
# ============================================

# TRY THIS: Create a function that takes a number and
# returns a formatted string showing all 4 bases at once.
`,
    funFact: "Hexadecimal is used in web colors (#FF0000 = red) and memory addresses!"
  },

  // ========== MODULES & PROJECTS (108-110) ==========
  {
    id: "mp-10",
    title: "Math Module Advanced",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Explore advanced math module functions: factorial, comb, perm, and more.",
    code: `# ============================================
# Math Module Advanced - factorial, comb, perm
# Program 108 | CBSE Class 11 - Python
# ============================================

import math

# --- Factorial ---
print("=== Factorial ===")
print(f"math.factorial(5) = {math.factorial(5)}")
print(f"math.factorial(10) = {math.factorial(10)}")

# Factorial in loop
print("\\nFactorials 1-10:")
for i in range(1, 11):
    print(f"  {i}! = {math.factorial(i)}")

# --- Combinations (nCr) ---
print("\\n=== Combinations ===")
print("Choosing 3 from 5:")
print(f"  math.comb(5, 3) = {math.comb(5, 3)}")
print(f"  Formula: 5!/(3!×2!) = {math.factorial(5)//(math.factorial(3)*math.factorial(2))}")

# Practical example: How many ways to choose 2 from 4?
print(f"\\nChoosing 2 from 4: {math.comb(4, 2)}")

# --- Permutations (nPr) ---
print("\\n=== Permutations ===")
print("Arranging 3 from 5:")
print(f"  math.perm(5, 3) = {math.perm(5, 3)}")
print(f"  Formula: 5!/(5-3)! = {math.factorial(5)//math.factorial(2)}")

# --- GCD and LCM ---
print("\\n=== GCD and LCM ===")
print(f"math.gcd(12, 8) = {math.gcd(12, 8)}")
print(f"math.lcm(4, 6) = {math.lcm(4, 6)}")

# --- Square root and power ---
print("\\n=== Other Functions ===")
print(f"math.sqrt(144) = {math.sqrt(144)}")
print(f"math.pow(2, 10) = {math.pow(2, 10)}")
print(f"math.log(100, 10) = {math.log(100, 10)}")
print(f"math.ceil(4.3) = {math.ceil(4.3)}")
print(f"math.floor(4.7) = {math.floor(4.7)}")

# --- Constants ---
print("\\n=== Constants ===")
print(f"math.pi = {math.pi}")
print(f"math.e = {math.e}")
print(f"math.tau = {math.tau}")

# --- Practical: Probability calculation ---
print("\\n=== Practical: Lottery Probability ===")
total = 49
chosen = 6
ways = math.comb(total, chosen)
print(f"Choosing {chosen} from {total}: {ways} combinations")
print(f"Probability of winning: 1 in {ways}")

# ============================================
# 🔍 Execution Trace:
# math.factorial(5) = 5 × 4 × 3 × 2 × 1 = 120
# math.comb(5,3) = 5!/(3!×2!) = 10
# math.perm(5,3) = 5!/(5-3)! = 60
# ============================================

# TRY THIS: Write a program that calculates the
# number of ways to form a committee of 4 from
# 10 people, where 2 must be from group A and 2 from group B.
`,
    funFact: "Python 3.8 added math.comb() and math.perm() - before that you had to calculate them manually!"
  },
  {
    id: "mp-11",
    title: "OS Module Files",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Use the os module to navigate, create, and manage files and directories.",
    code: `# ============================================
# OS Module Files - Directory Operations
# Program 109 | CBSE Class 11 - Python
# ============================================

import os

# --- Basic operations ---
print("=== Basic OS Operations ===")
print(f"Current directory: {os.getcwd()}")
print(f"Home directory: {os.path.expanduser('~')}")

# --- Check and create directories ---
print("\\n=== Directory Management ===")
test_dir = "test_directory"
test_subdir = os.path.join(test_dir, "subdir1", "subdir2")

if not os.path.exists(test_dir):
    os.makedirs(test_subdir)
    print(f"Created: {test_subdir}")
else:
    print(f"Directory already exists: {test_dir}")

# --- List directory contents ---
print(f"\\nContents of '{test_dir}':")
for item in os.listdir(test_dir):
    full_path = os.path.join(test_dir, item)
    item_type = "DIR" if os.path.isdir(full_path) else "FILE"
    print(f"  [{item_type}] {item}")

# --- Path operations ---
print("\\n=== Path Operations ===")
file_path = os.path.join(test_dir, "test_file.txt")
print(f"Full path: {file_path}")
print(f"Directory: {os.path.dirname(file_path)}")
print(f"Filename: {os.path.basename(file_path)}")
print(f"Name without ext: {os.path.splitext(os.path.basename(file_path))[0]}")

# --- Create a test file ---
with open(file_path, 'w') as f:
    f.write("Hello from OS module demo!")

print(f"\\nFile exists: {os.path.exists(file_path)}")
print(f"File size: {os.path.getsize(file_path)} bytes")

# --- Walk through directory tree ---
print("\\n=== Directory Walk ===")
for root, dirs, files in os.walk(test_dir):
    level = root.replace(test_dir, '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for file in files:
        print(f"{subindent}{file}")

# --- Cleanup ---
import shutil
if os.path.exists(test_dir):
    shutil.rmtree(test_dir)
    print(f"\\nCleaned up: {test_dir}")

# ============================================
# 🔍 Execution Trace:
# os.makedirs creates nested directories
# os.walk recursively traverses directory tree
# os.path handles cross-platform path operations
# shutil.rmtree removes entire directory trees
# ============================================

# TRY THIS: Write a program that finds all .txt files
# in a given directory and reports their total size.
`,
    funFact: "The os module works on Windows, Mac, and Linux by handling path differences automatically!"
  },
  {
    id: "mp-12",
    title: "Turtle Advanced Patterns",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Medium",
    classLevel: "Class 11",
    description: "Create advanced geometric patterns using Python's turtle graphics module.",
    code: `# ============================================
# Turtle Advanced Patterns - Graphics Art
# Program 110 | CBSE Class 11 - Python
# ============================================

import turtle
import math

# --- Setup screen ---
screen = turtle.Screen()
screen.title("Advanced Turtle Patterns")
screen.bgcolor("black")

t = turtle.Turtle()
t.speed(0)  # Fastest speed
t.width(2)

# --- Color palette ---
colors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"]

# --- Pattern 1: Spiral square ---
def draw_spiral_square(size, turns):
    """Draw a spiral square pattern."""
    for i in range(turns):
        t.forward(size + i * 5)
        t.right(91)

t.color("cyan")
t.penup()
t.goto(-200, 100)
t.pendown()
draw_spiral_square(10, 50)

# --- Pattern 2: Flower pattern ---
def draw_flower(petals, radius):
    """Draw a flower with given petals."""
    angle = 360 / petals
    for _ in range(petals):
        t.circle(radius, 60)
        t.left(angle)

t.color("magenta")
t.penup()
t.goto(0, 100)
t.pendown()
draw_flower(12, 50)

# --- Pattern 3: Star pattern ---
def draw_star(points, size):
    """Draw a multi-pointed star."""
    angle = 180 / points
    for _ in range(points * 2):
        t.forward(size)
        t.right(angle)

t.color("yellow")
t.penup()
t.goto(200, 100)
t.pendown()
draw_star(5, 80)

# --- Pattern 4: Concentric circles ---
def draw_concentric(n, max_radius):
    """Draw concentric circles."""
    for i in range(1, n + 1):
        radius = max_radius * i / n
        t.circle(radius)

t.color("green")
t.penup()
t.goto(-200, -150)
t.pendown()
draw_concentric(8, 100)

# --- Pattern 5: Rainbow spiral ---
def draw_rainbow_spiral():
    """Draw a colorful spiral."""
    for i in range(100):
        t.pencolor(colors[i % len(colors)])
        t.forward(i * 2)
        t.right(91)

t.penup()
t.goto(200, -150)
t.pendown()
draw_rainbow_spiral()

# --- Hide turtle and display ---
t.hideturtle()
screen.mainloop()

# ============================================
# 🔍 Execution Trace:
# t.speed(0) = fastest drawing
# t.circle(r) draws circle with radius r
# t.right(angle) turns turtle right
# Loops create repetitive geometric patterns
# ============================================

# TRY THIS: Modify the program to draw a mandala
# pattern using nested loops and color gradients.
`,
    funFact: "Turtle graphics was invented in the 1960s for teaching programming to children!"
  },

  // ========== MODULES & PROJECTS - CAPSTONE (111-112) ==========
  {
    id: "mp-13",
    title: "Library Management",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Build a complete library management system using OOP and file handling.",
    code: `# ============================================
# Library Management System - OOP + File
# Program 111 | CBSE Class 11 - Python
# ============================================

import json
import os
from datetime import datetime, timedelta

class Book:
    """Represents a single book."""
    def __init__(self, title, author, book_id, copies=1):
        self.title = title
        self.author = author
        self.book_id = book_id
        self.copies = copies
        self.available = copies

    def to_dict(self):
        return {
            "title": self.title,
            "author": self.author,
            "book_id": self.book_id,
            "copies": self.copies,
            "available": self.available
        }

    def __str__(self):
        return f"[{self.book_id}] {self.title} by {self.author} ({self.available}/{self.copies})"

class Library:
    """Library management system."""
    DATA_FILE = "library_data.json"

    def __init__(self):
        self.books = []
        self.load_data()

    def load_data(self):
        """Load library data from file."""
        if os.path.exists(self.DATA_FILE):
            try:
                with open(self.DATA_FILE, 'r') as f:
                    data = json.load(f)
                    for book_data in data.get("books", []):
                        book = Book(**book_data)
                        self.books.append(book)
                print(f"Loaded {len(self.books)} books from file.")
            except Exception as e:
                print(f"Error loading data: {e}")

    def save_data(self):
        """Save library data to file."""
        data = {"books": [book.to_dict() for book in self.books]}
        with open(self.DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def add_book(self, title, author, book_id, copies=1):
        """Add a new book to the library."""
        for book in self.books:
            if book.book_id == book_id:
                book.copies += copies
                book.available += copies
                print(f"Updated copies for '{title}'")
                self.save_data()
                return
        new_book = Book(title, author, book_id, copies)
        self.books.append(new_book)
        print(f"Added: {new_book}")
        self.save_data()

    def search(self, query):
        """Search books by title or author."""
        results = []
        query_lower = query.lower()
        for book in self.books:
            if query_lower in book.title.lower() or query_lower in book.author.lower():
                results.append(book)
        return results

    def display_all(self):
        """Display all books."""
        print("\\n=== Library Catalog ===")
        if not self.books:
            print("No books in library.")
            return
        for book in self.books:
            print(f"  {book}")

    def get_stats(self):
        """Get library statistics."""
        total_books = sum(b.copies for b in self.books)
        available = sum(b.available for b in self.books)
        return {
            "total_titles": len(self.books),
            "total_copies": total_books,
            "available": available,
            "issued": total_books - available
        }

# --- Demo the Library system ---
print("=== Library Management System ===\\n")

library = Library()

# Add books
library.add_book("Python Programming", "John Smith", "B001", 3)
library.add_book("Data Structures", "Jane Doe", "B002", 2)
library.add_book("Algorithms", "John Smith", "B003", 2)
library.add_book("Web Development", "Alice Brown", "B004", 1)

# Display all
library.display_all()

# Search
print("\\n=== Search Results ===")
results = library.search("python")
for book in results:
    print(f"  Found: {book}")

# Statistics
stats = library.get_stats()
print(f"\\n=== Statistics ===")
print(f"  Total titles: {stats['total_titles']}")
print(f"  Total copies: {stats['total_copies']}")
print(f"  Available: {stats['available']}")
print(f"  Issued: {stats['issued']}")

# ============================================
# 🔍 Execution Trace:
# Library uses JSON file for persistence
# Book class encapsulates book data
# Library manages collection of Books
# save_data() persists after each change
# ============================================

# TRY THIS: Add a checkout and return system with
# due dates and late fee calculation.
`,
    funFact: "The world's largest library, the Library of Congress, has over 170 million items!"
  },
  {
    id: "mp-14",
    title: "Contact Book",
    language: "python",
    category: "Modules & Projects",
    difficulty: "Hard",
    classLevel: "Class 11",
    description: "Build a complete contact book application with OOP, file storage, and search functionality.",
    code: `# ============================================
# Contact Book - OOP + File + Search
# Program 112 | CBSE Class 11 - Python
# ============================================

import json
import os
from datetime import datetime

class Contact:
    """Represents a single contact."""
    def __init__(self, name, phone, email="", category="General"):
        self.name = name
        self.phone = phone
        self.email = email
        self.category = category
        self.created = datetime.now().strftime("%Y-%m-%d")

    def to_dict(self):
        return {
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "category": self.category,
            "created": self.created
        }

    def __str__(self):
        return f"{self.name} | {self.phone} | {self.email or 'No email'}"

class ContactBook:
    """Contact management system."""
    DATA_FILE = "contacts.json"

    def __init__(self):
        self.contacts = []
        self.load_data()

    def load_data(self):
        """Load contacts from file."""
        if os.path.exists(self.DATA_FILE):
            try:
                with open(self.DATA_FILE, 'r') as f:
                    data = json.load(f)
                    for c in data.get("contacts", []):
                        contact = Contact(**c)
                        self.contacts.append(contact)
                print(f"Loaded {len(self.contacts)} contacts.")
            except Exception as e:
                print(f"Error: {e}")

    def save_data(self):
        """Save contacts to file."""
        data = {"contacts": [c.to_dict() for c in self.contacts]}
        with open(self.DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def add_contact(self, name, phone, email="", category="General"):
        """Add a new contact."""
        contact = Contact(name, phone, email, category)
        self.contacts.append(contact)
        self.save_data()
        print(f"Added: {contact}")

    def search(self, query):
        """Search contacts by name, phone, or email."""
        results = []
        query_lower = query.lower()
        for c in self.contacts:
            if (query_lower in c.name.lower() or
                query_lower in c.phone or
                query_lower in c.email.lower()):
                results.append(c)
        return results

    def delete_contact(self, name):
        """Delete a contact by name."""
        for i, c in enumerate(self.contacts):
            if c.name.lower() == name.lower():
                removed = self.contacts.pop(i)
                self.save_data()
                print(f"Deleted: {removed}")
                return True
        print(f"Contact '{name}' not found.")
        return False

    def display_all(self):
        """Display all contacts."""
        print("\\n=== Contact Book ===")
        if not self.contacts:
            print("No contacts found.")
            return
        for contact in sorted(self.contacts, key=lambda c: c.name):
            print(f"  {contact}")

    def display_by_category(self):
        """Group contacts by category."""
        categories = {}
        for c in self.contacts:
            if c.category not in categories:
                categories[c.category] = []
            categories[c.category].append(c)

        print("\\n=== Contacts by Category ===")
        for cat, contacts in sorted(categories.items()):
            print(f"\\n  {cat}:")
            for c in sorted(contacts, key=lambda x: x.name):
                print(f"    {c}")

    def get_stats(self):
        """Get contact statistics."""
        return {
            "total": len(self.contacts),
            "with_email": sum(1 for c in self.contacts if c.email),
            "categories": len(set(c.category for c in self.contacts))
        }

# --- Demo Contact Book ---
print("=== Contact Book Application ===\\n")

book = ContactBook()

# Add contacts
book.add_contact("Alice Johnson", "9876543210", "alice@email.com", "Friends")
book.add_contact("Bob Smith", "9123456789", "bob@work.com", "Work")
book.add_contact("Charlie Brown", "9988776655", "", "Friends")
book.add_contact("Diana Prince", "9112233445", "diana@email.com", "Family")
book.add_contact("Eve Wilson", "9554433221", "eve@work.com", "Work")

# Display all
book.display_all()

# Search
print("\\n=== Search 'alice' ===")
results = book.search("alice")
for c in results:
    print(f"  {c}")

print("\\n=== Search 'work' ===")
results = book.search("work")
for c in results:
    print(f"  {c}")

# By category
book.display_by_category()

# Statistics
stats = book.get_stats()
print(f"\\n=== Statistics ===")
print(f"  Total contacts: {stats['total']}")
print(f"  With email: {stats['with_email']}")
print(f"  Categories: {stats['categories']}")

# Delete
print("\\n=== Delete 'Charlie Brown' ===")
book.delete_contact("Charlie Brown")
book.display_all()

# ============================================
# 🔍 Execution Trace:
# ContactBook manages list of Contact objects
# search() checks name, phone, and email
# save_data() persists to JSON after changes
# display_by_category() groups and sorts contacts
# ============================================

# TRY THIS: Add an edit function to modify existing
# contacts, and add birthday field with reminder feature.
`,
    funFact: "The first electronic contact manager was created in 1980 on early personal computers!"
  }]
