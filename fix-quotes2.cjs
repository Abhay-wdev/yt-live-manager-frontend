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
            
            // The string looks like: `${import.meta.env.VITE_API_URL}/api/stream/instances'
            // We want to find a backtick, followed by ${import.meta.env.VITE_API_URL}, 
            // followed by anything except single quotes, followed by a single quote.
            // And replace the trailing single quote with a backtick.
            c = c.replace(/`(\$\{import\.meta\.env\.VITE_API_URL\}[^'`]*?)'/g, "`$1`");
            
            // Also fix if there's a trailing double quote instead
            c = c.replace(/`(\$\{import\.meta\.env\.VITE_API_URL\}[^'`]*?)"/g, "`$1`");

            // Also check for socket.io which doesn't have template interpolation, it might be just `import.meta.env.VITE_API_URL`
            // Wait, socket is `io(import.meta.env.VITE_API_URL)` which doesn't have quotes. That's fine.

            if (c !== original) {
                fs.writeFileSync(p, c);
                console.log('Fixed syntax in', p);
            }
        }
    });
}

walk('src');
console.log('Done');
