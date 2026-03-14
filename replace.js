const fs = require('fs');
const path = require('path');

const directoryPath = 'd:\\job portal\\job';

const replacements = [
    { from: /SARKARI RESULT/g, to: 'JOB PORTAL' },
    { from: /Sarkari Result/g, to: 'Job Portal' },
    { from: /sarkariresult/gi, to: 'jobportal' },
    { from: /sarkari result/gi, to: 'job portal' }
];

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('node_modules') || filePath.includes('.next') || filePath.includes('.git')) return;
        
        if (fs.statSync(filePath).isDirectory()) {
            filelist = walkSync(filePath, filelist);
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                filelist.push(filePath);
            }
        }
    });
    return filelist;
};

const files = walkSync(directoryPath);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(({from, to}) => {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
