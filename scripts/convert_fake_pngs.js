const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let list = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(ent => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      list = list.concat(walk(full));
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.png')) {
      const buf = fs.readFileSync(full);
      if (buf[0] === 0xff && buf[1] === 0xd8) {
        list.push(full);
      }
    }
  });
  return list;
}

const badFiles = walk('assets');
console.log('Found ' + badFiles.length + ' JPEG files named .png:');
badFiles.forEach(f => console.log(' - ' + f));

badFiles.forEach(f => {
  const absPath = path.resolve(f);
  // Run PowerShell one-liner with explicit string
  const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; $b = [System.IO.File]::ReadAllBytes('${absPath.replace(/'/g, "''")}'); $ms = [System.IO.MemoryStream]::new($b); $img = [System.Drawing.Bitmap]::FromStream($ms); $out = [System.IO.MemoryStream]::new(); $img.Save($out, [System.Drawing.Imaging.ImageFormat]::Png); $img.Dispose(); $ms.Dispose(); [System.IO.File]::WriteAllBytes('${absPath.replace(/'/g, "''")}', $out.ToArray()); $out.Dispose();"`;
  execSync(psCmd);
  const verifyBuf = fs.readFileSync(absPath);
  const isPng = verifyBuf[0] === 0x89 && verifyBuf[1] === 0x50 && verifyBuf[2] === 0x4e && verifyBuf[3] === 0x47;
  console.log('Converted ' + path.basename(f) + ' -> Valid PNG: ' + isPng);
});
