const fs = require('fs');
const path = require('path');

const testFiles = [
  'tests/auth.test.js',
  'tests/chats.test.js', 
  'tests/users.test.js',
  'tests/models/Chat.test.js',
  'tests/models/Message.test.js',
  'tests/models/User.test.js'
];

testFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Password123 with Password123! but not if it already has !
    content = content.replace(/Password123(?!!)/g, 'Password123!');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed passwords in ${filePath}`);
  }
});

console.log('All password references updated!');