# Lumina - Final Design Specification ✅

## 🎯 Landing Page - Exact Match to React Component

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│            Lumina                   │ ← 3.75rem (text-6xl)
│   AI assistant for academic...     │ ← 1.25rem (text-xl)
│                                     │
│   ┌─────────┐  ┌─────────┐        │
│   │    ✨   │  │    📄   │        │
│   │  Ask    │  │  Help   │        │
│   │ Anything│  │  Paper  │        │
│   └─────────┘  └─────────┘        │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

#### Container
- **Background**: `#f9fafb` (bg-gray-50)
- **Min height**: 100vh
- **Centered**: Flexbox center
- **Padding**: 1.5rem (p-6)

#### Content Wrapper
- **Max width**: 48rem (max-w-3xl)
- **Full width**: 100%

#### Header Section
**Title "Lumina"**
- Font size: `3.75rem` (text-6xl)
- Font weight: `700` (font-bold)
- Color: `#111827` (text-gray-900)
- Letter spacing: `-0.025em` (tracking-tight)
- Margin bottom: `1rem` (mb-4)
- Text align: center

**Subtitle**
- Font size: `1.25rem` (text-xl)
- Color: `#4b5563` (text-gray-600)
- Text: "AI assistant for academic researchers"
- Margin bottom: `4rem` (mb-16)
- Text align: center

#### Cards Grid
- **Layout**: CSS Grid
- **Columns**: 2 on desktop (md:grid-cols-2)
- **Gap**: `1rem` (gap-4)
- **Max width**: 42rem (max-w-2xl)
- **Centered**: margin auto

#### Individual Cards
**Base Styles**
- Background: `#ffffff` (bg-white)
- Border: `1px solid #e5e7eb` (border-gray-200)
- Border radius: `0.75rem` (rounded-xl)
- Padding: `2rem` (p-8)
- Text align: left
- Transition: all 0.2s (duration-200)

**Hover Styles**
- Background: `#f9fafb` (hover:bg-gray-50)
- Border: `#d1d5db` (hover:border-gray-300)
- Shadow: Large shadow (hover:shadow-lg)

**Icon**
- Size: `2rem` (w-8 h-8)
- Color: `#2563eb` (text-blue-600)
- Margin bottom: `1rem` (mb-4)
- Icons: ✨ (Sparkles) and 📄 (FileText)

**Title**
- Font size: `1.25rem` (text-xl)
- Font weight: `600` (font-semibold)
- Color: `#111827` (text-gray-900)
- Margin bottom: `0.5rem` (mb-2)

**Description**
- Font size: `0.875rem` (text-sm)
- Color: `#4b5563` (text-gray-600)

### Card Content

**Card 1: Ask Anything**
- Icon: ✨ Sparkles
- Title: "Ask Anything"
- Description: "Get instant answers to your research questions"

**Card 2: Help Me With My Paper**
- Icon: 📄 FileText
- Title: "Help Me With My Paper"
- Description: "Writing, editing, and citation assistance"

### Responsive Behavior
- **Mobile**: Cards stack vertically (1 column)
- **Desktop**: Cards side by side (2 columns)
- **Breakpoint**: 768px (md)

## 💬 Chat Page

### Back Button
- **Position**: Fixed, top-right (1.5rem from edges)
- **Style**: White with gray border
- **Hover**: Light gray background

### Paper Details Panel
- **Width**: 280px
- **Background**: Light gray (#f9fafb)
- **Cards**: White with blue labels (#2563eb)

### Colors
- **Primary**: Blue (#2563eb)
- **Text**: Dark gray (#111827)
- **Borders**: Light gray (#e5e7eb)

---

## ✅ Implementation Status

- ✅ Landing page matches React component exactly
- ✅ Gray background (#f9fafb)
- ✅ Large centered heading
- ✅ 2-column grid layout
- ✅ White cards with hover effects
- ✅ Blue icons (✨ and 📄)
- ✅ Proper typography and spacing
- ✅ Responsive design
- ✅ Back button on top-right
- ✅ Clean, minimal aesthetic

**Status**: Design is complete and matches specification! 🎯
