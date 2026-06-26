export type WebCategory =
  | "HTML Basics"
  | "HTML Tables"
  | "HTML Forms"
  | "Inline CSS"
  | "Internal CSS"
  | "External CSS"
  | "JS Basics"
  | "JS DOM"
  | "JS Events"

export type Difficulty = "Easy" | "Medium" | "Hard"

export interface WebProgram {
  id: string
  title: string
  category: WebCategory
  difficulty: Difficulty
  description: string
  htmlCode: string
  cssCode: string
  jsCode: string
}

export const webCategoryColors: Record<WebCategory, { bg: string; text: string }> = {
  "HTML Basics": { bg: "bg-orange-50", text: "text-orange-700" },
  "HTML Tables": { bg: "bg-amber-50", text: "text-amber-700" },
  "HTML Forms": { bg: "bg-yellow-50", text: "text-yellow-700" },
  "Inline CSS": { bg: "bg-sky-50", text: "text-sky-700" },
  "Internal CSS": { bg: "bg-blue-50", text: "text-blue-700" },
  "External CSS": { bg: "bg-indigo-50", text: "text-indigo-700" },
  "JS Basics": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "JS DOM": { bg: "bg-teal-50", text: "text-teal-700" },
  "JS Events": { bg: "bg-green-50", text: "text-green-700" },
}

export const webDifficultyColors: Record<Difficulty, { bg: string; text: string }> = {
  Easy: { bg: "bg-green-50", text: "text-green-700" },
  Medium: { bg: "bg-yellow-50", text: "text-yellow-700" },
  Hard: { bg: "bg-red-50", text: "text-red-700" },
}

export const webCategories: WebCategory[] = [
  "HTML Basics",
  "HTML Tables",
  "HTML Forms",
  "Inline CSS",
  "Internal CSS",
  "External CSS",
  "JS Basics",
  "JS DOM",
  "JS Events",
]

export const webPrograms: WebProgram[] = [
  // ===================== HTML BASICS (10 programs) =====================
  {
    id: "html-1",
    title: "Hello World HTML",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "Basic HTML page with heading and paragraph",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is my first HTML page.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-2",
    title: "Headings & Paragraphs",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "All 6 heading levels and paragraph with formatting tags",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Headings and Paragraphs</title>
</head>
<body>
  <h1>Heading 1 - Main Title</h1>
  <h2>Heading 2 - Section Title</h2>
  <h3>Heading 3 - Sub-section</h3>
  <h4>Heading 4 - Minor Heading</h4>
  <h5>Heading 5 - Small Heading</h5>
  <h6>Heading 6 - Smallest Heading</h6>

  <p>This is a <strong>normal paragraph</strong> with some <em>italic text</em>.</p>
  <p>You can use <strong>&lt;strong&gt;</strong> for bold and <em>&lt;em&gt;</em> for emphasis.</p>
  <p>Line breaks can be added using <br> the br tag.<br>This is a new line after the break.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-3",
    title: "Lists Program",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "Ordered list, unordered list, and nested list example",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lists in HTML</title>
</head>
<body>
  <h2>Unordered List (Bullet Points)</h2>
  <ul>
    <li>HTML</li>
    <li>CSS</li>
    <li>JavaScript</li>
  </ul>

  <h2>Ordered List (Numbered)</h2>
  <ol>
    <li>Learn HTML Tags</li>
    <li>Practice CSS Styling</li>
    <li>Build Projects</li>
  </ol>

  <h2>Nested List</h2>
  <ul>
    <li>Fruits
      <ul>
        <li>Apple</li>
        <li>Banana</li>
        <li>Mango</li>
      </ul>
    </li>
    <li>Vegetables
      <ol>
        <li>Potato</li>
        <li>Tomato</li>
        <li>Onion</li>
      </ol>
    </li>
  </ul>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-4",
    title: "Links & Images",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "Hyperlinks with target attribute, anchor links, and img tag",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Links and Images</title>
</head>
<body>
  <h2>Hyperlinks</h2>
  <a href="https://www.google.com">Visit Google</a><br>
  <a href="https://www.google.com" target="_blank">Open Google in New Tab</a><br>

  <h2>Anchor Link (Page Jump)</h2>
  <a href="#section2">Go to Section 2</a>

  <h2>Images</h2>
  <img src="https://via.placeholder.com/200x150" alt="Sample Image" width="200" height="150">

  <br><br>
  <div id="section2" style="border:2px solid blue; padding:10px;">
    <h3>Section 2 - Anchor Link Target</h3>
    <p>This section is linked from above using the id attribute.</p>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-5",
    title: "Text Formatting Tags",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "All text formatting tags including subscript and superscript",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Text Formatting Tags</title>
</head>
<body>
  <h2>HTML Text Formatting Tags</h2>
  <p><b>Bold Text</b> using &lt;b&gt; tag</p>
  <p><i>Italic Text</i> using &lt;i&gt; tag</p>
  <p><u>Underlined Text</u> using &lt;u&gt; tag</p>
  <p><s>Strikethrough Text</s> using &lt;s&gt; tag</p>
  <p><strong>Strong Text</strong> using &lt;strong&gt; tag</p>
  <p><em>Emphasized Text</em> using &lt;em&gt; tag</p>
  <p><mark>Highlighted Text</mark> using &lt;mark&gt; tag</p>
  <p><small>Small Text</small> using &lt;small&gt; tag</p>

  <h2>Superscript and Subscript (Exam Important)</h2>
  <p>Water Formula: H<sub>2</sub>O (subscript for 2)</p>
  <p>Square: x<sup>2</sup> (superscript for 2)</p>
  <p>Cube: a<sup>3</sup> (superscript for 3)</p>
  <p>Chemical: CO<sub>2</sub> (subscript for 2)</p>
  <p>Math: E = mc<sup>2</sup></p>
  <p>10<sup>th</sup> Class (superscript for ordinal)</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-6",
    title: "HTML Comments",
    category: "HTML Basics",
    difficulty: "Easy",
    description: "Single line and multi-line comments in HTML using <!-- --> syntax",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Comments</title>
</head>
<body>
  <!-- This is a single line comment -->
  <h1>HTML Comments Demo</h1>

  <!-- 
    This is a multi-line comment.
    Comments are not displayed in the browser.
    They are used to explain the code.
    Useful for debugging and documentation.
  -->

  <p>This paragraph is visible.</p>

  <!-- 
    <p>This paragraph is commented out and won't show.</p>
    <p>This is also hidden.</p>
  -->

  <p>Comments start with &lt;!-- and end with --&gt;</p>
  <!-- Tip: Use comments to leave notes for other developers -->
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-7",
    title: "Block & Inline Elements",
    category: "HTML Basics",
    difficulty: "Medium",
    description: "Demonstrate block vs inline elements with explanations",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Block and Inline Elements</title>
</head>
<body>
  <h2>Block Elements (Take full width)</h2>
  <div style="background:lightblue; padding:10px; margin:5px 0;">
    This is a DIV (block element). It takes full width.
  </div>
  <p style="background:lightgreen; padding:10px; margin:5px 0;">
    This is a P (block element). It also takes full width.
  </p>
  <h3 style="background:lightyellow; padding:5px;">
    This is an H3 (block element)
  </h3>

  <h2>Inline Elements (Take only needed width)</h2>
  <div style="background:lightblue; padding:10px;">
    Inside a DIV: <span style="background:red; color:white; padding:5px;">SPAN 1</span>
    <span style="background:green; color:white; padding:5px;">SPAN 2</span>
    <a href="#" style="background:orange; padding:5px;">LINK</a>
  </div>

  <h2>Key Differences</h2>
  <ul>
    <li>Block: div, p, h1-h6, ul, ol, li, form, table</li>
    <li>Inline: span, a, strong, em, img, sub, sup</li>
  </ul>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-8",
    title: "HTML Entities",
    category: "HTML Basics",
    difficulty: "Medium",
    description: "Special character entities in HTML",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Entities</title>
</head>
<body>
  <h2>HTML Character Entities</h2>
  <p>&lt; Less Than: &lt;div&gt;</p>
  <p>&gt; Greater Than: &gt;div&lt;</p>
  <p>&amp; Ampersand: A &amp; B</p>
  <p>&quot; Quotation Mark: &quot;Hello&quot;</p>
  <p>&nbsp; Non-Breaking Space: Hello&nbsp;&nbsp;&nbsp;&nbsp;World</p>
  <p>&copy; Copyright: &copy; 2024</p>
  <p>&reg; Registered: &reg;</p>
  <p>&trade; Trademark: &trade;</p>
  <p>&euro; Euro: &euro;100</p>
  <p>&pound; Pound: &pound;50</p>
  <p>&mdash; Em Dash: Hello&mdash;World</p>
  <p>&ndash; En Dash: 2020&ndash;2024</p>
  <p>&hellip; Ellipsis: Wait for it&hellip;</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-9",
    title: "Audio & Video Tags",
    category: "HTML Basics",
    difficulty: "Medium",
    description: "Audio and video elements with controls",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Audio and Video Tags</title>
</head>
<body>
  <h2>Audio Tag</h2>
  <audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>

  <h2>Video Tag</h2>
  <video controls width="400">
    <source src="video.mp4" type="video/mp4">
    Your browser does not support the video element.
  </video>

  <h2>Attributes Used</h2>
  <ul>
    <li><strong>controls</strong> - Shows play/pause/volume buttons</li>
    <li><strong>autoplay</strong> - Plays automatically (not recommended)</li>
    <li><strong>loop</strong> - Replays the media</li>
    <li><strong>muted</strong> - Starts with sound off</li>
    <li><strong>poster</strong> (video) - Preview image before play</li>
  </ul>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-10",
    title: "Semantic HTML Tags",
    category: "HTML Basics",
    difficulty: "Medium",
    description: "Semantic HTML5 tags for better page structure",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Semantic HTML Tags</title>
</head>
<body>
  <header>
    <h1>My Website</h1>
    <nav>
      <a href="#home">Home</a> |
      <a href="#about">About</a> |
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <section id="about">
      <h2>About Us</h2>
      <p>This section uses the section tag.</p>
    </section>

    <article>
      <h2>Blog Post</h2>
      <p>Articles contain self-contained content like blog posts.</p>
    </article>

    <aside>
      <h3>Related Links</h3>
      <p>The aside tag is for sidebar content.</p>
    </aside>
  </main>

  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "html-11",
    title: "Complete Webpage with HTML5",
    category: "HTML Basics",
    difficulty: "Hard",
    description: "Build a full webpage using all HTML5 semantic tags and attributes.",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="My School Website - Python Arena">
  <meta name="author" content="Doon Scholars">
  <title>Python Arena - School Website</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

    /* Header */
    header { background: #1e293b; color: white; padding: 20px 40px; }
    header h1 { font-size: 24px; }
    header p { color: #94a3b8; font-size: 14px; }

    /* Navigation */
    nav { background: #334155; padding: 12px 40px; }
    nav a { color: white; text-decoration: none; margin-right: 20px; font-size: 15px; }
    nav a:hover { color: #60a5fa; text-decoration: underline; }
    nav a[aria-current="page"] { color: #60a5fa; font-weight: bold; }

    /* Main Content */
    .container { display: flex; gap: 20px; padding: 20px 40px; max-width: 1200px; margin: 0 auto; }
    main { flex: 1; }
    aside { width: 280px; background: #f1f5f9; padding: 20px; border-radius: 8px; height: fit-content; }

    /* Section */
    section { margin-bottom: 30px; }
    section h2 { color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 15px; }

    /* Article */
    article { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
    article h3 { color: #2563eb; margin-bottom: 8px; }
    article time { color: #64748b; font-size: 13px; }
    article figure { margin: 10px 0; }
    article figcaption { color: #64748b; font-size: 13px; text-align: center; }

    /* Details */
    details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
    details summary { cursor: pointer; font-weight: bold; color: #2563eb; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #2563eb; color: white; padding: 10px; }
    td { padding: 10px; border: 1px solid #e2e8f0; text-align: center; }
    tr:nth-child(even) { background: #f8fafc; }

    /* Footer */
    footer { background: #1e293b; color: #94a3b8; text-align: center; padding: 20px; margin-top: 30px; }
    footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>

  <!-- ========== HEADER ========== -->
  <header>
    <h1>Python Arena</h1>
    <p>Learn Python, HTML, CSS & JavaScript</p>
  </header>

  <!-- ========== NAVIGATION ========== -->
  <nav aria-label="Main Navigation">
    <a href="#home" aria-current="page">Home</a>
    <a href="#courses">Courses</a>
    <a href="#results">Results</a>
    <a href="#faq">FAQ</a>
    <a href="#contact">Contact</a>
  </nav>

  <div class="container">

    <!-- ========== MAIN CONTENT ========== -->
    <main>

      <!-- Welcome Section -->
      <section id="home">
        <h2>Welcome to Python Arena</h2>
        <p>
          This webpage demonstrates <strong>HTML5 semantic tags</strong> and attributes
          including <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>,
          <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>,
          <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>,
          <code>&lt;footer&gt;</code>, <code>&lt;figure&gt;</code>,
          <code>&lt;details&gt;</code>, and more.
        </p>
      </section>

      <!-- Courses Article -->
      <section id="courses">
        <h2>Our Courses</h2>

        <article>
          <h3>Python Programming</h3>
          <p>Learn Python from basics to advanced topics.</p>
          <time datetime="2025-01-15">January 15, 2025</time>
          <figure>
            <img src="https://via.placeholder.com/600x200" alt="Python Course Banner" width="100%">
            <figcaption>Python Programming Course</figcaption>
          </figure>
          <p>Topics covered: Variables, Loops, Functions, Lists, Tuples, Dictionary, File Handling.</p>
        </article>

        <article>
          <h3>Web Development (HTML, CSS, JS)</h3>
          <p>Build beautiful and interactive websites.</p>
          <time datetime="2025-02-01">February 1, 2025</time>
          <p>Topics covered: HTML5 Tags, CSS Styling, JavaScript DOM, Events.</p>
        </article>
      </section>

      <!-- Results Table -->
      <section id="results">
        <h2>Student Results</h2>
        <table>
          <caption><strong>Class 10 - Annual Exam 2025</strong></caption>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Maths</th>
              <th>Science</th>
              <th>English</th>
              <th>Total</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>101</td>
              <td>Alice</td>
              <td>92</td>
              <td>88</td>
              <td>85</td>
              <td>265</td>
              <td>A1</td>
            </tr>
            <tr>
              <td>102</td>
              <td>Bob</td>
              <td>78</td>
              <td>82</td>
              <td>90</td>
              <td>250</td>
              <td>A2</td>
            </tr>
            <tr>
              <td>103</td>
              <td>Charlie</td>
              <td>85</td>
              <td>91</td>
              <td>78</td>
              <td>254</td>
              <td>A2</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- FAQ using details/summary -->
      <section id="faq">
        <h2>Frequently Asked Questions</h2>

        <details>
          <summary>What is HTML5?</summary>
          <p>HTML5 is the latest version of HTML with new semantic tags like header, footer, nav, section, article, and aside for better page structure.</p>
        </details>

        <details>
          <summary>What are semantic tags?</summary>
          <p>Semantic tags clearly describe their meaning to both the browser and developer. Examples: header, nav, main, article, section, aside, footer.</p>
        </details>

        <details>
          <summary>What is the difference between id and class?</summary>
          <p>An <strong>id</strong> is unique and used for a single element (identified by #). A <strong>class</strong> can be reused on multiple elements (identified by .).</p>
        </details>

        <details>
          <summary>What are HTML5 form input types?</summary>
          <p>HTML5 added new input types: email, date, color, range, number, tel, url, search, month, week, time, datetime-local.</p>
        </details>
      </section>

    </main>

    <!-- ========== SIDEBAR ========== -->
    <aside>
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#">Python Programs</a></li>
        <li><a href="#">HTML Programs</a></li>
        <li><a href="#">CSS Programs</a></li>
        <li><a href="#">JS Programs</a></li>
      </ul>

      <h3 style="margin-top: 20px;">Tags Used</h3>
      <p style="font-size: 13px; color: #64748b;">
        <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>,
        <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>,
        <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>,
        <code>&lt;footer&gt;</code>, <code>&lt;figure&gt;</code>,
        <code>&lt;figcaption&gt;</code>, <code>&lt;time&gt;</code>,
        <code>&lt;details&gt;</code>, <code>&lt;summary&gt;</code>,
        <code>&lt;table&gt;</code>, <code>&lt;caption&gt;</code>,
        <code>&lt;code&gt;</code>, <code>&lt;mark&gt;</code>
      </p>
    </aside>

  </div>

  <!-- ========== FOOTER ========== -->
  <footer>
    <p>&copy; 2025 Python Arena | Doon Scholars</p>
    <p>
      <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">Google</a> |
      <a href="mailto:info@pythonarena.com">Email Us</a>
    </p>
  </footer>

</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== HTML TABLES (12 programs) =====================
  {
    id: "table-1",
    title: "Basic Table",
    category: "HTML Tables",
    difficulty: "Easy",
    description: "Simple table with tr, th, td and border attribute",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Basic Table</title>
</head>
<body>
  <h2>Student Marks Table</h2>
  <table border="1">
    <tr>
      <th>Roll No</th>
      <th>Name</th>
      <th>Marks</th>
      <th>Grade</th>
    </tr>
    <tr>
      <td>101</td>
      <td>Rahul</td>
      <td>85</td>
      <td>A</td>
    </tr>
    <tr>
      <td>102</td>
      <td>Priya</td>
      <td>92</td>
      <td>A+</td>
    </tr>
    <tr>
      <td>103</td>
      <td>Amit</td>
      <td>78</td>
      <td>B+</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-2",
    title: "Table with Caption",
    category: "HTML Tables",
    difficulty: "Easy",
    description: "Table with caption, thead, tbody, and tfoot sections",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Table with Caption</title>
</head>
<body>
  <h2>Result Sheet</h2>
  <table border="1" cellpadding="8">
    <caption><strong>Annual Exam Result 2024</strong></caption>
    <thead>
      <tr>
        <th>Roll No</th>
        <th>Name</th>
        <th>Maths</th>
        <th>Science</th>
        <th>English</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>101</td>
        <td>Rahul</td>
        <td>85</td>
        <td>90</td>
        <td>82</td>
      </tr>
      <tr>
        <td>102</td>
        <td>Priya</td>
        <td>95</td>
        <td>88</td>
        <td>91</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2"><strong>Average</strong></td>
        <td><strong>90</strong></td>
        <td><strong>89</strong></td>
        <td><strong>86.5</strong></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-3",
    title: "Colspan Table",
    category: "HTML Tables",
    difficulty: "Medium",
    description: "Table demonstrating colspan for merging columns",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Colspan Table</title>
</head>
<body>
  <h2>Monthly Budget (Colspan Example)</h2>
  <table border="1" cellpadding="8">
    <tr>
      <th colspan="2">Expense Category</th>
      <th>Amount</th>
    </tr>
    <tr>
      <td>Food</td>
      <td>Rice, Dal, Vegetables</td>
      <td>5000</td>
    </tr>
    <tr>
      <td>Transport</td>
      <td>Bus, Auto</td>
      <td>2000</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Total</strong></td>
      <td><strong>7000</strong></td>
    </tr>
  </table>
  <p><em>colspan="2" merges 2 columns into 1 cell</em></p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-4",
    title: "Rowspan Table",
    category: "HTML Tables",
    difficulty: "Medium",
    description: "Table demonstrating rowspan for merging rows",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rowspan Table</title>
</head>
<body>
  <h2>Class Timetable (Rowspan Example)</h2>
  <table border="1" cellpadding="8">
    <tr>
      <th>Day</th>
      <th>Period 1</th>
      <th>Period 2</th>
      <th>Period 3</th>
    </tr>
    <tr>
      <td rowspan="2">Monday</td>
      <td>Maths</td>
      <td>Science</td>
      <td>English</td>
    </tr>
    <tr>
      <td>Hindi</td>
      <td>SST</td>
      <td>Computer</td>
    </tr>
    <tr>
      <td rowspan="2">Tuesday</td>
      <td>Science</td>
      <td>Maths</td>
      <td>English</td>
    </tr>
    <tr>
      <td>Computer</td>
      <td>Hindi</td>
      <td>SST</td>
    </tr>
  </table>
  <p><em>rowspan="2" merges 2 rows into 1 cell</em></p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-5",
    title: "Colspan & Rowspan Combined",
    category: "HTML Tables",
    difficulty: "Hard",
    description: "Complex table with both colspan and rowspan",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Exam Schedule</title>
</head>
<body>
  <h2>Exam Schedule (Colspan + Rowspan)</h2>
  <table border="1" cellpadding="8" cellspacing="0">
    <tr>
      <th colspan="4" style="background:darkblue; color:white;">Class 10 Exam Schedule 2024</th>
    </tr>
    <tr>
      <th>Date</th>
      <th>Time</th>
      <th>Subject</th>
      <th>Room No</th>
    </tr>
    <tr>
      <td rowspan="2">15 March</td>
      <td rowspan="2">9:00 AM</td>
      <td>Maths</td>
      <td>101</td>
    </tr>
    <tr>
      <td>Science</td>
      <td>102</td>
    </tr>
    <tr>
      <td rowspan="2">17 March</td>
      <td rowspan="2">9:00 AM</td>
      <td>English</td>
      <td>101</td>
    </tr>
    <tr>
      <td>Hindi</td>
      <td>103</td>
    </tr>
    <tr>
      <td colspan="3"><strong>Result Declaration</strong></td>
      <td>25 March</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-6",
    title: "Styled Table with CSS",
    category: "HTML Tables",
    difficulty: "Medium",
    description: "Table styled with internal CSS including hover effects",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Styled Table</title>
  <style>
    table {
      border-collapse: collapse;
      width: 80%;
      margin: 20px auto;
      font-family: Arial, sans-serif;
    }
    th, td {
      border: 1px solid #333;
      padding: 12px;
      text-align: center;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #ddd;
      transform: scale(1.01);
    }
    caption {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <table>
    <caption>Student Performance Report</caption>
    <tr>
      <th>Name</th>
      <th>Maths</th>
      <th>Science</th>
      <th>English</th>
      <th>Total</th>
    </tr>
    <tr>
      <td>Rahul</td>
      <td>85</td>
      <td>90</td>
      <td>82</td>
      <td>257</td>
    </tr>
    <tr>
      <td>Priya</td>
      <td>95</td>
      <td>88</td>
      <td>91</td>
      <td>274</td>
    </tr>
    <tr>
      <td>Amit</td>
      <td>78</td>
      <td>82</td>
      <td>76</td>
      <td>236</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-7",
    title: "Student Record Table",
    category: "HTML Tables",
    difficulty: "Easy",
    description: "Table with Roll No, Name, Marks, Grade, and Result columns",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Record Table</title>
</head>
<body>
  <h2>Student Records</h2>
  <table border="1" cellpadding="10">
    <tr>
      <th>Roll No</th>
      <th>Name</th>
      <th>Marks (out of 100)</th>
      <th>Grade</th>
      <th>Result</th>
    </tr>
    <tr>
      <td>101</td>
      <td>Rahul Sharma</td>
      <td>85</td>
      <td>A</td>
      <td>Pass</td>
    </tr>
    <tr>
      <td>102</td>
      <td>Priya Singh</td>
      <td>92</td>
      <td>A+</td>
      <td>Pass</td>
    </tr>
    <tr>
      <td>103</td>
      <td>Amit Kumar</td>
      <td>35</td>
      <td>D</td>
      <td>Fail</td>
    </tr>
    <tr>
      <td>104</td>
      <td>Neha Gupta</td>
      <td>68</td>
      <td>B</td>
      <td>Pass</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-8",
    title: "Timetable with Colspan",
    category: "HTML Tables",
    difficulty: "Hard",
    description: "Weekly class timetable with colspan for lunch break and lab sessions",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weekly Timetable</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 10px; text-align: center; }
    th { background: #333; color: white; }
    .lunch { background: #ffeb3b; font-weight: bold; }
    .lab { background: #81d4fa; }
  </style>
</head>
<body>
  <h2>Weekly Class Timetable - Class 10</h2>
  <table>
    <tr>
      <th>Day</th>
      <th>Period 1</th>
      <th>Period 2</th>
      <th>Period 3</th>
      <th colspan="2">Lunch Break</th>
      <th>Period 4</th>
      <th>Period 5</th>
    </tr>
    <tr>
      <td><strong>Monday</strong></td>
      <td>Maths</td>
      <td>Science</td>
      <td>English</td>
      <td class="lunch" colspan="2">12:00 - 12:30</td>
      <td>Hindi</td>
      <td class="lab">Computer Lab</td>
    </tr>
    <tr>
      <td><strong>Tuesday</strong></td>
      <td>Science</td>
      <td>Maths</td>
      <td>Hindi</td>
      <td class="lunch" colspan="2">12:00 - 12:30</td>
      <td>English</td>
      <td class="lab">Science Lab</td>
    </tr>
    <tr>
      <td><strong>Wednesday</strong></td>
      <td>English</td>
      <td>Hindi</td>
      <td>Maths</td>
      <td class="lunch" colspan="2">12:00 - 12:30</td>
      <td>Science</td>
      <td>SST</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-9",
    title: "Fee Receipt Table",
    category: "HTML Tables",
    difficulty: "Medium",
    description: "Fee receipt with Tuition, Library, Lab, and Total rows using colspan",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt</title>
  <style>
    table { border-collapse: collapse; width: 60%; margin: 20px auto; }
    th, td { border: 1px solid #333; padding: 10px; }
    th { background: #1565c0; color: white; }
    .total { background: #e8f5e9; font-weight: bold; }
  </style>
</head>
<body>
  <h2 style="text-align:center;">School Fee Receipt</h2>
  <table>
    <tr>
      <th colspan="2">Fee Details</th>
    </tr>
    <tr>
      <td>Student Name</td>
      <td>Rahul Sharma</td>
    </tr>
    <tr>
      <td>Class</td>
      <td>Class 10 - Section A</td>
    </tr>
    <tr>
      <td>Tuition Fee</td>
      <td>5000</td>
    </tr>
    <tr>
      <td>Library Fee</td>
      <td>500</td>
    </tr>
    <tr>
      <td>Lab Fee</td>
      <td>1000</td>
    </tr>
    <tr>
      <td>Transport Fee</td>
      <td>2000</td>
    </tr>
    <tr class="total">
      <td><strong>Total Fee</strong></td>
      <td><strong>8500</strong></td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-10",
    title: "Mark Sheet with Tfoot",
    category: "HTML Tables",
    difficulty: "Medium",
    description: "Mark sheet with subjects, marks, grade and tfoot for total/average",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mark Sheet</title>
  <style>
    table { border-collapse: collapse; width: 70%; margin: 20px auto; }
    th, td { border: 1px solid #333; padding: 10px; text-align: center; }
    th { background: #4a148c; color: white; }
    tfoot td { background: #e8eaf6; font-weight: bold; }
    caption { font-size: 1.3em; font-weight: bold; margin-bottom: 10px; }
  </style>
</head>
<body>
  <table>
    <caption>CBSE Mark Sheet - Class 10</caption>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Marks (out of 100)</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Mathematics</td>
        <td>85</td>
        <td>A1</td>
      </tr>
      <tr>
        <td>Science</td>
        <td>92</td>
        <td>A1</td>
      </tr>
      <tr>
        <td>English</td>
        <td>78</td>
        <td>A2</td>
      </tr>
      <tr>
        <td>Hindi</td>
        <td>88</td>
        <td>A1</td>
      </tr>
      <tr>
        <td>Social Science</td>
        <td>91</td>
        <td>A1</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>434 / 500</strong></td>
        <td><strong>A1</strong></td>
      </tr>
      <tr>
        <td><strong>Percentage</strong></td>
        <td colspan="2"><strong>86.8%</strong></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-11",
    title: "Nested Table",
    category: "HTML Tables",
    difficulty: "Hard",
    description: "Table inside a table cell demonstrating nested tables",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nested Table</title>
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
    th { background: #006064; color: white; }
    .outer { margin: 20px; }
    .nested { margin: 5px auto; }
    .nested th { background: #ff6f00; }
  </style>
</head>
<body>
  <h2>Nested Table Example</h2>
  <table class="outer" border="1" cellpadding="10">
    <tr>
      <th>Department</th>
      <th>Staff Details</th>
    </tr>
    <tr>
      <td><strong>Computer Science</strong></td>
      <td>
        <table class="nested" border="1" cellpadding="5">
          <tr>
            <th>Name</th>
            <th>Subject</th>
          </tr>
          <tr>
            <td>Mr. Verma</td>
            <td>CS</td>
          </tr>
          <tr>
            <td>Ms. Rao</td>
            <td>IP</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td><strong>Science</strong></td>
      <td>
        <table class="nested" border="1" cellpadding="5">
          <tr>
            <th>Name</th>
            <th>Subject</th>
          </tr>
          <tr>
            <td>Mr. Singh</td>
            <td>Physics</td>
          </tr>
          <tr>
            <td>Ms. Patel</td>
            <td>Chemistry</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "table-12",
    title: "Responsive Table",
    category: "HTML Tables",
    difficulty: "Hard",
    description: "Table with overflow-x auto wrapper and CSS for responsiveness",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Table</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; }
    .table-container {
      overflow-x: auto;
      margin: 20px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 600px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #2196f3;
      color: white;
      position: sticky;
      top: 0;
    }
    tr:nth-child(even) { background-color: #f5f5f5; }
    tr:hover { background-color: #e3f2fd; }
    caption {
      font-size: 1.2em;
      margin-bottom: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h2>Responsive Table</h2>
  <p>Scroll horizontally if the table overflows the screen width.</p>
  <div class="table-container">
    <table>
      <caption>CBSE Class 9 - Annual Marks</caption>
      <tr>
        <th>Roll</th>
        <th>Name</th>
        <th>English</th>
        <th>Hindi</th>
        <th>Maths</th>
        <th>Science</th>
        <th>SST</th>
        <th>Total</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>1</td>
        <td>Aarav</td>
        <td>82</td>
        <td>88</td>
        <td>91</td>
        <td>85</td>
        <td>90</td>
        <td>436</td>
        <td>87.2%</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Diya</td>
        <td>90</td>
        <td>92</td>
        <td>88</td>
        <td>94</td>
        <td>86</td>
        <td>450</td>
        <td>90.0%</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Vihaan</td>
        <td>76</td>
        <td>80</td>
        <td>85</td>
        <td>79</td>
        <td>82</td>
        <td>402</td>
        <td>80.4%</td>
      </tr>
    </table>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== HTML FORMS (8 programs) =====================
  {
    id: "form-1",
    title: "Basic Registration Form",
    category: "HTML Forms",
    difficulty: "Easy",
    description: "Form with text, email, password, and submit inputs",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Registration Form</title>
</head>
<body>
  <h2>Student Registration Form</h2>
  <form action="#" method="post">
    <label for="name">Full Name:</label><br>
    <input type="text" id="name" name="name" placeholder="Enter your name"><br><br>

    <label for="email">Email:</label><br>
    <input type="email" id="email" name="email" placeholder="Enter your email"><br><br>

    <label for="password">Password:</label><br>
    <input type="password" id="password" name="password" placeholder="Enter password"><br><br>

    <label for="phone">Phone Number:</label><br>
    <input type="tel" id="phone" name="phone" placeholder="Enter phone number"><br><br>

    <input type="submit" value="Register">
    <input type="reset" value="Clear">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-2",
    title: "Survey Form",
    category: "HTML Forms",
    difficulty: "Medium",
    description: "Form with radio buttons, checkboxes, select dropdown, and textarea",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Survey Form</title>
</head>
<body>
  <h2>Student Survey Form</h2>
  <form action="#" method="post">
    <label>Name:</label><br>
    <input type="text" name="name" placeholder="Your name"><br><br>

    <label>Class:</label><br>
    <select name="class">
      <option value="">-- Select Class --</option>
      <option value="9">Class 9</option>
      <option value="10">Class 10</option>
      <option value="11">Class 11</option>
    </select><br><br>

    <label>Gender:</label><br>
    <input type="radio" name="gender" value="male"> Male
    <input type="radio" name="gender" value="female"> Female<br><br>

    <label>Hobbies:</label><br>
    <input type="checkbox" name="hobby" value="reading"> Reading
    <input type="checkbox" name="hobby" value="sports"> Sports
    <input type="checkbox" name="hobby" value="music"> Music<br><br>

    <label>Favorite Subject:</label><br>
    <input type="checkbox" name="subject" value="maths"> Maths
    <input type="checkbox" name="subject" value="science"> Science
    <input type="checkbox" name="subject" value="english"> English<br><br>

    <label>Comments:</label><br>
    <textarea name="comments" rows="4" cols="40" placeholder="Write your feedback..."></textarea><br><br>

    <input type="submit" value="Submit Survey">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-3",
    title: "Login Form",
    category: "HTML Forms",
    difficulty: "Easy",
    description: "Simple login form with username, password, remember me, and submit",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login Form</title>
</head>
<body>
  <h2>Login Form</h2>
  <form action="#" method="post">
    <label for="username">Username:</label><br>
    <input type="text" id="username" name="username" placeholder="Enter username" required><br><br>

    <label for="password">Password:</label><br>
    <input type="password" id="password" name="password" placeholder="Enter password" required><br><br>

    <input type="checkbox" id="remember" name="remember">
    <label for="remember">Remember Me</label><br><br>

    <input type="submit" value="Login">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-4",
    title: "Feedback Form",
    category: "HTML Forms",
    difficulty: "Medium",
    description: "Feedback form with name, email, rating radio, comments textarea",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Feedback Form</title>
</head>
<body>
  <h2>Feedback Form</h2>
  <form action="#" method="post">
    <label for="name">Your Name:</label><br>
    <input type="text" id="name" name="name" placeholder="Enter name" required><br><br>

    <label for="email">Email:</label><br>
    <input type="email" id="email" name="email" placeholder="Enter email" required><br><br>

    <label>Rate our service:</label><br>
    <input type="radio" name="rating" value="5"> Excellent
    <input type="radio" name="rating" value="4"> Good
    <input type="radio" name="rating" value="3"> Average
    <input type="radio" name="rating" value="2"> Below Average
    <input type="radio" name="rating" value="1"> Poor<br><br>

    <label for="subject">Subject:</label><br>
    <select name="subject" id="subject">
      <option value="teaching">Teaching Quality</option>
      <option value="facilities">School Facilities</option>
      <option value="website">Website Experience</option>
    </select><br><br>

    <label for="comments">Your Feedback:</label><br>
    <textarea id="comments" name="comments" rows="5" cols="40" placeholder="Write your feedback here..."></textarea><br><br>

    <input type="submit" value="Submit Feedback">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-5",
    title: "Form with Fieldset",
    category: "HTML Forms",
    difficulty: "Medium",
    description: "Form using fieldset and legend for organizing sections",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Form with Fieldset</title>
</head>
<body>
  <h2>Student Admission Form</h2>
  <form action="#" method="post">
    <fieldset>
      <legend>Personal Information</legend>
      <label>Full Name:</label><br>
      <input type="text" name="name" placeholder="Enter full name"><br><br>

      <label>Date of Birth:</label><br>
      <input type="date" name="dob"><br><br>

      <label>Gender:</label><br>
      <input type="radio" name="gender" value="male"> Male
      <input type="radio" name="gender" value="female"> Female<br><br>

      <label>Address:</label><br>
      <textarea name="address" rows="3" cols="40"></textarea><br><br>
    </fieldset>

    <br>

    <fieldset>
      <legend>Academic Information</legend>
      <label>Previous School:</label><br>
      <input type="text" name="school" placeholder="Enter school name"><br><br>

      <label>Class Applying For:</label><br>
      <select name="class">
        <option value="9">Class 9</option>
        <option value="10">Class 10</option>
        <option value="11">Class 11</option>
      </select><br><br>

      <label>Previous Class Marks (%):</label><br>
      <input type="number" name="marks" min="0" max="100"><br><br>
    </fieldset>

    <br>
    <input type="submit" value="Submit Application">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-6",
    title: "Form Validation Attributes",
    category: "HTML Forms",
    difficulty: "Medium",
    description: "Form with required, pattern, min, max, minlength, maxlength, placeholder",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Form Validation</title>
</head>
<body>
  <h2>Form Validation Attributes</h2>
  <form action="#" method="post">
    <label>Name (required, minlength 3):</label><br>
    <input type="text" name="name" required minlength="3" placeholder="Min 3 chars"><br><br>

    <label>Email (required):</label><br>
    <input type="email" name="email" required placeholder="user@example.com"><br><br>

    <label>Age (1-120):</label><br>
    <input type="number" name="age" min="1" max="120" required><br><br>

    <label>Password (min 8, max 20):</label><br>
    <input type="password" name="password" required minlength="8" maxlength="20"><br><br>

    <label>Phone (pattern: 10 digits):</label><br>
    <input type="tel" name="phone" pattern="[0-9]{10}" placeholder="1234567890" required><br><br>

    <label>Website (URL):</label><br>
    <input type="url" name="website" placeholder="https://example.com"><br><br>

    <label>Date:</label><br>
    <input type="date" name="date" required><br><br>

    <input type="submit" value="Submit">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-7",
    title: "Contact Form",
    category: "HTML Forms",
    difficulty: "Easy",
    description: "Contact form with name, phone, email, subject dropdown, message textarea",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contact Form</title>
</head>
<body>
  <h2>Contact Us</h2>
  <form action="#" method="post">
    <label for="name">Your Name:</label><br>
    <input type="text" id="name" name="name" placeholder="Enter name" required><br><br>

    <label for="phone">Phone Number:</label><br>
    <input type="tel" id="phone" name="phone" placeholder="Enter phone"><br><br>

    <label for="email">Email Address:</label><br>
    <input type="email" id="email" name="email" placeholder="Enter email" required><br><br>

    <label for="subject">Subject:</label><br>
    <select id="subject" name="subject">
      <option value="general">General Inquiry</option>
      <option value="admission">Admission</option>
      <option value="fees">Fees Related</option>
      <option value="complaint">Complaint</option>
    </select><br><br>

    <label for="message">Message:</label><br>
    <textarea id="message" name="message" rows="5" cols="40" placeholder="Write your message..." required></textarea><br><br>

    <input type="submit" value="Send Message">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "form-8",
    title: "Registration with All Input Types",
    category: "HTML Forms",
    difficulty: "Hard",
    description: "Comprehensive form with all HTML5 input types",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>All Input Types</title>
</head>
<body>
  <h2>Registration - All Input Types</h2>
  <form action="#" method="post">
    <label>Text:</label><br>
    <input type="text" name="text" placeholder="Enter text"><br><br>

    <label>Email:</label><br>
    <input type="email" name="email" placeholder="user@example.com"><br><br>

    <label>Password:</label><br>
    <input type="password" name="password"><br><br>

    <label>Number (Age):</label><br>
    <input type="number" name="age" min="1" max="120"><br><br>

    <label>Date of Birth:</label><br>
    <input type="date" name="dob"><br><br>

    <label>Phone:</label><br>
    <input type="tel" name="phone" placeholder="1234567890"><br><br>

    <label>Website:</label><br>
    <input type="url" name="url" placeholder="https://example.com"><br><br>

    <label>Favorite Color:</label><br>
    <input type="color" name="color" value="#3498db"><br><br>

    <label>Range (1-100):</label><br>
    <input type="range" name="range" min="1" max="100"><br><br>

    <label>Upload Resume:</label><br>
    <input type="file" name="resume"><br><br>

    <label>Gender:</label><br>
    <input type="radio" name="gender" value="male"> Male
    <input type="radio" name="gender" value="female"> Female<br><br>

    <label>Skills:</label><br>
    <input type="checkbox" name="skill" value="html"> HTML
    <input type="checkbox" name="skill" value="css"> CSS
    <input type="checkbox" name="skill" value="js"> JavaScript<br><br>

    <label>Country:</label><br>
    <select name="country">
      <option value="india">India</option>
      <option value="usa">USA</option>
      <option value="uk">UK</option>
    </select><br><br>

    <label>Bio:</label><br>
    <textarea name="bio" rows="3" cols="40" placeholder="Write about yourself..."></textarea><br><br>

    <input type="submit" value="Register">
    <input type="reset" value="Clear All">
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== INLINE CSS (7 programs) =====================
  {
    id: "inline-1",
    title: "Inline CSS Basics",
    category: "Inline CSS",
    difficulty: "Easy",
    description: "Elements styled using inline style attribute",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Basics</title>
</head>
<body>
  <h1 style="color: blue;">Blue Heading</h1>
  <p style="color: red; font-size: 18px;">Red paragraph with larger font</p>
  <div style="background-color: yellow; padding: 20px;">Yellow background box</div>
  <p style="color: green; font-weight: bold;">Green bold text</p>
  <p style="font-style: italic; color: purple;">Purple italic text</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-2",
    title: "Inline CSS Text Styling",
    category: "Inline CSS",
    difficulty: "Easy",
    description: "Text styling using inline CSS properties",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Text Styling</title>
</head>
<body>
  <p style="color: red;">Red Color Text</p>
  <p style="font-family: Arial, sans-serif;">Arial Font Family</p>
  <p style="font-size: 24px;">Font Size 24px</p>
  <p style="text-align: center;">Center Aligned Text</p>
  <p style="text-decoration: underline;">Underlined Text</p>
  <p style="text-decoration: line-through;">Strikethrough Text</p>
  <p style="text-transform: uppercase;">uppercase text</p>
  <p style="text-transform: lowercase;">LOWERCASE TEXT</p>
  <p style="letter-spacing: 3px;">Spaced Letters</p>
  <p style="line-height: 1.8;">Line height is 1.8 here. This makes the text easier to read by adding more space between lines.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-3",
    title: "Inline CSS Box Model",
    category: "Inline CSS",
    difficulty: "Medium",
    description: "Box model properties using inline styles",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Box Model</title>
</head>
<body>
  <h2>Box Model with Inline CSS</h2>

  <div style="width: 200px; padding: 20px; border: 2px solid red; margin: 10px; background-color: lightyellow;">
    Box 1: padding=20, border=2, margin=10
  </div>

  <div style="width: 200px; padding: 10px 30px; border: 3px dashed blue; margin: 15px; background-color: lightcyan;">
    Box 2: padding=10/30, border=3 dashed, margin=15
  </div>

  <div style="width: 200px; padding: 5px; border: 1px solid green; margin: 20px; background-color: lightgreen;">
    Box 3: padding=5, border=1, margin=20
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-4",
    title: "Inline CSS Table",
    category: "Inline CSS",
    difficulty: "Easy",
    description: "Table styled entirely with inline styles",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Table</title>
</head>
<body>
  <h2>Table with Inline CSS</h2>
  <table style="border-collapse: collapse; width: 80%; margin: 20px auto; font-family: Arial;">
    <tr>
      <th style="border: 1px solid #333; padding: 12px; background-color: #4CAF50; color: white;">Name</th>
      <th style="border: 1px solid #333; padding: 12px; background-color: #4CAF50; color: white;">Class</th>
      <th style="border: 1px solid #333; padding: 12px; background-color: #4CAF50; color: white;">Marks</th>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">Rahul</td>
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">10</td>
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">85</td>
    </tr>
    <tr style="background-color: #f2f2f2;">
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">Priya</td>
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">10</td>
      <td style="border: 1px solid #333; padding: 10px; text-align: center;">92</td>
    </tr>
  </table>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-5",
    title: "Inline CSS Card",
    category: "Inline CSS",
    difficulty: "Medium",
    description: "Card layout using only inline styles",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Card</title>
</head>
<body>
  <h2 style="text-align: center;">Product Card</h2>
  <div style="width: 280px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); font-family: Arial;">
    <img src="https://via.placeholder.com/280x180" alt="Product" style="width: 100%; height: 180px;">
    <div style="padding: 15px;">
      <h3 style="margin: 0 0 10px 0; color: #333;">Wireless Headphones</h3>
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Premium sound quality with noise cancellation.</p>
      <p style="font-size: 20px; color: #e74c3c; font-weight: bold; margin: 0 0 15px 0;">Rs. 1,999</p>
      <button style="width: 100%; padding: 10px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Add to Cart</button>
    </div>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-6",
    title: "Inline CSS Form",
    category: "Inline CSS",
    difficulty: "Medium",
    description: "Form with all inputs styled using inline CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Form</title>
</head>
<body>
  <h2 style="text-align: center; font-family: Arial;">Contact Form</h2>
  <form style="max-width: 400px; margin: 0 auto; font-family: Arial;">
    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Name:</label>
    <input type="text" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;" placeholder="Enter name"><br>

    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
    <input type="email" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;" placeholder="Enter email"><br>

    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Message:</label>
    <textarea style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;" rows="4" placeholder="Your message"></textarea><br>

    <button style="width: 100%; padding: 12px; background-color: #27ae60; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Send Message</button>
  </form>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "inline-7",
    title: "Inline CSS Limitations Demo",
    category: "Inline CSS",
    difficulty: "Easy",
    description: "Demonstrate why inline CSS is not recommended",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inline CSS Limitations</title>
</head>
<body>
  <h2>Why Inline CSS is Not Recommended</h2>
  <p style="color: red; font-size: 16px; font-family: Arial; margin: 10px; padding: 5px; border: 1px solid red;">Paragraph 1 - Same style repeated</p>
  <p style="color: red; font-size: 16px; font-family: Arial; margin: 10px; padding: 5px; border: 1px solid red;">Paragraph 2 - Same style repeated</p>
  <p style="color: red; font-size: 16px; font-family: Arial; margin: 10px; padding: 5px; border: 1px solid red;">Paragraph 3 - Same style repeated</p>

  <h3>Problems with Inline CSS:</h3>
  <ul>
    <li>Code becomes very long and repetitive</li>
    <li>Hard to maintain - change in one place doesn't update others</li>
    <li>Cannot use pseudo-classes like :hover</li>
    <li>Specificity issues - hard to override</li>
    <li>Mixes content with presentation</li>
  </ul>
  <p style="color: #e74c3c; font-weight: bold;">Better approach: Use Internal or External CSS!</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== INTERNAL CSS (8 programs) =====================
  {
    id: "internal-1",
    title: "Internal CSS Basics",
    category: "Internal CSS",
    difficulty: "Easy",
    description: "Style tag in head with element, class, and id selectors",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal CSS Basics</title>
  <style>
    /* Element Selector */
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }

    /* Class Selector */
    .highlight {
      background-color: yellow;
      padding: 5px;
    }

    /* ID Selector */
    #main-title {
      color: navy;
      text-align: center;
    }

    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h1 id="main-title">Internal CSS Demo</h1>

  <p>This is a normal paragraph.</p>
  <p class="highlight">This paragraph has the highlight class.</p>
  <p class="highlight">This also has the highlight class.</p>
  <p>This is another normal paragraph.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-2",
    title: "Internal CSS Text & Font",
    category: "Internal CSS",
    difficulty: "Easy",
    description: "Text and font styling with internal CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal CSS Text & Font</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 30px;
    }
    h1 {
      color: #2c3e50;
      font-size: 32px;
      text-align: center;
    }
    .subtitle {
      color: #7f8c8d;
      font-size: 18px;
      text-align: center;
      font-style: italic;
    }
    p {
      color: #333;
      font-size: 16px;
      line-height: 1.8;
      text-align: justify;
    }
    .uppercase {
      text-transform: uppercase;
      font-weight: bold;
      color: #e74c3c;
    }
    .spaced {
      letter-spacing: 2px;
      word-spacing: 5px;
    }
    .decorated {
      text-decoration: underline overline;
      color: #2980b9;
    }
  </style>
</head>
<body>
  <h1>Text & Font Styling</h1>
  <p class="subtitle">Using Internal CSS</p>

  <p>This paragraph demonstrates font-size, line-height, and text-align properties.</p>
  <p class="uppercase">This text is transformed to uppercase.</p>
  <p class="spaced">This text has extra letter and word spacing.</p>
  <p class="decorated">This text has underline and overline decoration.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-3",
    title: "Internal CSS Box Model",
    category: "Internal CSS",
    difficulty: "Medium",
    description: "Margin, padding, border, width, height with internal CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal CSS Box Model</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .box1 {
      width: 200px;
      padding: 20px;
      border: 2px solid red;
      margin: 10px;
      background-color: #ffebee;
      display: inline-block;
    }
    .box2 {
      width: 200px;
      padding: 30px;
      border: 3px dashed blue;
      margin: 15px;
      background-color: #e3f2fd;
      display: inline-block;
    }
    .box3 {
      width: 200px;
      padding: 15px;
      border: 4px double green;
      margin: 20px;
      background-color: #e8f5e9;
      display: inline-block;
    }
    h2 { color: #333; }
  </style>
</head>
<body>
  <h2>CSS Box Model</h2>
  <div class="box1">Box 1: padding=20, border=2 solid, margin=10</div>
  <div class="box2">Box 2: padding=30, border=3 dashed, margin=15</div>
  <div class="box3">Box 3: padding=15, border=4 double, margin=20</div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-4",
    title: "Internal CSS Background",
    category: "Internal CSS",
    difficulty: "Medium",
    description: "Background-color, background-image, background-size, background-repeat",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal CSS Background</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
    }
    .hero {
      background-color: #3498db;
      background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5));
      color: white;
      text-align: center;
      padding: 100px 20px;
    }
    .pattern-bg {
      background-color: #f0f0f0;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        #ddd 10px,
        #ddd 20px
      );
      padding: 30px;
      margin: 20px;
    }
    .image-bg {
      background-color: #333;
      background-image: url('https://via.placeholder.com/400x200');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      color: white;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Background CSS Demo</h1>
    <p>Background with gradient overlay</p>
  </div>

  <div class="pattern-bg">
    <h2>Pattern Background</h2>
    <p>Using repeating-linear-gradient</p>
  </div>

  <div class="image-bg">
    <h2>Image Background</h2>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-5",
    title: "Internal CSS Display",
    category: "Internal CSS",
    difficulty: "Medium",
    description: "Display block, inline, inline-block, and none examples",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Internal CSS Display</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h2 { color: #333; }

    .block-demo div {
      display: block;
      background-color: #e74c3c;
      color: white;
      padding: 10px;
      margin: 5px 0;
    }
    .inline-demo span {
      display: inline;
      background-color: #3498db;
      color: white;
      padding: 5px 10px;
      margin: 5px;
    }
    .inline-block-demo div {
      display: inline-block;
      width: 150px;
      background-color: #2ecc71;
      color: white;
      padding: 10px;
      margin: 5px;
      text-align: center;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <h2>Display: Block</h2>
  <div class="block-demo">
    <div>Block 1 - Takes full width</div>
    <div>Block 2 - Each on new line</div>
    <div>Block 3 - Full width</div>
  </div>

  <h2>Display: Inline</h2>
  <div class="inline-demo">
    <span>Inline 1</span>
    <span>Inline 2</span>
    <span>Inline 3</span>
    <span>Inline 4</span>
  </div>

  <h2>Display: Inline-Block</h2>
  <div class="inline-block-demo">
    <div>Box 1</div>
    <div>Box 2</div>
    <div>Box 3</div>
  </div>

  <h2>Display: None</h2>
  <p>This element is visible.</p>
  <p class="hidden">This element is hidden (display: none).</p>
  <p>This element is also visible.</p>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-6",
    title: "Internal CSS Navigation Bar",
    category: "Internal CSS",
    difficulty: "Medium",
    description: "Horizontal nav bar styled with internal CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Navigation Bar</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
    }
    nav {
      background-color: #333;
      overflow: hidden;
    }
    nav a {
      color: white;
      text-decoration: none;
      padding: 16px 20px;
      display: inline-block;
    }
    nav a:hover {
      background-color: #575757;
    }
    nav a.active {
      background-color: #4CAF50;
    }
    .content {
      padding: 20px;
    }
  </style>
</head>
<body>
  <nav>
    <a href="#" class="active">Home</a>
    <a href="#">About</a>
    <a href="#">Courses</a>
    <a href="#">Results</a>
    <a href="#">Contact</a>
  </nav>
  <div class="content">
    <h1>Welcome to Our School</h1>
    <p>This navigation bar is created using internal CSS.</p>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-7",
    title: "Internal CSS Form Styling",
    category: "Internal CSS",
    difficulty: "Medium",
    description: "Beautiful form with labels, inputs, and buttons styled with internal CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Styled Form</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .form-container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 400px;
    }
    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
    input[type="text"],
    input[type="email"],
    input[type="password"],
    textarea {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus, textarea:focus {
      border-color: #4CAF50;
      outline: none;
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
    }
    button {
      width: 100%;
      padding: 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>Student Login</h2>
    <form>
      <label>Email:</label>
      <input type="email" placeholder="Enter email">

      <label>Password:</label>
      <input type="password" placeholder="Enter password">

      <label>Full Name:</label>
      <input type="text" placeholder="Enter your name">

      <label>Comments:</label>
      <textarea rows="3" placeholder="Any comments?"></textarea>

      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "internal-8",
    title: "Internal CSS - Complete Page",
    category: "Internal CSS",
    difficulty: "Hard",
    description: "Full page with header, sidebar, main content, and footer using flexbox",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Complete Page Layout</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }

    header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      text-align: center;
    }
    header h1 { font-size: 24px; }
    nav { background-color: #34495e; padding: 10px; text-align: center; }
    nav a { color: white; text-decoration: none; padding: 10px 20px; }
    nav a:hover { background-color: #4CAF50; border-radius: 5px; }

    .container {
      display: flex;
      min-height: 400px;
    }
    .sidebar {
      width: 250px;
      background-color: #ecf0f1;
      padding: 20px;
    }
    .sidebar h3 { color: #2c3e50; margin-bottom: 10px; }
    .sidebar ul { list-style: none; }
    .sidebar ul li { padding: 8px 0; border-bottom: 1px solid #ddd; }
    .sidebar ul li a { text-decoration: none; color: #333; }

    .main-content {
      flex: 1;
      padding: 20px;
    }
    .main-content h2 { color: #2c3e50; margin-bottom: 15px; }
    .card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    footer {
      background-color: #2c3e50;
      color: white;
      text-align: center;
      padding: 15px;
    }
  </style>
</head>
<body>
  <header>
    <h1>My School Website</h1>
  </header>
  <nav>
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Courses</a>
    <a href="#">Contact</a>
  </nav>

  <div class="container">
    <aside class="sidebar">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#">Syllabus</a></li>
        <li><a href="#">Results</a></li>
        <li><a href="#">Time Table</a></li>
        <li><a href="#">Assignments</a></li>
      </ul>
    </aside>

    <main class="main-content">
      <h2>Welcome Students</h2>
      <div class="card">
        <h3>Exam Schedule Released</h3>
        <p>The annual exam schedule for Class 9-11 has been released. Check the notice board for details.</p>
      </div>
      <div class="card">
        <h3>PTM on Friday</h3>
        <p>Parent-Teacher Meeting is scheduled for this Friday. Parents are requested to attend.</p>
      </div>
    </main>
  </div>

  <footer>
    <p>&copy; 2024 My School. All rights reserved.</p>
  </footer>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== EXTERNAL CSS (5 programs) =====================
  {
    id: "external-1",
    title: "External CSS Basics",
    category: "External CSS",
    difficulty: "Easy",
    description: "HTML with link tag to external stylesheet",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>External CSS Basics</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>External CSS Demo</h1>
  <p>This page uses an external CSS file for styling.</p>
  <div class="container">
    <p>Everything is styled from style.css</p>
  </div>
</body>
</html>`,
    cssCode: `/* style.css */
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  margin: 20px;
  background-color: #f5f5f5;
  color: #333;
}

h1 {
  color: #2c3e50;
  text-align: center;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

p {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
}

.container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-top: 20px;
}`,
    jsCode: "",
  },
  {
    id: "external-2",
    title: "External CSS Selectors",
    category: "External CSS",
    difficulty: "Medium",
    description: "HTML with class and id selectors in external CSS",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSS Selectors</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>CSS Selectors Demo</h1>

  <p>This is a normal paragraph (element selector).</p>
  <p class="highlight">This has class "highlight" (class selector).</p>
  <p class="highlight">Another highlight paragraph.</p>
  <p id="special" class="highlight">This has both id and class (id has higher specificity).</p>

  <div class="container">
    <h2>Descendant Selector</h2>
    <p>This p inside .container (descendant selector).</p>
    <span>This span is also inside .container.</span>
  </div>

  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
    <li class="highlight">List item 3 (highlighted)</li>
  </ul>
</body>
</html>`,
    cssCode: `/* style.css */
/* Element Selector */
body {
  font-family: Arial, sans-serif;
  margin: 20px;
  color: #333;
}

/* Class Selector */
.highlight {
  background-color: #fff3cd;
  padding: 8px;
  border-left: 4px solid #ffc107;
}

/* ID Selector */
#special {
  background-color: #d4edda;
  border-left-color: #28a745;
  font-weight: bold;
}

/* Descendant Selector */
.container p {
  color: #007bff;
  font-style: italic;
}

/* Group Selector */
h1, h2, h3 {
  color: #2c3e50;
}

/* Pseudo-class */
li:hover {
  background-color: #e2e3e5;
  cursor: pointer;
}`,
    jsCode: "",
  },
  {
    id: "external-3",
    title: "External CSS Card Grid",
    category: "External CSS",
    difficulty: "Medium",
    description: "Grid of cards using CSS grid or flexbox layout",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Card Grid</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Student Profiles - Card Grid</h1>
  <div class="grid">
    <div class="card">
      <img src="https://via.placeholder.com/150" alt="Student">
      <h3>Rahul Sharma</h3>
      <p>Class 10 | Roll: 101</p>
      <span class="badge">A+ Grade</span>
    </div>
    <div class="card">
      <img src="https://via.placeholder.com/150" alt="Student">
      <h3>Priya Singh</h3>
      <p>Class 10 | Roll: 102</p>
      <span class="badge">A Grade</span>
    </div>
    <div class="card">
      <img src="https://via.placeholder.com/150" alt="Student">
      <h3>Amit Kumar</h3>
      <p>Class 10 | Roll: 103</p>
      <span class="badge">B+ Grade</span>
    </div>
    <div class="card">
      <img src="https://via.placeholder.com/150" alt="Student">
      <h3>Neha Gupta</h3>
      <p>Class 10 | Roll: 104</p>
      <span class="badge">A+ Grade</span>
    </div>
  </div>
</body>
</html>`,
    cssCode: `/* style.css */
body {
  font-family: Arial, sans-serif;
  margin: 20px;
  background-color: #f0f2f5;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.card h3 {
  color: #2c3e50;
  margin: 10px 0 5px;
}

.card p {
  color: #666;
  font-size: 14px;
}

.badge {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  margin-top: 10px;
}`,
    jsCode: "",
  },
  {
    id: "external-4",
    title: "External CSS Responsive",
    category: "External CSS",
    difficulty: "Hard",
    description: "Layout with flexbox and media queries for responsiveness",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Layout</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>My Responsive Website</h1>
    <nav>
      <a href="#">Home</a>
      <a href="#">About</a>
      <a href="#">Courses</a>
      <a href="#">Contact</a>
    </nav>
  </header>

  <section class="hero">
    <h2>Welcome to Class 9-11</h2>
    <p>Learn HTML, CSS, and JavaScript</p>
  </section>

  <section class="cards">
    <div class="card">
      <h3>HTML</h3>
      <p>Structure of web pages</p>
    </div>
    <div class="card">
      <h3>CSS</h3>
      <p>Styling and design</p>
    </div>
    <div class="card">
      <h3>JavaScript</h3>
      <p>Interactivity and logic</p>
    </div>
  </section>

  <footer>
    <p>&copy; 2024 My School</p>
  </footer>
</body>
</html>`,
    cssCode: `/* style.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; }

header {
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

nav a {
  color: white;
  text-decoration: none;
  margin-left: 20px;
}
nav a:hover { color: #4CAF50; }

.hero {
  background-color: #3498db;
  color: white;
  text-align: center;
  padding: 60px 20px;
}
.hero h2 { font-size: 2em; }

.cards {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 40px 20px;
  flex-wrap: wrap;
}

.card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 30px;
  width: 250px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card h3 { color: #2c3e50; margin-bottom: 10px; }

footer {
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 15px;
}

/* Media Queries for Responsiveness */
@media (max-width: 768px) {
  header {
    flex-direction: column;
    text-align: center;
  }
  nav { margin-top: 10px; }
  nav a { margin: 0 10px; }
  .hero h2 { font-size: 1.5em; }
  .cards { flex-direction: column; align-items: center; }
}`,
    jsCode: "",
  },
  {
    id: "external-5",
    title: "External CSS - Hover Effects",
    category: "External CSS",
    difficulty: "Medium",
    description: "Hover transitions, transform scale, box-shadow changes",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hover Effects</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>CSS Hover Effects</h1>

  <div class="btn-group">
    <button class="btn btn-primary">Primary</button>
    <button class="btn btn-success">Success</button>
    <button class="btn btn-danger">Danger</button>
  </div>

  <div class="cards">
    <div class="card card-1">
      <h3>Card 1</h3>
      <p>Hover me for shadow effect</p>
    </div>
    <div class="card card-2">
      <h3>Card 2</h3>
      <p>Hover me for scale effect</p>
    </div>
    <div class="card card-3">
      <h3>Card 3</h3>
      <p>Hover me for color change</p>
    </div>
  </div>

  <div class="link-group">
    <a href="#" class="hover-link">Hover Link Effect</a>
  </div>
</body>
</html>`,
    cssCode: `/* style.css */
body {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 30px;
  background-color: #f5f5f5;
}

h1 { color: #2c3e50; margin-bottom: 30px; }

.btn-group { margin-bottom: 40px; }

.btn {
  padding: 12px 24px;
  margin: 0 10px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}
.btn-primary:hover {
  background-color: #2980b9;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.btn-success {
  background-color: #2ecc71;
  color: white;
}
.btn-success:hover {
  background-color: #27ae60;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}
.btn-danger:hover {
  background-color: #c0392b;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.cards {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 200px;
  transition: all 0.3s ease;
}

.card-1:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.card-2:hover {
  transform: scale(1.08);
}

.card-3:hover {
  background-color: #3498db;
  color: white;
}

.hover-link {
  font-size: 20px;
  color: #3498db;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.hover-link:hover {
  color: #e74c3c;
  border-bottom-color: #e74c3c;
}`,
    jsCode: "",
  },

  // ===================== JS BASIC (3 programs) =====================
  {
    id: "js-1",
    title: "Hello World JS",
    category: "JS Basics",
    difficulty: "Easy",
    description: "Button with onclick alert using script tag",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World JavaScript</title>
</head>
<body>
  <h1>JavaScript Hello World</h1>
  <button onclick="sayHello()">Click Me!</button>
  <p id="message"></p>

  <script>
    function sayHello() {
      alert('Hello, World!');
      document.getElementById('message').innerHTML = 'Button was clicked!';
    }
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "js-2",
    title: "Variables & Data Types",
    category: "JS Basics",
    difficulty: "Easy",
    description: "let, const, typeof, display in innerHTML",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Variables and Data Types</title>
</head>
<body>
  <h1>JavaScript Variables & Data Types</h1>
  <button onclick="showVariables()">Show Variables</button>
  <div id="output" style="margin-top: 20px; padding: 15px; background: #f0f0f0;"></div>

  <script>
    function showVariables() {
      let name = "Rahul";
      let age = 15;
      let isStudent = true;
      let marks = 85.5;
      const school = "Delhi Public School";

      let output = '';
      output += '<p><b>name:</b> ' + name + ' (type: ' + typeof name + ')</p>';
      output += '<p><b>age:</b> ' + age + ' (type: ' + typeof age + ')</p>';
      output += '<p><b>isStudent:</b> ' + isStudent + ' (type: ' + typeof isStudent + ')</p>';
      output += '<p><b>marks:</b> ' + marks + ' (type: ' + typeof marks + ')</p>';
      output += '<p><b>school:</b> ' + school + ' (type: ' + typeof school + ')</p>';

      document.getElementById('output').innerHTML = output;
    }
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "js-3",
    title: "Grade Calculator (if-else)",
    category: "JS Basics",
    difficulty: "Easy",
    description: "Input marks, button, if-else ladder for grade calculation",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grade Calculator</title>
</head>
<body>
  <h1>Grade Calculator</h1>
  <label for="marks">Enter Marks (0-100):</label><br>
  <input type="number" id="marks" min="0" max="100" placeholder="Enter marks">
  <button onclick="calculateGrade()">Calculate</button>

  <div id="result" style="margin-top: 20px; padding: 15px;"></div>

  <script>
    function calculateGrade() {
      let marks = parseInt(document.getElementById('marks').value);
      let grade, result;

      if (marks >= 90) {
        grade = 'A+';
        result = 'Outstanding!';
      } else if (marks >= 80) {
        grade = 'A';
        result = 'Excellent!';
      } else if (marks >= 70) {
        grade = 'B+';
        result = 'Very Good';
      } else if (marks >= 60) {
        grade = 'B';
        result = 'Good';
      } else if (marks >= 50) {
        grade = 'C';
        result = 'Average';
      } else if (marks >= 33) {
        grade = 'D';
        result = 'Pass';
      } else {
        grade = 'F';
        result = 'Fail';
      }

      document.getElementById('result').innerHTML =
        '<h3>Marks: ' + marks + '</h3>' +
        '<h3>Grade: ' + grade + '</h3>' +
        '<h3>' + result + '</h3>';
    }
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== JS DOM (2 programs) =====================
  {
    id: "dom-1",
    title: "DOM - Change Content",
    category: "JS DOM",
    difficulty: "Medium",
    description: "getElementById, innerHTML, textContent usage",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DOM - Change Content</title>
</head>
<body>
  <h1>DOM Content Manipulation</h1>

  <div id="box" style="padding:20px; background:#eee; margin:10px 0;">
    Original content here.
  </div>

  <button onclick="changeInner()">Change innerHTML</button>
  <button onclick="changeText()">Change textContent</button>
  <button onclick="resetContent()">Reset</button>

  <p style="margin-top:15px;"><b>innerHTML</b> parses HTML tags. <b>textContent</b> treats everything as plain text.</p>

  <script>
    function changeInner() {
      document.getElementById('box').innerHTML = '<b style="color:red;">HTML content set via innerHTML!</b>';
    }

    function changeText() {
      document.getElementById('box').textContent = '<b>This is plain text, not HTML (textContent)</b>';
    }

    function resetContent() {
      document.getElementById('box').innerHTML = 'Original content here.';
    }
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
  {
    id: "dom-2",
    title: "DOM - Change Styles",
    category: "JS DOM",
    difficulty: "Medium",
    description: "element.style property to change color, size, background",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DOM - Change Styles</title>
</head>
<body>
  <h1>DOM Style Manipulation</h1>

  <div id="styled-box" style="width:200px; height:100px; background:#3498db; color:white; display:flex; align-items:center; justify-content:center; border-radius:8px; transition: all 0.3s;">
    Style me!
  </div>

  <br>
  <button onclick="changeColor()">Change Color</button>
  <button onclick="changeSize()">Change Size</button>
  <button onclick="changeBg()">Change Background</button>
  <button onclick="resetStyle()">Reset</button>

  <script>
    function changeColor() {
      document.getElementById('styled-box').style.color = 'yellow';
    }

    function changeSize() {
      document.getElementById('styled-box').style.fontSize = '24px';
    }

    function changeBg() {
      document.getElementById('styled-box').style.backgroundColor = '#e74c3c';
    }

    function resetStyle() {
      let box = document.getElementById('styled-box');
      box.style.color = 'white';
      box.style.fontSize = '16px';
      box.style.backgroundColor = '#3498db';
    }
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },

  // ===================== JS EVENTS (1 program) =====================
  {
    id: "event-1",
    title: "Click Counter",
    category: "JS Events",
    difficulty: "Easy",
    description: "addEventListener click, increment counter",
    htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Click Counter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
    }
    #counter {
      font-size: 72px;
      color: #2c3e50;
      margin: 20px 0;
    }
    #clickBtn {
      padding: 15px 40px;
      font-size: 18px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s;
    }
    #clickBtn:hover {
      background-color: #2980b9;
    }
    #resetBtn {
      padding: 10px 20px;
      font-size: 14px;
      margin-top: 10px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Click Counter</h1>
  <div id="counter">0</div>
  <button id="clickBtn">Click Me!</button><br>
  <button id="resetBtn">Reset</button>

  <script>
    let count = 0;
    const counterEl = document.getElementById('counter');
    const clickBtn = document.getElementById('clickBtn');
    const resetBtn = document.getElementById('resetBtn');

    clickBtn.addEventListener('click', function() {
      count++;
      counterEl.textContent = count;
    });

    resetBtn.addEventListener('click', function() {
      count = 0;
      counterEl.textContent = count;
    });
  </script>
</body>
</html>`,
    cssCode: "",
    jsCode: "",
  },
]
