const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

let balance = 0;
let stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Very naive regex, won't handle JSX comments properly but might be enough
    const openMatches = line.match(/<div[ >]/g);
    const closeMatches = line.match(/<\/div>/g);
    
    if (openMatches) {
        openMatches.forEach(() => {
            balance++;
            stack.push(i + 1);
        });
    }
    if (closeMatches) {
        closeMatches.forEach(() => {
            balance--;
            stack.pop();
        });
    }
}

console.log('Final balance:', balance);
console.log('Unclosed div lines:', stack);
