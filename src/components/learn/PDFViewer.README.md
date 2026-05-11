# PDF Viewer Component

A robust, reusable embedded PDF viewer component for LMS lessons with comprehensive loading states, error handling, and interactive features.

## Features

✅ **Responsive Design**
- Adapts to container size
- Configurable height and minimum height
- Mobile-friendly with touch support

✅ **Loading States**
- Animated loading spinner with pulsing indicator
- Loading status text
- Smooth fade-in transition when PDF loads

✅ **Error Handling**
- Graceful error state with helpful messaging
- Suggestions for troubleshooting
- Download fallback button for offline viewing
- Error state styling consistent with dark theme

✅ **Download Support**
- Download button in toolbar
- Generates filename from lesson title
- Direct download without browser limitations

✅ **Fullscreen Support**
- Fullscreen toggle button
- Expands to viewport with fixed positioning
- ESC key hint in fullscreen mode
- Auto-closes on ESC or via button
- Smooth transitions

✅ **Dark Mode Compatible**
- Slate-950/slate-900 color scheme
- Cyan-400 accent colors
- White/10 borders
- White overlay for PDF document
- High contrast for accessibility

✅ **Accessibility**
- ARIA labels on all buttons
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly

## Usage

### Basic Usage (Lesson Page)

```tsx
import PDFViewer from "@/src/components/learn/PDFViewer";

export default function MyLessonPage() {
  return (
    <PDFViewer
      pdfUrl="https://cdn.example.com/lesson.pdf"
      title="Introduction to Python"
    />
  );
}
```

### With Custom Configuration

```tsx
<PDFViewer
  pdfUrl="https://cdn.example.com/lesson.pdf"
  title="Advanced JavaScript Concepts"
  showDownloadButton={true}
  showFullscreenButton={true}
  height="80vh"
  minHeight="500px"
/>
```

### In Split View (Text + PDF)

```tsx
<div className="grid grid-cols-2 gap-4">
  <PDFViewer
    pdfUrl={pdfUrl}
    title={title}
    showDownloadButton
    showFullscreenButton={false}
    height="65vh"
    minHeight="420px"
  />
  
  <div className="min-h-[420px]">
    <YourTextContent />
  </div>
</div>
```

## Props

### Required
- **`pdfUrl`** `string` - Full URL to the PDF file
- **`title`** `string` - Lesson title (used for download filename and ARIA labels)

### Optional
- **`showDownloadButton`** `boolean` (default: `true`)
  - Display download button in toolbar
  - Downloads PDF with title-based filename

- **`showFullscreenButton`** `boolean` (default: `true`)
  - Display fullscreen toggle button
  - Set to `false` in split views to avoid overlapping controls

- **`height`** `string` (default: `"65vh"`)
  - CSS height value (e.g., "65vh", "500px", "100%")
  - Ignored when in fullscreen mode

- **`minHeight`** `string` (default: `"420px"`)
  - Minimum height CSS value
  - Ensures minimum viewing area on mobile

## Component Structure

```
┌─────────────────────────────────────┐
│ Toolbar (slate-900/50)              │
│ ┌──────────────────────────────────┐│
│ │ Status | [Download] [Fullscreen] ││
│ └──────────────────────────────────┘│
├─────────────────────────────────────┤
│                                     │
│  Loading State (Spinner + Text)     │ Overlay when loading
│                                     │
├─────────────────────────────────────┤
│                                     │
│  PDF Iframe (white bg)              │ Main content
│                                     │
│  OR Error State (if failed)         │
│                                     │
├─────────────────────────────────────┤
│ ESC to exit fullscreen (on FS)      │ Helper text in fullscreen
└─────────────────────────────────────┘
```

## State Management

### Loading
- Shows spinner and "Loading PDF..." text
- Iframe opacity set to 0
- Loading state clears on iframe load event

### Error
- Shows error icon and message
- Provides troubleshooting suggestions
- Download button available as fallback
- Neither toolbar nor viewer shows PDF content

### Success
- Loading state removed
- Iframe opacity fades to 100%
- Full toolbar available
- Error state hidden

### Fullscreen
- Container fixed positioned at viewport dimensions
- Toolbar and PDF remain accessible
- ESC hint displayed in bottom-right
- Exits on ESC key or button click

## Styling

### Colors (Dark Theme)
- Background: `slate-950` / `slate-950/80`
- Cards: `slate-900` / `slate-900/50`
- Text: `slate-200` / `slate-400`
- Borders: `white/10`
- Accent: `cyan-400`
- Error: `red-400` / `red-500/10`

### Responsive Classes
- Desktop toolbar: Normal padding and font size
- Mobile toolbar: Adjusted padding and smaller icons
- Fullscreen: Expanded padding

### Animations
- Loading spinner: `animate-spin` with border-2 gradient
- Status pulse: `animate-pulse` on loading indicator
- Fade transition: `opacity-0` to `opacity-100` with `transition-opacity duration-300`
- Button hover: `hover:bg-white/10 hover:text-cyan-400`

## Browser Support

- **PDF Display**: Uses HTML5 `<iframe>` with PDF.js (browser native)
- **Fullscreen API**: Supported on modern browsers (Chrome, Firefox, Safari, Edge)
- **Download API**: Standard fetch/blob download in all modern browsers

### Fallbacks
- If PDF fails to load: Error state with download option
- If fullscreen unavailable: Console error logged, button still visible
- If download fails: Browser's native handling

## Integration Examples

### In LessonReadingPanel (Already Integrated)

```tsx
{mode === "pdf" && (
  <PDFViewer
    pdfUrl={pdfUrl}
    title={title}
    showDownloadButton
    showFullscreenButton
    height="65vh"
    minHeight="420px"
  />
)}
```

### Standalone Lesson Page

```tsx
export default async function LessonPage({ params }) {
  const lesson = await fetchLesson(params);
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1>{lesson.title}</h1>
      <PDFViewer
        pdfUrl={lesson.pdfUrl}
        title={lesson.title}
      />
      <LessonQuiz quiz={lesson.quiz} />
    </div>
  );
}
```

### With Cloudinary URLs

```tsx
const pdfUrl = "https://res.cloudinary.com/username/image/upload/v123/lms/pdfs/lesson.pdf";

<PDFViewer
  pdfUrl={pdfUrl}
  title="Complete Lesson with Images"
/>
```

## Performance Considerations

1. **Iframe Performance**
   - PDF viewer uses browser's native PDF.js
   - File is loaded once from CDN
   - Consider lazy loading if PDFs are large

2. **Loading States**
   - Loading overlay uses Backdrop blur (GPU accelerated)
   - Spinner animation is GPU accelerated
   - Fade transition uses `will-change` for performance

3. **Memory**
   - Single iframe instance per viewer
   - Loading state cleanup on unmount
   - Error state doesn't retain PDF data

## Accessibility Features

| Feature | Implementation |
|---------|-----------------|
| ARIA Labels | All buttons have `aria-label` |
| Focus Management | Keyboard navigation on buttons |
| Semantic HTML | Proper heading levels, form elements |
| Color Contrast | WCAG AA compliant (cyan on dark) |
| Loading Indicator | Text + visual spinner |
| Error Messages | Clear, actionable text |
| Keyboard Shortcuts | ESC to exit fullscreen |

## Common Issues & Solutions

### PDF Won't Load
- **Cause**: CORS issues, invalid URL, server error
- **Solution**: Use error fallback to download, check CloudinaryURL format

### Fullscreen Not Working
- **Cause**: Browser permissions, iframe sandbox restrictions
- **Solution**: Button still visible, error logged to console

### Download Creates Empty File
- **Cause**: PDF URL requires authentication or is temporary
- **Solution**: Verify URL is publicly accessible, signed URLs are valid

### Slow Loading on Mobile
- **Cause**: Large PDF file, slow network
- **Solution**: Optimize PDF file size, consider splitting into chapters

## Future Enhancements

Potential additions:
- Page navigation controls (prev/next page)
- Search within PDF
- Zoom controls
- Annotation support
- Print preview
- Thumbnail sidebar
