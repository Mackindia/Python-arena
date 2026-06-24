const fs = require('fs');
const path = require('path');

const timetablesPath = path.join(__dirname, 'src', 'data', 'timetables.json');

// Teacher Mapping from the snapshot
const mapping = {
  "English": {
    "9A": "NM", "9B": "NM", "10A": "NM", "10B": "NM",
    "11PCM": "SP", "11PCB": "SP", "11COMMA": "SP", "11COMMB": "SP", "11HUM": "SP",
    "12PCM": "SP", "12PCB": "SP", "12COMMA": "SP", "12COMMB": "SP", "12HUM": "SP"
  },
  "Hindi": {
    "9A": "MG", "9B": "MG", "10A": "MG", "10B": "MG"
  },
  "Maths": {
    "9A": "VR", "9B": "VR", "10A": "VR", "10B": "VR",
    "11PCM": "NT", "11COMMA": "NT", "11COMMB": "NT",
    "12PCM": "NT", "12COMMA": "NT"
  },
  "Science": {
    "9A": "AN, RD, NG", "9B": "AN, RD, NG", "10A": "AN, RD, NG", "10B": "AN, RD, NG"
  },
  "SSt": {
    "9A": "SS, SB, MN", "9B": "SS, SB, MN", 
    "10A": "AB, SD, MN", "10B": "AB, SD, MN"
  },
  "IT": {
    "9A": "NP", "9B": "NP", "10A": "NP", "10B": "NP"
  },
  "AI": {
    "9A": "TP", "9B": "TP", "10A": "TP", "10B": "TP"
  },
  "Physics": {
    "11PCM": "AN", "11PCB": "AN", "12PCM": "AN", "12PCB": "AN"
  },
  "Chemistry": {
    "11PCM": "RD", "11PCB": "RD", "12PCM": "RD", "12PCB": "RD"
  },
  "Biology": {
    "11PCB": "NG", "12PCB": "NG"
  },
  "Accounts": {
    "11COMMA": "MS", "11COMMB": "MS", "12COMMA": "MS", "12COMMB": "MS"
  },
  "Business Studies": {
    "11COMMA": "SH", "11COMMB": "SH", "12COMMA": "SH", "12COMMB": "SH"
  },
  "Economics": {
    "11COMMA": "PR", "11COMMB": "PR", "11HUM": "PR",
    "12COMMA": "PR", "12COMMB": "PR", "12HUM": "PR"
  },
  "History": {
    "11HUM": "SA", "12HUM": "SA"
  },
  "Geography": {
    "11HUM": "AR", "12HUM": "AR"
  },
  "Pol. Science": {
    "11HUM": "DV", "12HUM": "DV"
  },
  "Psychology": {
    "11PCB": "RN", "11HUM": "RN",
    "12PCB": "RN", "12HUM": "RN"
  },
  "Sociology": {
    "11HUM": "GA", "12HUM": "GA"
  },
  "Physical Education": {
    "11PCM": "SZ, SU", "11PCB": "SZ, SU", "11COMMA": "SZ, SU", "11COMMB": "SZ, SU", "11HUM": "SZ, SU",
    "12PCM": "PB", "12PCB": "PB", "12COMMA": "PB", "12COMMB": "PB", "12HUM": "PB"
  },
  "Fine Arts": {
    "11PCM": "KB", "11PCB": "KB", "11COMMA": "KB", "11COMMB": "KB", "11HUM": "KB",
    "12PCM": "KB", "12PCB": "KB", "12COMMA": "KB", "12COMMB": "KB", "12HUM": "KB"
  },
  "Music": {
    "11PCM": "MG", "11PCB": "MG", "11COMMA": "MG", "11COMMB": "MG", "11HUM": "MG",
    "12PCM": "MG", "12PCB": "MG", "12COMMA": "MG", "12COMMB": "MG", "12HUM": "MG"
  },
  "Computer Science": {
    "11PCM": "SW", "12PCM": "SW"
  },
  "Legal Studies": {
    "11HUM": "HSC", "12HUM": "HSC"
  },
  "Applied Maths": {
    "11COMMA": "DK", "11COMMB": "DK",
    "12COMMA": "DK", "12COMMB": "DK"
  }
};

// Aliases for matching class IDs in timetables.json
const normalizeClassId = (id) => {
  return id.replace(/\s+/g, '').toUpperCase();
};

try {
  let timetables = JSON.parse(fs.readFileSync(timetablesPath, 'utf8'));
  let updatedCount = 0;

  // Process mapping
  for (const [classId, schedule] of Object.entries(timetables)) {
    const normalizedClass = normalizeClassId(classId); // e.g. "9a" -> "9A", "11 PCM" -> "11PCM"
    
    schedule.forEach(slot => {
      if (!slot.subject) return;
      
      // Match subject exactly or with slight variation
      let matchedSubject = null;
      for (const subj of Object.keys(mapping)) {
        if (slot.subject.toLowerCase() === subj.toLowerCase() || 
            slot.subject.toLowerCase().includes(subj.toLowerCase())) {
          matchedSubject = subj;
          break;
        }
      }

      if (matchedSubject && mapping[matchedSubject][normalizedClass]) {
        slot.teacher = mapping[matchedSubject][normalizedClass];
        updatedCount++;
      }
    });
  }

  fs.writeFileSync(timetablesPath, JSON.stringify(timetables, null, 2));
  console.log(`Successfully updated ${updatedCount} slots with teacher mappings!`);
} catch (error) {
  console.error("Error updating teachers:", error);
}
