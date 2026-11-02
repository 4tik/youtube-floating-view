const fs = require('fs');
const fsp = require('fs/promises');

// Override fs.realpathSync.native with standard fs.realpathSync
// Windows sandbox environment restricts Win32 GetFinalPathNameByHandle called by native realpath
fs.realpathSync.native = fs.realpathSync;
if (fs.realpath && fs.realpath.native) {
  fs.realpath.native = fs.realpath;
}

fsp.realpath = async function(p, opts) {
  try {
    return fs.realpathSync(p, opts);
  } catch (e) {
    return String(p);
  }
};
fsp.realpath.native = fsp.realpath;
