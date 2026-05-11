export const foundationTerms = [
  {
    num: "1",
    title: "Character Set",
    meaning: "The collection of all letters, digits, and symbols a programming language can use.",
    example: "A-Z a-z 0-9 + - * / @ # _",
  },
  {
    num: "2",
    title: "Tokens",
    meaning: "The smallest building blocks of a program.",
    example: "In x = 5 + 3, tokens are: x, =, 5, +, 3",
  },
  {
    num: "3",
    title: "Literals",
    meaning: "Fixed values that never change.",
    example: '10, "Hello", 3.14',
  },
  {
    num: "4",
    title: "Variables",
    meaning: "A container that stores values and can change.",
    example: 'bag = "Books"',
  },
  {
    num: "5",
    title: "Constants",
    meaning: "Values that never change during a program.",
    example: "PI = 3.14",
  },
  {
    num: "6",
    title: "Keywords",
    meaning: "Special reserved words with fixed meaning.",
    example: "if, else, for, while, True, False",
  },
  {
    num: "7",
    title: "Identifiers",
    meaning: "Names you give to variables, functions, etc.",
    example: 'student_name = "Aman"',
  },
  {
    num: "8",
    title: "Data Types",
    meaning: "Kinds of data a variable can store.",
    example: "age = 15 (int), price = 10.5 (float)",
  },
  {
    num: "9",
    title: "Operators",
    meaning: "Symbols that perform actions.",
    example: "5 + 3, a > b, x == y",
  },
  {
    num: "10",
    title: "Expressions",
    meaning: "A combination of variables, literals, and operators that produces a value.",
    example: "(5 + 3) * 2",
  },
  {
    num: "11",
    title: "Statements",
    meaning: "A complete instruction.",
    example: 'print("Hello")',
  },
  {
    num: "12",
    title: "Input & Output",
    meaning: "Input: giving information to computer. Output: computer giving answer back.",
    example: 'name = input("Enter your name: ")',
  },
  {
    num: "13",
    title: "Debugging",
    meaning: "Finding and fixing errors in your program.",
    example: 'Fixed: print("Hello")',
  },
  {
    num: "14",
    title: "Compiler / Interpreter",
    meaning: "Tools that convert your code into machine language.",
    example: "Python uses an interpreter which reads code line by line.",
  },
  {
    num: "15",
    title: "Algorithm",
    meaning: "A step-by-step solution to a problem.",
    example: "1. Take input 2. Add numbers 3. Print result",
  },
  {
    num: "16",
    title: "Flowchart",
    meaning: "A diagram that shows algorithm steps using symbols.",
    example: "Oval: Start/Stop, Rectangle: Process, Diamond: Decision",
  },
];

export const foundationPreviewTopics = [
  {
    title: "Data Types",
    desc: "Understand int, float, str, bool, list, dict, and tuple with clear beginner examples.",
  },
  {
    title: "Operators",
    desc: "Learn arithmetic, comparison, logical, and assignment operators used in Python programs.",
  },
  {
    title: "Control Flow",
    desc: "Practice if/else statements, loops, and decision-making patterns in simple code.",
  },
  {
    title: "Functions",
    desc: "See how to define reusable blocks, pass arguments, and return results from functions.",
  },
];

export const foundationPrograms = [
  {
    title: "Program to Add Two Numbers",
    description: "Take two numbers as input and display their sum.",
    code: `a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
print("Sum =", a + b)`,
    output: "Sum = 15",
  },
  {
    title: "Program to Find Area of a Rectangle",
    description: "Calculate area using length and breadth entered by the user.",
    code: `length = float(input("Enter length: "))
breadth = float(input("Enter breadth: "))
area = length * breadth
print("Area of rectangle =", area)`,
    output: "Area of rectangle = 24.0",
  },
  {
    title: "Program to Check Even or Odd",
    description: "Use the modulus operator to test whether a number is even or odd.",
    code: `num = int(input("Enter a number: "))
if num % 2 == 0:
    print("Even number")
else:
    print("Odd number")`,
    output: "Even number",
  },
  {
    title: "Program to Find Largest of Two Numbers",
    description: "Compare two values and print the larger one.",
    code: `a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
if a > b:
    print("Largest =", a)
else:
    print("Largest =", b)`,
    output: "Largest = 18",
  },
  {
    title: "Program to Check if Person Can Vote",
    description: "Use a condition to decide whether a person is eligible to vote.",
    code: `age = int(input("Enter your age: "))
if age >= 18:
    print("You are eligible to vote.")
else:
    print("You are not eligible to vote yet.")`,
    output: "You are eligible to vote.",
  },
  {
    title: "Program to Display Multiplication Table",
    description: "Generate a multiplication table using a for loop.",
    code: `num = int(input("Enter a number: "))
for i in range(1, 11):
    print(num, "x", i, "=", num*i)`,
    output: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50",
  },
  {
    title: "Program to Calculate Simple Interest",
    description: "Apply the simple interest formula using principal, rate, and time.",
    code: `p = float(input("Enter Principal: "))
r = float(input("Enter Rate: "))
t = float(input("Enter Time: "))
si = (p * r * t) / 100
print("Simple Interest =", si)`,
    output: "Simple Interest = 400.0",
  },
  {
    title: "Program to Find Square and Cube",
    description: "Display the square and cube of a given number.",
    code: `num = int(input("Enter a number: "))
print("Square =", num**2)
print("Cube =", num**3)`,
    output: "Square = 16\nCube = 64",
  },
  {
    title: "Program to Count Vowels in a String",
    description: "Scan each character in a string and count how many vowels appear.",
    code: `text = input("Enter a string: ")
count = 0

for ch in text.lower():
    if ch in "aeiou":
        count += 1

print("Number of vowels =", count)`,
    output: "Number of vowels = 4",
  },
  {
    title: "Program to Find Sum of First N Natural Numbers",
    description: "Use the direct formula to find the sum of the first N natural numbers.",
    code: `n = int(input("Enter a number: "))
sum_n = n * (n + 1) // 2
print("Sum of first", n, "natural numbers =", sum_n)`,
    output: "Sum of first 10 natural numbers = 55",
  },
];
