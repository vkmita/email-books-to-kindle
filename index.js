var nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const chunk = require('lodash').chunk;
const Bluebird = require('bluebird');
const Promise = Bluebird;
const directoryPath = path.join(__dirname, 'books');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_PASSWORD,
  }
 });

  const buildAttachments = async data => {
    const attachments = data.map(({ content, filename}) => {
      const base = Buffer.from(content).toString('base64');
      console.log({ attSize: Buffer.byteLength(base), filename })
      return ({ content: Buffer.from(content), filename: `${filename.replace(/\.mobi$/, '').replace(/[_,\. ]/g, '_')}.mobi`, contentType: 'application/octet-stream', knownLength: Buffer.byteLength(base), encoding: 'base64' });
    });

    return attachments;
  }
  

async function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, async function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    const chunked = chunk(filenames.slice(450), 10);
    await Promise.mapSeries(chunked, async (chunk, idx) => {
      console.log('Chunk #', idx);
      await Promise.mapSeries(chunk, async (filename, idxx) => {
        const content = await fs.readFileSync(dirname + filename)
        if (err) {
          onError(err);
          return;
        }
        await onFileContent(filename, content, chunk.length, idxx);
      });
      console.log('Should send email now'); 
    });
  });
}

let data = [];
readFiles(`${directoryPath}/`, async function(filename , content, length, idx) {
  data.push({ filename, content });
  if (length === idx + 1) {
    const attachments = await buildAttachments(data);

    console.log(attachments.map(a => a.filename));

    let res;

    try {
      res = await transporter.sendMail({
        from: 'me@vkmita.com',
        to: [
          // your kindle email
        ],
        subject: 'Hey you, awesome!',
        text: 'Mailgun rocks, pow pow!',
        attachments,
      });
    } catch(error) {
      console.log(error)
    }
    
    data = []
    console.log(res)
  };
}, function(err) {
  throw err;
});

console.log(data)