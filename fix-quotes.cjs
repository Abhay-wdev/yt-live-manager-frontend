const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let c = fs.readFileSync(p, 'utf8');
            let original = c;
            
            // Replace `'${import.meta.env.VITE_API_URL}...` with `\v${import.meta.env.VITE_API_URL}...`
            // Wait, we just want to replace the single quotes bounding the URL with backticks.
            c = c.replace(/'\$\{import\.meta\.env\.VITE_API_URL\}/g, "`\${import.meta.env.VITE_API_URL}");
            
            // Also need to fix the trailing single quote
            // Let's just use regex to find all strings starting with '`${import...}` and ending with `'`
            // and replace both outer single quotes with backticks.
            c = c.replace(/'(\$\{import\.meta\.env\.VITE_API_URL\}[^']*)'/g, "`$1`");

            // Just in case it's in double quotes
            c = c.replace(/"(\$\{import\.meta\.env\.VITE_API_URL\}[^"]*)"/g, "`$1`");

            if (c !== original) {
                fs.writeFileSync(p, c);
                console.log('Fixed', p);
            }
        }
    });
}

walk('src');
console.log('Done');
