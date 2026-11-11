from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path(__file__).resolve().parents[1] / "output" / "pdf" / "reHEARse-word-studio-participant-guide.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

PAPER = colors.HexColor("#F3F0E8")
SURFACE = colors.HexColor("#FFFDF7")
INK = colors.HexColor("#17202A")
MUTED = colors.HexColor("#62706F")
BLUE = colors.HexColor("#3164F4")
LEAF = colors.HexColor("#1F7A5A")
CLAY = colors.HexColor("#B25F3F")
LINE = colors.HexColor("#D9D7CF")
PALE_GREEN = colors.HexColor("#E8F4EB")
PALE_BLUE = colors.HexColor("#EAF0FF")
PALE_CLAY = colors.HexColor("#FBEAE3")


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(filename, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=17 * mm, bottomMargin=17 * mm)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        # Intentionally no onPage callback: the participant guide has no header or footer.
        self.addPageTemplates([PageTemplate(id="body", frames=[frame])])


class ProcessDiagram(Flowable):
    def __init__(self, width=165 * mm, height=49 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setStrokeColor(LINE)
        c.setLineWidth(0.8)
        c.setFillColor(SURFACE)
        c.roundRect(0, 0, w, h, 10, fill=1, stroke=1)
        labels = [("1", "Open", "Word desk"), ("2", "Read", "Context"), ("3", "Choose", "Word class"), ("4", "Continue", "Next card")]
        gap = 8 * mm
        box_w = (w - 2 * gap - 4 * 31 * mm) / 3
        box_w = 31 * mm
        x = 8 * mm
        cy = h / 2
        for index, (number, title, detail) in enumerate(labels):
            c.setFillColor(PALE_GREEN if index in (0, 3) else PALE_BLUE)
            c.setStrokeColor(colors.HexColor("#C8D8CE") if index in (0, 3) else colors.HexColor("#C7D3F4"))
            c.roundRect(x, cy - 13 * mm, box_w, 26 * mm, 7, fill=1, stroke=1)
            c.setFillColor(LEAF if index in (0, 3) else BLUE)
            c.circle(x + 8 * mm, cy + 6 * mm, 3.5 * mm, fill=1, stroke=0)
            c.setFillColor(SURFACE)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(x + 8 * mm, cy + 4.2 * mm, number)
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(x + 14 * mm, cy + 4.5 * mm, title)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7)
            c.drawString(x + 14 * mm, cy - 2.5 * mm, detail)
            if index < len(labels) - 1:
                line_x = x + box_w + 2.3 * mm
                c.setStrokeColor(MUTED)
                c.setLineWidth(1.1)
                c.line(line_x, cy, line_x + gap - 4.6 * mm, cy)
                c.line(line_x + gap - 4.6 * mm, cy, line_x + gap - 6.3 * mm, cy + 1.5 * mm)
                c.line(line_x + gap - 4.6 * mm, cy, line_x + gap - 6.3 * mm, cy - 1.5 * mm)
            x += box_w + gap


class CardAnatomy(Flowable):
    def __init__(self, width=165 * mm, height=76 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        left_w = w * 0.56
        c.setStrokeColor(LINE)
        c.setFillColor(colors.HexColor("#E7F2E9"))
        c.roundRect(0, 0, left_w, h, 12, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#F8F6F0"))
        c.setStrokeColor(LINE)
        c.roundRect(left_w + 7 * mm, 0, w - left_w - 7 * mm, h, 12, fill=1, stroke=1)
        c.setFillColor(LEAF)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(8 * mm, h - 11 * mm, "WORD CARD")
        c.setFillColor(INK)
        c.setFont("Times-Roman", 27)
        c.drawCentredString(left_w / 2, h / 2 + 6 * mm, "supervision")
        c.setFont("Helvetica", 7.3)
        sentence = "The supervisor provided close supervision during the experiment."
        prefix = "The supervisor provided close "
        target = "supervision"
        suffix = " during the experiment."
        total = c.stringWidth(sentence, "Helvetica", 7.3)
        start = (left_w - total) / 2
        c.setFillColor(MUTED)
        c.drawString(start, h / 2 - 8 * mm, prefix)
        start += c.stringWidth(prefix, "Helvetica", 7.3)
        c.setFillColor(LEAF)
        c.setFont("Helvetica-Bold", 7.3)
        c.drawString(start, h / 2 - 8 * mm, target)
        start += c.stringWidth(target, "Helvetica-Bold", 7.3)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.3)
        c.drawString(start, h / 2 - 8 * mm, suffix)
        c.setFont("Helvetica", 7)
        c.drawCentredString(left_w / 2, h / 2 - 17 * mm, "The highlighted word is read in context.")
        c.setFillColor(LEAF)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(left_w + 14 * mm, h - 11 * mm, "YOUR RESPONSE")
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(left_w + 14 * mm, h - 23 * mm, "Which role does it play?")
        options = [("Noun", LEAF), ("Verb", BLUE), ("Adjective", MUTED), ("Adverb", MUTED)]
        y = h - 36 * mm
        for index, (label, tone) in enumerate(options):
            row = index // 2
            col = index % 2
            x = left_w + 14 * mm + col * 31 * mm
            yy = y - row * 14 * mm
            c.setFillColor(SURFACE)
            c.setStrokeColor(colors.HexColor("#C8D6CD"))
            c.roundRect(x, yy, 27 * mm, 10 * mm, 5, fill=1, stroke=1)
            c.setFillColor(tone)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + 3 * mm, yy + 5.9 * mm, label)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawString(left_w + 14 * mm, 8 * mm, "Select one role for this sentence.")


class FeedbackDiagram(Flowable):
    def __init__(self, width=165 * mm, height=56 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        panels = [(0, PALE_GREEN, LEAF, "Captured", "The role matches this use."), (w / 2 + 4 * mm, PALE_CLAY, CLAY, "Reconsider", "The role appears again later.")]
        for x, fill, tone, title, copy in panels:
            c.setFillColor(fill)
            c.setStrokeColor(colors.HexColor("#D1DDD4"))
            c.roundRect(x, 0, w / 2 - 6 * mm, h, 10, fill=1, stroke=1)
            c.setFillColor(tone)
            c.circle(x + 11 * mm, h - 13 * mm, 5 * mm, fill=1, stroke=0)
            c.setFillColor(SURFACE)
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(x + 11 * mm, h - 16 * mm, "✓" if title == "Captured" else "↻")
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(x + 21 * mm, h - 16 * mm, title)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(x + 10 * mm, h - 29 * mm, copy)
            c.drawString(x + 10 * mm, h - 39 * mm, "The next card begins with clean controls.")


class QueueDiagram(Flowable):
    def __init__(self, width=165 * mm, height=58 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(SURFACE)
        c.setStrokeColor(LINE)
        c.roundRect(0, 0, w, h, 10, fill=1, stroke=1)
        nodes = [(22 * mm, h / 2, PALE_BLUE, BLUE, "New", "first appearance"), (w / 2, h / 2, PALE_GREEN, LEAF, "Review", "spaced return"), (w - 22 * mm, h / 2, PALE_CLAY, CLAY, "Revisit", "after a miss")]
        for x, y, fill, tone, title, copy in nodes:
            c.setFillColor(fill)
            c.setStrokeColor(colors.HexColor("#CDD9D3"))
            c.circle(x, y, 13 * mm, fill=1, stroke=1)
            c.setFillColor(tone)
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(x, y + 2 * mm, title)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 6.7)
            c.drawCentredString(x, y - 5 * mm, copy)
        c.setStrokeColor(MUTED)
        c.setLineWidth(1.2)
        for start, end in [(35 * mm, w / 2 - 14 * mm), (w / 2 + 14 * mm, w - 35 * mm)]:
            c.line(start, h / 2, end, h / 2)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(w / 2, 8 * mm, "A missed or skipped card is scheduled for a later encounter.")


class StatsDiagram(Flowable):
    def __init__(self, width=165 * mm, height=44 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(colors.HexColor("#EAF3EC"))
        c.setStrokeColor(colors.HexColor("#CEDDD3"))
        c.roundRect(0, 0, w, h, 10, fill=1, stroke=1)
        entries = [("12", "of 20 today"), ("4", "day streak"), ("8", "new"), ("4", "revisited")]
        cell = w / len(entries)
        for i, (value, label) in enumerate(entries):
            if i:
                c.setStrokeColor(colors.HexColor("#D0DED5"))
                c.line(i * cell, 10 * mm, i * cell, h - 10 * mm)
            c.setFillColor(INK)
            c.setFont("Times-Roman", 20)
            c.drawCentredString(i * cell + cell / 2, h / 2 + 2 * mm, value)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7)
            c.drawCentredString(i * cell + cell / 2, h / 2 - 7 * mm, label)


def styles():
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=LEAF, tracking=1.5, spaceAfter=7),
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Times-Roman", fontSize=31, leading=32, textColor=INK, alignment=TA_LEFT, spaceAfter=10),
        "subtitle": ParagraphStyle("subtitle", parent=base["BodyText"], fontName="Helvetica", fontSize=12, leading=18, textColor=MUTED, spaceAfter=10),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Times-Roman", fontSize=22, leading=25, textColor=INK, spaceBefore=3, spaceAfter=10),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=INK, spaceBefore=5, spaceAfter=5),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=10.3, leading=16, textColor=INK, spaceAfter=8),
        "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Helvetica", fontSize=8.8, leading=13, textColor=MUTED, spaceAfter=6),
        "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Helvetica", fontSize=9.2, leading=14, textColor=INK, leftIndent=10, rightIndent=10, spaceAfter=3),
        "caption": ParagraphStyle("caption", parent=base["BodyText"], fontName="Helvetica-Oblique", fontSize=8, leading=11, textColor=MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=7),
        "step": ParagraphStyle("step", parent=base["BodyText"], fontName="Helvetica", fontSize=9.8, leading=15, textColor=INK, leftIndent=18, firstLineIndent=-18, spaceAfter=6),
    }


def callout(text, tone=PALE_GREEN):
    t = Table([[Paragraph(text, styles()["callout"])]], colWidths=[165 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), tone), ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("ROUNDEDCORNERS", [8, 8, 8, 8]), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    return t


def build():
    s = styles()
    story = []

    story += [Paragraph("WORD STUDIO", s["kicker"]), Paragraph("Using the contextual flashcards", s["title"]), Paragraph("A concise guide to the assigned vocabulary activity", s["subtitle"]), Spacer(1, 4 * mm), ProcessDiagram(), Paragraph("The activity presents one word in a sentence. Your task is to identify the grammatical role used in that sentence, then continue to the next card.", s["body"]), callout("The activity is designed for repeated, context-sensitive practice. It does not produce a grade or proficiency judgment.", PALE_BLUE), Spacer(1, 3 * mm), Paragraph("The interface is intentionally compact: the word, its sentence, the four role choices, and the next action remain close together so that attention stays on the language.", s["body"])]

    story += [PageBreak(), Paragraph("1. OPEN THE ASSIGNED SET", s["kicker"]), Paragraph("Start from the Word desk", s["h2"]), Paragraph("Sign in with the account used by your teacher. The Word desk lists the vocabulary sets assigned to that account. Open the set that your teacher named.", s["body"]), Paragraph("If your teacher gives you a short access code, enter it in the access-code panel and select <b>Add word set</b>. The assignment then appears on your Word desk.", s["body"]), callout("An access code is tied to the signed-in account that claims it. If the set does not appear, return to the Word desk and ask your teacher to check the code and the account you used.", PALE_CLAY), Spacer(1, 3 * mm), Paragraph("The activity opens in a focused panel. You can close the panel and return to the Word desk without losing the saved state of the assignment.", s["body"]), _mock_access_flow(), Paragraph("Figure 1. Access follows the signed-in account and the teacher's assignment.", s["caption"])]

    story += [PageBreak(), Paragraph("2. READ THE CARD", s["kicker"]), Paragraph("Use the sentence as evidence", s["h2"]), Paragraph("Each card shows a headword and an original contextual sentence. The target word is highlighted in the sentence. Read the complete sentence before choosing a role.", s["body"]), CardAnatomy(), Paragraph("Figure 2. The card combines the word, its context, and the four available grammatical roles.", s["caption"]), Paragraph("The sentence is not decoration. It determines the answer for that card. A word can function as more than one part of speech in English, but the task concerns the function used in the displayed sentence.", s["body"]), callout("Read the words around the highlighted item. Ask what the word names, describes, or expresses in this sentence.", PALE_GREEN)]

    story += [PageBreak(), Paragraph("3. CHOOSE A WORD CLASS", s["kicker"]), Paragraph("Select one role", s["h2"]), Paragraph("Choose one of the four role buttons: Noun, Verb, Adjective, or Adverb. Your choice is checked immediately; there is no separate check button.", s["body"]), FeedbackDiagram(), Paragraph("Figure 3. Feedback is immediate and the next card begins with clean controls.", s["caption"]), Paragraph("When the response is correct, the card is recorded as a completed encounter. When it is incorrect, the interface identifies the role used in the sentence and schedules the word for a later encounter. The later card is a new response opportunity rather than a continuation of the old selection.", s["body"]), Paragraph("A skipped card is also scheduled for a later encounter. Use <b>Not sure - skip for now</b> when you do not have enough evidence to choose responsibly.", s["body"])]

    story += [PageBreak(), Paragraph("4. CONTINUE THROUGH THE SET", s["kicker"]), Paragraph("Let the sequence distribute review", s["h2"]), Paragraph("Select <b>Next word</b> after feedback. The activity separates recently seen words from new ones, and it returns a missed or skipped card after several different words.", s["body"]), QueueDiagram(), Paragraph("Figure 4. Cards move between new exposure, spaced review, and later revisit.", s["caption"]), Paragraph("The full deck remains assigned to you. The daily target is a bounded practice unit, not the size of the deck. When the current set is complete, choose <b>Continue with more</b> to open the next unit from the same assignment.", s["body"]), callout("Do not try to memorise a fixed order. The order is controlled so that recently seen words are not presented repeatedly in immediate succession.", PALE_BLUE)]

    story += [PageBreak(), Paragraph("5. READ THE PRACTICE INDICATORS", s["kicker"]), Paragraph("Use activity information, not a grade", s["h2"]), Paragraph("The Word Studio summary may show the number of encounters opened today, the current practice-day streak, and the distinction between new and revisited cards.", s["body"]), StatsDiagram(), Paragraph("Figure 5. The indicators describe practice activity only.", s["caption"]), Paragraph("<b>Today</b> describes encounters opened during the current practice day. <b>Day streak</b> counts consecutive practice days. <b>New</b> refers to words encountered for the first time in the current scheduling history. <b>Revisited</b> refers to cards returned by the review queue.", s["body"]), callout("These indicators do not represent a score, percentage correct, mastery level, ranking, or formal test result.", PALE_GREEN), Paragraph("The most useful response to an uncertain card is to read the sentence again, identify the relationship around the highlighted word, and use the later encounter to test the same distinction in a different context.", s["body"])]

    story += [PageBreak(), Paragraph("A SHORT PRACTICE ROUTINE", s["kicker"]), Paragraph("A careful five-minute cycle", s["h2"]), Paragraph("Use the following routine when working independently:", s["body"]), Paragraph("<b>1.</b> Open the assigned set from the Word desk.", s["step"]), Paragraph("<b>2.</b> Read the whole sentence, including the words before and after the highlighted item.", s["step"]), Paragraph("<b>3.</b> Choose the single role that fits this use of the word.", s["step"]), Paragraph("<b>4.</b> Read the feedback and note the grammatical clue that decided the answer.", s["step"]), Paragraph("<b>5.</b> Continue to the next card and allow the queue to return difficult cards later.", s["step"]), Spacer(1, 3 * mm), Paragraph("If a response fails to save, remain on the card and try the same choice again. If the assignment is unavailable, return to the Word desk and ask your teacher to verify the access code and account. The application keeps the assignment and its attempt history separate from formal Test Center records.", s["body"]), callout("The objective is accurate attention to word use in context. A later encounter is part of the design, not a penalty.", PALE_BLUE)]

    GuideDocTemplate(str(OUT)).build(story)


def _mock_access_flow():
    data = [[Paragraph("WORD DESK", styles()["kicker"]), Paragraph("ASSIGNED SET", styles()["kicker"]), Paragraph("OPEN CARDS", styles()["kicker"])], [Paragraph("Enter the code from your teacher", styles()["body"]), Paragraph("The set appears under your account", styles()["body"]), Paragraph("The flashcard panel opens", styles()["body"])]]
    t = Table(data, colWidths=[55 * mm, 55 * mm, 55 * mm], rowHeights=[10 * mm, 24 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), 0.7, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


if __name__ == "__main__":
    build()
