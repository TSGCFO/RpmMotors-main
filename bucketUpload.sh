
#!/bin/bash

# Path to upload from (local directory)
SOURCE_DIR="client/public/vehicles"

# Replace this with your actual upload script
node -e "
const { Client } = require('@replit/object-storage');
const fs = require('fs');
const path = require('path');

async function uploadFolder(folderPath, bucketPath) {
  const client = new Client();
  
  // Read all files in the directory
  const files = fs.readdirSync(folderPath, { withFileTypes: true });
  
  for (const file of files) {
    const sourcePath = path.join(folderPath, file.name);
    const targetPath = path.join(bucketPath, file.name);
    
    if (file.isDirectory()) {
      // Recursively upload subdirectories
      await uploadFolder(sourcePath, targetPath);
    } else {
      // Upload individual file
      console.log(\`Uploading \${sourcePath} to \${targetPath}...\`);
      const { ok, error } = await client.uploadFromFilename(targetPath, sourcePath);
      
      if (!ok) {
        console.error(\`Failed to upload \${sourcePath}: \${error}\`);
      } else {
        console.log(\`Successfully uploaded \${sourcePath}\`);
      }
    }
  }
}

// Start the upload process
uploadFolder('$SOURCE_DIR', '$SOURCE_DIR')
  .then(() => console.log('Upload completed!'))
  .catch(err => console.error('Upload failed:', err));
"
