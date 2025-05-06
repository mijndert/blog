import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the title of the post: ', (title) => {
  const date = new Date();
  const options = {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(date);

  const formattedDate = {
    year: parts.find(part => part.type === 'year').value,
    month: parts.find(part => part.type === 'month').value,
    day: parts.find(part => part.type === 'day').value,
    hour: parts.find(part => part.type === 'hour').value,
    minute: parts.find(part => part.type === 'minute').value,
    second: parts.find(part => part.type === 'second').value,
  };

  const isoDate = `${formattedDate.year}-${formattedDate.month}-${formattedDate.day} ${formattedDate.hour}:${formattedDate.minute}:${formattedDate.second}`;

  const filename = title.toLowerCase().replace(/ /g, '-') + '.md';
  const filePath = path.join('src', 'posts', filename);
  const content = `---
title: ${title}
date: ${isoDate}
summary: 
tags:
- 
---
`;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Post created: ${filePath}`);
  rl.close();
});
