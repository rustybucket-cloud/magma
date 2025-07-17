# Volcanic Design System - LLM Implementation Guide

## Core Rules

### Color System (STRICT)
```
Primary Colors:
- Background: #1a1a1a (Obsidian Black)
- Foreground: #f5f5f5 (Ash White)  
- Accent: #ff6b35 (Magma Orange)

Usage Ratio: 70% black, 25% white, 5% orange
```

### Typography (REQUIRED)
```
Headlines: Space Grotesk (weights: 400, 500, 600, 700)
Body Text: Inter (weights: 400, 500, 600, 700)

Hierarchy:
- Hero: Space Grotesk Bold 48-72px
- Headers: Space Grotesk SemiBold 32-40px
- Titles: Space Grotesk Medium 20-24px
- Body: Inter Regular 16px
- Secondary: Inter Regular 14px
- Captions: Inter Regular 12px
```

### Corner Radius Scale
```
4px - XS (badges, small elements)
8px - SM (buttons, inputs) *most common*
12px - MD (cards, containers)
16px - LG (elevated cards)
20px - XL (major sections)
24px - 2XL (hero sections)
50% - Full (avatars, pills)
```

### Spacing Scale (8px base unit)
```
4px, 8px, 16px, 24px, 32px, 48px, 64px
Use only these values for margins, padding, gaps
```

## Component Templates

### Button (Primary)
```css
background: #ff6b35;
color: #f5f5f5;
padding: 12px 24px;
border-radius: 8px;
font-family: 'Inter';
font-weight: 600;
border: none;
transition: all 0.3s ease;

hover: {
  background: #e55a2b;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
}
```

### Button (Secondary)
```css
background: transparent;
color: #f5f5f5;
border: 1px solid rgba(245, 245, 245, 0.2);
padding: 12px 24px;
border-radius: 8px;
font-family: 'Inter';
font-weight: 500;

hover: {
  border-color: #ff6b35;
  color: #ff6b35;
  transform: translateY(-1px);
}
```

### Card
```css
background: #1a1a1a;
border: 1px solid rgba(245, 245, 245, 0.1);
border-radius: 12px;
padding: 24px;
transition: all 0.3s ease;

/* Add rock grain texture */
background-image: 
  radial-gradient(circle at 25% 25%, rgba(245, 245, 245, 0.02) 1px, transparent 1px),
  radial-gradient(circle at 75% 75%, rgba(245, 245, 245, 0.015) 0.5px, transparent 0.5px);
background-size: 50px 50px, 30px 30px;

hover: {
  transform: translateY(-3px);
  border-color: rgba(255, 107, 53, 0.2);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}
```

### Input Field
```css
background: rgba(245, 245, 245, 0.05);
border: 1px solid rgba(245, 245, 245, 0.2);
border-radius: 8px;
padding: 12px 16px;
color: #f5f5f5;
font-family: 'Inter';

focus: {
  border-color: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  background: rgba(245, 245, 245, 0.08);
  outline: none;
}

placeholder: {
  color: rgba(245, 245, 245, 0.5);
}
```

## Texture Implementation

### Background Texture (Rock Grain)
```css
background-image: 
  radial-gradient(circle at 25% 25%, rgba(245, 245, 245, 0.02) 1px, transparent 1px),
  radial-gradient(circle at 75% 75%, rgba(245, 245, 245, 0.015) 0.5px, transparent 0.5px);
background-size: 50px 50px, 30px 30px;
```

### Atmospheric Texture (Ash Cloud)
```css
background-image: 
  radial-gradient(ellipse at top, rgba(245, 245, 245, 0.08) 0%, transparent 50%),
  radial-gradient(ellipse at bottom left, rgba(245, 245, 245, 0.03) 0%, transparent 50%);
```

### Ember Glow Texture
```css
background-image: 
  radial-gradient(circle at 25% 25%, rgba(255, 107, 53, 0.03) 20px, transparent 20px),
  radial-gradient(circle at 75% 75%, rgba(255, 107, 53, 0.02) 15px, transparent 15px);
background-size: 100px 100px, 80px 80px;
```

## Shadow System
```css
/* Small */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

/* Medium */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

/* Large */
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);

/* Volcanic Glow */
box-shadow: 0 0 20px rgba(255, 107, 53, 0.2);
```

## Interaction States

### Hover Effects
```css
transform: translateY(-2px); /* buttons */
transform: translateY(-1px); /* secondary elements */
transform: translateY(-3px); /* cards */
```

### Focus States
```css
box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.3);
outline: none;
```

### Active States
```css
transform: translateY(0);
transform: scale(0.98);
```

## Layout Rules

### Page Structure
```
Background: #1a1a1a with rock grain texture
Max-width: 1200-1400px
Padding: 40px minimum on desktop, 20px mobile
```

### Grid System
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 24px; /* or 32px for larger sections */
```

### Responsive Breakpoints
```
Mobile: < 768px
Tablet: 768px - 1024px  
Desktop: > 1024px
```

## Brand Voice Implementation

### Headlines (Space Grotesk)
- Use for: Page titles, section headers, CTAs, navigation
- Convey: Bold, distinctive, confident energy
- Avoid: Long paragraphs, fine print

### Body Text (Inter)  
- Use for: Descriptions, form labels, content, captions
- Convey: Clear, readable, professional
- Maintain: 1.5-1.6 line height

## Accessibility Requirements

### Contrast Ratios
- #f5f5f5 on #1a1a1a = 15.8:1 (exceeds AAA)
- #ff6b35 on #1a1a1a = 5.2:1 (exceeds AA)
- Never use #ff6b35 as text background

### Interactive Elements
- Minimum touch target: 44px
- Visible focus indicators required
- Keyboard navigation support
- Screen reader compatible markup

## Forbidden Patterns

### Colors
- Never exceed 5% usage of #ff6b35
- Never use pure white (#ffffff)
- Never use #ff6b35 as background for text
- Never use more than these 3 colors

### Typography
- Never mix more than 2 font families
- Never use more than 3 font weights per interface
- Never use Space Grotesk for body text
- Never use Inter for hero headlines

### Layout
- Never use spacing outside the 8px scale
- Never combine more than 2 textures per element
- Never exceed 0.05 opacity for textures on text backgrounds
- Never use corner radius outside the defined scale

## Performance Rules
- Texture opacity must stay below 0.05
- Animations must be 60fps minimum
- Use CSS transforms for animations, not position changes
- Respect prefers-reduced-motion media query
- Test on mobile devices

## Quick Reference

### Most Common Components
```
Button: 8px radius, Inter 600, #ff6b35 background
Card: 12px radius, rock grain texture, hover lift
Input: 8px radius, focus glow, placeholder opacity 0.5
Text: Inter regular 16px, #f5f5f5 color
Heading: Space Grotesk 600, #ff6b35 or #f5f5f5
```

### Most Common Spacing
```
Element padding: 12px, 16px, 24px
Section gaps: 32px, 48px
Card spacing: 24px padding, 24px gaps
Button padding: 12px 24px
```

### Most Common Colors
```
Backgrounds: #1a1a1a
Text: #f5f5f5
Accent/CTA: #ff6b35
Borders: rgba(245, 245, 245, 0.1) to rgba(245, 245, 245, 0.2)
```

This guide ensures consistent volcanic design system implementation across all LLM-generated interfaces.
