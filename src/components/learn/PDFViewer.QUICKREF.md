# PDFViewer Component - Quick Reference

## 📋 File Location
`src/components/learn/PDFViewer.tsx`

## 🚀 Quick Start

```tsx
import PDFViewer from "@/src/components/learn/PDFViewer";

<PDFViewer 
  pdfUrl="https://cdn.example.com/lesson.pdf"
  title="Lesson Title"
/>
```

## ✨ Features at a Glance

| Feature | Status | Details |
|---------|--------|---------|
| **Responsive Design** | ✅ | Auto-scales to container, configurable heights |
| **Loading State** | ✅ | Spinner + status text with fade transition |
| **Error Handling** | ✅ | Graceful failure with troubleshooting tips |
| **Download Button** | ✅ | One-click download with auto-generated filename |
| **Fullscreen Mode** | ✅ | Toggle button + ESC key support |
| **Dark Theme** | ✅ | Slate-950/cyan-400 color scheme |
| **Accessibility** | ✅ | ARIA labels, semantic HTML, keyboard nav |
| **Mobile Friendly** | ✅ | Touch-ready, adaptive sizing |

## 🎯 Core Props

### Required
```tsx
pdfUrl: string           // URL to PDF file
title: string            // Lesson title (download filename + labels)
```

### Optional
```tsx
showDownloadButton?: boolean    // Default: true
showFullscreenButton?: boolean  // Default: true
height?: string                 // Default: "65vh"
minHeight?: string              // Default: "420px"
```

## 🎨 Component Styles

- **Background**: `slate-950`
- **Cards/Borders**: `slate-900`, `white/10`
- **Text**: `slate-200`, `slate-300`, `slate-400`
- **Accent**: `cyan-400`
- **Error**: `red-400`
- **Radius**: `rounded-2xl` (normal), `rounded-none` (fullscreen)

## 📱 Responsive Behavior

| Screen | Height | Fullscreen | Download |
|--------|--------|-----------|----------|
| Mobile | 50-65vh | Hidden* | Visible |
| Tablet | 65vh | Visible | Visible |
| Desktop | 65-70vh | Visible | Visible |

*Recommended to hide on mobile (use `showFullscreenButton={!isMobile}`)

## 🔄 State Flow

```
Initial → Loading (Spinner) → Success (PDF Visible)
                            → Error (Fallback UI)
```

### Loading State
- Overlay with spinner
- Status: "Loading PDF..."
- Iframe hidden (`opacity-0`)

### Error State
- Icon + "Unable to Load PDF"
- Troubleshooting suggestions
- Download button available
- Iframe hidden

### Success State
- Loading overlay removed
- Iframe visible (`opacity-100`)
- Full toolbar available

## 🎮 User Interactions

| Action | Result |
|--------|--------|
| Click Download | Opens file dialog with `{title}.pdf` |
| Click Fullscreen | Expands to viewport size |
| Press ESC (fullscreen) | Exits fullscreen mode |
| View loads | Spinner disappears, PDF visible |
| PDF fails | Error state with suggestions |

## 📐 Layout Examples

### Full Width
```tsx
<PDFViewer pdfUrl={url} title={title} />
```

### In Container
```tsx
<div className="max-w-4xl mx-auto">
  <PDFViewer pdfUrl={url} title={title} />
</div>
```

### Split View (PDF + Text)
```tsx
<div className="grid grid-cols-2 gap-4">
  <PDFViewer 
    pdfUrl={url} 
    title={title}
    showFullscreenButton={false}
  />
  <TextContent />
</div>
```

### In Sidebar
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-2">
    <PDFViewer pdfUrl={url} title={title} />
  </div>
  <aside>
    <Sidebar />
  </aside>
</div>
```

## 🔗 Integration Points

### Already Integrated
- ✅ `LessonReadingPanel.tsx` - Multi-mode reading interface
- ✅ `app/lms/[subject]/[class]/[lesson]/page.tsx` - Lesson viewer

### Can Be Used In
- Lesson preview modals
- Homework submission viewers
- Study material archives
- Reference document library
- Quiz instructions
- Course syllabus viewer

## 🐛 Error Scenarios

| Problem | Message | Solution |
|---------|---------|----------|
| Bad URL | "The PDF could not be loaded" | Verify CloudinaryURL format |
| Network error | Refresh suggestion | Check internet connection |
| CORS blocked | Download fallback shown | Use CORS-enabled CDN |
| Invalid file | PDF won't render | Check file is valid PDF |

## ⚡ Performance Tips

1. **Use CDN URLs** (e.g., Cloudinary)
   ```tsx
   pdfUrl="https://res.cloudinary.com/.../lms/pdfs/lesson.pdf"
   ```

2. **Lazy load for large files**
   ```tsx
   <Suspense fallback={<Skeleton />}>
     <PDFViewer pdfUrl={url} title={title} />
   </Suspense>
   ```

3. **Optimize PDF size** (<5MB recommended)
   ```
   - Use PDF compression tools
   - Reduce image quality
   - Remove unnecessary metadata
   ```

4. **Caching headers** on CDN
   ```
   Cache-Control: public, max-age=31536000
   ```

## 🎓 LMS Integration Checklist

- [ ] PDFs uploaded to Cloudinary
- [ ] URLs stored in lesson documents
- [ ] PDFViewer imported in lesson page
- [ ] Dark theme tested
- [ ] Mobile responsive verified
- [ ] Error states tested
- [ ] Download functionality working
- [ ] Fullscreen tested on target devices
- [ ] Accessibility tested with keyboard
- [ ] Analytics tracking (optional)

## 📊 Toolbar Layout

```
┌──────────────────────────────────────────────────┐
│ Loading PDF...  [•]    [Download] [Fullscreen]  │
└──────────────────────────────────────────────────┘
    ↑                      ↑          ↑
  Status                 Tools     Actions
```

## 🎯 Best Practices

✅ **DO:**
- Use HTTPS URLs
- Compress PDFs before upload
- Provide meaningful titles
- Test on mobile devices
- Use in lesson reading panels
- Set `showFullscreenButton={false}` in split views

❌ **DON'T:**
- Use data URIs (too large)
- Load 20MB+ PDFs
- Make title generic ("File", "PDF")
- Embed password-protected PDFs
- Use in lightbox without height config

## 🔑 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate toolbar buttons |
| Enter | Activate focused button |
| Space | Activate button (if focused) |
| ESC | Exit fullscreen mode |

## 📱 Mobile Optimization

```tsx
const [isMobile, setIsMobile] = useState(false);

<PDFViewer
  pdfUrl={url}
  title={title}
  showFullscreenButton={!isMobile}
  height={isMobile ? "50vh" : "65vh"}
  minHeight={isMobile ? "300px" : "420px"}
/>
```

## 🧪 Testing

### Test Cases
1. ✅ PDF loads successfully
2. ✅ Download button works
3. ✅ Fullscreen toggles
4. ✅ Error handling (bad URL)
5. ✅ Loading state appears
6. ✅ Keyboard navigation
7. ✅ Mobile responsive
8. ✅ Dark theme visible

### Example Test
```tsx
const { render, screen } = require("@testing-library/react");
import PDFViewer from "./PDFViewer";

test("renders loading state", () => {
  render(
    <PDFViewer pdfUrl="https://example.com/test.pdf" title="Test" />
  );
  expect(screen.getByText("Loading PDF...")).toBeInTheDocument();
});
```

## 📚 Related Components

- `LessonReadingPanel.tsx` - Multi-mode reader
- `LessonContentRenderer.tsx` - Text rendering
- `MarkLessonCompleteButton.tsx` - Progress tracking
- `LessonQuizModule.tsx` - Assessment
- `LessonViewerLayout.tsx` - Full lesson page

## 🚦 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile browsers (limited fullscreen)

## 💡 Common Questions

**Q: Can I customize colors?**
A: Modify Tailwind classes in PDFViewer.tsx or wrap with CSS module

**Q: Does it support annotations?**
A: Not built-in, but can integrate with PDF.js library

**Q: Can users edit PDFs?**
A: No, read-only viewer only

**Q: How large can PDFs be?**
A: Recommend <10MB for smooth loading

**Q: Does it work offline?**
A: No, requires internet to fetch PDF

## 📞 Support Resources

- README: `PDFViewer.README.md`
- Examples: `PDFViewer.examples.tsx`
- Integration: `LessonReadingPanel.tsx`
- Lesson Page: `app/lms/[subject]/[class]/[lesson]/page.tsx`
