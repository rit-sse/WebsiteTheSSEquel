#!/usr/bin/env python3
"""Generate a polished PDF from the website color palette markdown."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import colorsys, math, os

# Output path
OUTPUT = os.path.join(os.path.dirname(__file__), "pdf", "website-color-palette.pdf")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

def hsl_to_hex(h, s, l):
    """Convert HSL (h in degrees, s and l as percentages) to hex."""
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l / 100.0, s / 100.0)
    return "#{:02X}{:02X}{:02X}".format(int(r * 255), int(g * 255), int(b * 255))

def text_color_for_bg(hex_color):
    """Return black or white depending on background luminance."""
    c = HexColor(hex_color)
    lum = 0.299 * c.red + 0.587 * c.green + 0.114 * c.blue
    return "#000000" if lum > 0.55 else "#FFFFFF"

# --- Color Data ---

SURFACES_LIGHT = [
    ("surface-0", 220, 52, 96, "Page background (start)"),
    ("surface-1", 222, 58, 93, "Page background (end)"),
    ("surface-2", 218, 50, 89, "Primary cards"),
    ("surface-3", 216, 42, 84, "Inner cards"),
    ("surface-4", 214, 36, 79, "Emphasis containers"),
]

SURFACES_DARK = [
    ("surface-0", 222, 34, 14, "Page background"),
    ("surface-1", 220, 40, 21, "Secondary sections"),
    ("surface-2", 217, 46, 29, "Primary cards"),
    ("surface-3", 213, 52, 38, "Inner cards"),
    ("surface-4", 208, 58, 48, "Emphasis containers"),
]

CAT_LIGHT = [
    ("chart-1", 211, 36, 48, "Blue"),
    ("chart-2", 25, 75, 38, "Deep Amber"),
    ("chart-3", 359, 65, 48, "Crimson"),
    ("chart-4", 175, 40, 40, "Deep Teal"),
    ("chart-5", 113, 40, 36, "Forest Green"),
    ("chart-6", 42, 70, 38, "Dark Gold"),
    ("chart-7", 317, 30, 46, "Plum"),
    ("chart-8", 354, 60, 52, "Rose"),
    ("chart-9", 22, 30, 40, "Sienna"),
    ("chart-10", 17, 12, 52, "Warm Gray"),
]

CAT_DARK = [
    ("chart-1", 211, 36, 48, "Blue"),
    ("chart-2", 30, 88, 56, "Orange"),
    ("chart-3", 359, 70, 61, "Red"),
    ("chart-4", 175, 31, 59, "Teal"),
    ("chart-5", 113, 34, 47, "Green"),
    ("chart-6", 47, 82, 61, "Yellow"),
    ("chart-7", 317, 25, 58, "Purple"),
    ("chart-8", 354, 100, 81, "Pink"),
    ("chart-9", 22, 24, 49, "Brown"),
    ("chart-10", 17, 9, 70, "Gray"),
]

ACCENTS = [
    ("accent-1", 41, 75, 84, "Soft highlight"),
    ("accent-2", 120, 43, 87, "Pastel mint"),
    ("accent-3", 38, 80, 57, "Warm CTA"),
    ("accent-4", 213, 65, 58, "Playful blue"),
    ("accent-5", 15, 57, 58, "Sunset coral"),
    ("accent-6", 321, 28, 51, "Badge accent"),
]

TEXT_HIERARCHY = [
    ("Page headings (h1)", "text-foreground", "text-foreground"),
    ("Section headings (h2)", "chart-7 (plum)", "chart-8 (pink)"),
    ("CTA headings (h3)", "chart-2 (deep amber)", "chart-8 (pink)"),
    ("Dancing hero text", "chart-2 (deep amber)", "chart-2 (orange)"),
    ("Labels / metadata", "chart-2 (deep amber)", "chart-8 (pink)"),
    ("Links", "chart-4 (deep teal)", "chart-4 (teal)"),
]

BUTTONS = [
    ("Default", "chart-2", "white", "Primary action"),
    ("Reverse", "chart-7", "white", "Secondary action"),
    ("Accent", "chart-5", "white", "Tertiary / success"),
    ("Outline", "surface-2", "foreground", "Neutral"),
    ("Destructive", "destructive", "white", "Dangerous"),
]

# --- Build PDF ---

doc = SimpleDocTemplate(OUTPUT, pagesize=letter,
                        leftMargin=0.6*inch, rightMargin=0.6*inch,
                        topMargin=0.6*inch, bottomMargin=0.6*inch)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("Title2", parent=styles["Title"], fontSize=22, spaceAfter=4,
                          textColor=HexColor("#1B303F")))
styles.add(ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=10,
                          textColor=HexColor("#5289AF"), spaceAfter=16))
styles.add(ParagraphStyle("Section", parent=styles["Heading2"], fontSize=14,
                          textColor=HexColor("#345970"), spaceBefore=18, spaceAfter=8))
styles.add(ParagraphStyle("SubSection", parent=styles["Heading3"], fontSize=11,
                          textColor=HexColor("#426E8C"), spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle("Body", parent=styles["Normal"], fontSize=9,
                          textColor=HexColor("#2D4458"), leading=13))
styles.add(ParagraphStyle("CellText", parent=styles["Normal"], fontSize=8,
                          textColor=HexColor("#1B303F"), leading=10))
styles.add(ParagraphStyle("CellTextWhite", parent=styles["Normal"], fontSize=8,
                          textColor=HexColor("#FFFFFF"), leading=10))

story = []

# Title
story.append(Paragraph("Website Color Palette", styles["Title2"]))
story.append(Paragraph("SSE — Logo-first, Radix-inspired, Neobrutalist", styles["Subtitle"]))
story.append(Spacer(1, 8))

def make_swatch_table(title, items, col_widths=None):
    """Create a color swatch table."""
    header = ["Token", "Swatch", "Hex", "HSL", "Role"]
    rows = [header]
    swatch_colors = []
    
    for item in items:
        token, h, s, l, role = item
        hex_val = hsl_to_hex(h, s, l)
        hsl_str = f"{h} {s}% {l}%"
        swatch_colors.append(hex_val)
        tc = text_color_for_bg(hex_val)
        rows.append([token, "", hex_val, hsl_str, role])
    
    if col_widths is None:
        col_widths = [1.1*inch, 0.6*inch, 0.85*inch, 1.0*inch, 2.8*inch]
    
    t = Table(rows, colWidths=col_widths, rowHeights=[18] + [22]*len(items))
    
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#E8EDF4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#345970")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#C7D1E2")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]
    
    for i, hex_val in enumerate(swatch_colors):
        row = i + 1
        style_cmds.append(("BACKGROUND", (1, row), (1, row), HexColor(hex_val)))
        tc = text_color_for_bg(hex_val)
        style_cmds.append(("TEXTCOLOR", (1, row), (1, row), HexColor(tc)))
    
    t.setStyle(TableStyle(style_cmds))
    
    elements = [
        Paragraph(title, styles["Section"]),
        t,
        Spacer(1, 6),
    ]
    return KeepTogether(elements)

# Surface tables
story.append(make_swatch_table("Light Theme — Surface System", SURFACES_LIGHT))
story.append(make_swatch_table("Dark Theme — Surface System", SURFACES_DARK))

# Categorical
story.append(make_swatch_table("Categorical Colors — Light Mode (Deepened for Contrast)", CAT_LIGHT))
story.append(make_swatch_table("Categorical Colors — Dark Mode (Vibrant Tableau 10)", CAT_DARK))

# Accents
story.append(make_swatch_table("Accent Colors", ACCENTS))

# Text hierarchy table
story.append(Paragraph("Text Hierarchy (Categorical)", styles["Section"]))
th_rows = [["Role", "Light Mode", "Dark Mode"]]
for role, light, dark in TEXT_HIERARCHY:
    th_rows.append([role, light, dark])
th_table = Table(th_rows, colWidths=[2.2*inch, 2.2*inch, 2.2*inch],
                 rowHeights=[18] + [20]*len(TEXT_HIERARCHY))
th_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#E8EDF4")),
    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#345970")),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("FONTSIZE", (0, 0), (-1, 0), 7),
    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#C7D1E2")),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
]))
story.append(th_table)
story.append(Spacer(1, 6))

# Buttons table
story.append(Paragraph("Button Variants", styles["Section"]))
btn_rows = [["Variant", "Background", "Text", "Purpose"]]
for variant, bg, text, purpose in BUTTONS:
    btn_rows.append([variant, bg, text, purpose])
btn_table = Table(btn_rows, colWidths=[1.3*inch, 1.5*inch, 1.2*inch, 2.4*inch],
                  rowHeights=[18] + [20]*len(BUTTONS))
btn_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#E8EDF4")),
    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#345970")),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("FONTSIZE", (0, 0), (-1, 0), 7),
    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#C7D1E2")),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
]))
story.append(btn_table)
story.append(Spacer(1, 6))

# Border strategy
story.append(Paragraph("Border Strategy", styles["Section"]))
story.append(Paragraph(
    "Borders use <b>foreground-based opacity</b> rather than <b>border</b> color, "
    "because the border CSS variable is the same hue as the surfaces and becomes invisible. "
    "Using foreground (white in dark, near-black in light) at 12–20% opacity guarantees visible edges.",
    styles["Body"]))
story.append(Spacer(1, 8))

# Accessibility
story.append(Paragraph("Accessibility Notes", styles["Section"]))
story.append(Paragraph(
    "• Light mode categorical colors are deliberately darker than standard Tableau 10 to "
    "maintain WCAG AA contrast on pale blue-gray backgrounds.<br/>"
    "• Dark mode retains the original vibrant Tableau 10 which naturally pop on dark surfaces.<br/>"
    "• Depth-1 neo cards use full black borders for neobrutalist statement.<br/>"
    "• All text-on-background pairs target at minimum WCAG AA (4.5:1) for normal text.",
    styles["Body"]))

# Build
doc.build(story)
print(f"PDF generated: {OUTPUT}")
