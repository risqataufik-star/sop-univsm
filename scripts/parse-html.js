const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const filesToParse = [
    { filename: 'SOP UPM.html', mainCategory: 'UPM' }
];

const outputDir = path.join(__dirname, '..', 'src', 'data');
const outputFile = path.join(outputDir, 'sop_data.json');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let allSops = [];

filesToParse.forEach(fileInfo => {
    const filePath = path.join(__dirname, '..', fileInfo.filename);
    
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    console.log(`Parsing ${fileInfo.filename}...`);
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    let currentCategory = 'General';

    // Google Sheets exported HTML usually uses <table class="waffle">
    $('tr').each((i, row) => {
        const tds = $(row).find('td');
        const rowTexts = [];
        const links = [];

        tds.each((j, td) => {
            const text = $(td).text().trim();
            rowTexts.push(text);
            
            // Extract hyperlink
            const a = $(td).find('a');
            if (a.length > 0) {
                links[j] = a.attr('href');
            } else {
                links[j] = null;
            }
        });

        // The sheet has two sets of columns: C,D,E (index 2,3,4) and G,H,I (index 6,7,8)
        // Adjusting indexes since Google Sheets might export column A as 0, B as 1, etc.
        // We will just look for patterns in the row texts.
        
        // Detect Category: text starts with SOP and no "UNIVSM/SOP" in the row
        const rowString = rowTexts.join(' ');
        if (rowString.includes('SOP') && !rowString.includes('UNIVSM/SOP/')) {
            // Find the longest text in the row that starts with SOP
            const catCandidates = rowTexts.filter(t => t.startsWith('SOP') && t.length > 10);
            if (catCandidates.length > 0) {
                currentCategory = catCandidates[0];
            }
        }

        // Extract SOP data by looking for the "UNIVSM/SOP/" pattern
        rowTexts.forEach((text, index) => {
            if (text.includes('UNIVSM/SOP/')) {
                // This is the Nomor SOP.
                // The Nama SOP is usually the preceding column (index - 1)
                // The Dokumen is the next column (index + 1)
                // The Link is the link in the Dokumen column (or Nama SOP column)
                
                const namaSOP = index > 0 ? rowTexts[index - 1] : 'Unknown';
                const nomorSOP = text;
                const dokumen = index < rowTexts.length - 1 ? rowTexts[index + 1] : 'DOC';
                
                // Link is usually in the Dokumen column (index + 1), but let's check namaSOP too
                let link = null;
                if (index < links.length - 1 && links[index + 1]) {
                    link = links[index + 1];
                } else if (index > 0 && links[index - 1]) {
                    link = links[index - 1];
                }

                // Clean up google redirect links if any
                if (link && link.includes('google.com/url?q=')) {
                    try {
                        const urlParams = new URLSearchParams(link.split('?')[1]);
                        link = urlParams.get('q') || link;
                    } catch(e) {}
                }

                allSops.push({
                    mainCategory: fileInfo.mainCategory,
                    category: currentCategory,
                    name: namaSOP,
                    number: nomorSOP,
                    document: dokumen || 'DOC',
                    link: link
                });
            }
        });
    });
});

fs.writeFileSync(outputFile, JSON.stringify(allSops, null, 2));
console.log(`Extracted ${allSops.length} SOPs to ${outputFile}`);
