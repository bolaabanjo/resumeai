type ExperienceEntry = {
    titleLine: string;
    bullets: string[];
    dates?: string | null;
};

export type ParsedResume = {
    header: string;
    experience: ExperienceEntry[];
    education: string[];
    skills: string[];
    rawSections: Record<string, string>;
};

const SECTION_KEYS = [
    "experience",
    "work experience",
    "professional experience",
    "projects",
    "education",
    "skills",
    "summary",
    "certifications",
];

function normalizeText(text: string) {
    return text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
}

export function splitToSections(text: string) {
    text = normalizeText(text);
    const lines = text.split("\n");
    const result: Record<string, string[]> = {};
    let currentKey = "header";
    result[currentKey] = [];

    for (let rawLine of lines) {
        const line = rawLine.trim();
        const low = line.toLowerCase();

        if (low.length > 0 && low.length < 60) {
            for (const key of SECTION_KEYS) {
                if (low === key || low.startsWith(key + ":") || low.startsWith(key + "—") || low.startsWith(key + "-")) {
                    currentKey = key;
                    if (!result[currentKey]) result[currentKey] = [];

                    line && result[currentKey].push("");
                }
            }
        }
        result[currentKey].push(rawLine);
    }

    const sections: Record<string, string> = {};
    for (const k of Object.keys(result)) {
        sections[k] = result[k].join("\n").replace(/\n{2,}/g, "\n\n").trim();
    }
    return { header: sections["header"] || "", sections };
}

function splitBlocks(block: string) {
    return block.split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractBullets(block: string) {
    const lines = block.split("\n").map((l) => l.trim());
    const bullets: string[] = [];
    for (const l of lines.slice(1)) {
      if (!l) continue;
      if (/^[-•*]\s+/.test(l)) bullets.push(l.replace(/^[-•*]\s+/, "").trim());
      else if (/^\d+\.\s+/.test(l)) bullets.push(l.replace(/^\d+\.\s+/, "").trim());
      else if (l.length > 50) bullets.push(l); // heuristically treat long lines as bullets
      else if (l.includes("•")) bullets.push(l.replace(/•/g, "").trim());
    }
    return bullets;
  }
  
  /** naive date extractor: pull year ranges or month-year occurrences */
  function extractDatesFromLine(line: string) {
    const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})(?:\s*(?:[-–—to]+)\s*(?:Present|Now|Present\.|[A-Za-z]{3,}\s*\d{4}|\d{4}))?/gi;
    const matches = Array.from(line.matchAll(datePattern)).map((m) => m[0]);
    if (matches.length) return matches.join(" | ");
    // fallback year-year like "2020 - 2022"
    const yRange = line.match(/\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|Present)/);
    return yRange ? yRange[0] : null;
  }
  
  /** extract a tokenized skill list from a skills block or heuristically from whole text */
  function extractSkillsFromBlock(block: string) {
    if (!block) return [];
    // split on commas, slashes, pipes, semicolons, bullets
    const parts = block.split(/[,\/\|\;\n•\-]/).map((p) => p.trim()).filter(Boolean);
    // normalize and keep short tokens likely to be skills
    const cleaned = parts
      .map((p) => p.replace(/\s{2,}/g, " ").trim())
      .filter((p) => p.length > 1 && p.length < 60)
      .slice(0, 120); // cap
    return Array.from(new Set(cleaned));
  }
  
  /** fallback extract top tech-like tokens from full text (very simple) */
  function fallbackExtractSkills(text: string) {
    const techRegex = /\b[A-Za-z\+\#]{2,20}\b/g;
    const tokens = Array.from(new Set((text.match(techRegex) || []).map((t) => t.trim())));
    // filter out short common words
    const common = new Set(["the", "and", "for", "with", "that", "this", "from", "using", "have", "has"]);
    const filtered = tokens.filter((t) => !common.has(t.toLowerCase()) && /[A-Za-z]/.test(t));
    return filtered.slice(0, 80);
  }
  
  /** main parser function */
  export function parseSections(text: string): ParsedResume {
    const norm = normalizeText(text);
    const { header, sections } = splitToSections(norm);
  
    const experienceRaw = sections["experience"] || sections["work experience"] || sections["professional experience"] || sections["projects"] || "";
    const educationRaw = sections["education"] || "";
    const skillsRaw = sections["skills"] || "";
  
    const experienceBlocks = splitBlocks(experienceRaw);
    const experiences: ExperienceEntry[] = experienceBlocks.map((blk) => {
      const lines = blk.split("\n").map((l) => l.trim()).filter(Boolean);
      const titleLine = lines[0] || "";
      const bullets = extractBullets(blk);
      const dates = extractDatesFromLine(titleLine) || extractDatesFromLine(lines.slice(1).join(" ")) || null;
      return { titleLine, bullets, dates };
    });
  
    const educBlocks = splitBlocks(educationRaw);
  
    let skills = extractSkillsFromBlock(skillsRaw);
    if (skills.length === 0) {
      skills = fallbackExtractSkills(norm).slice(0, 80);
    }
  
    return {
      header: header.trim(),
      experience: experiences,
      education: educBlocks,
      skills,
      rawSections: sections
    };
  }