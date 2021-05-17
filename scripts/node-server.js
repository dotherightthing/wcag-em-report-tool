/**
 * Node.js server
 *
 * @see https://cmsdk.com/node-js/ajax-call-to-another-node-js-server.html
 * @see https://stackoverflow.com/questions/26582823/need-to-execute-a-shell-script-from-angular-js-ui
 * @see https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
 */

const express = require('express');
const cors = require('cors');
const app = express();
const { exec } = require('child_process');
const fs = require('fs');

function shellSafe (str) {
  str = str.replace(/(\s)/g, '\\ ');
  str = str.replace(/(')/g, '\\\'');

  return str;
}

// allow requests from a server running on a different port
app.use(cors());

// middleware
app.use(express.json({
  limit: '1000kb'
}));
app.use(express.urlencoded({
  extended: true
}));
app.use('/downloads', express.static('tmp'));

app.listen(3000, function () {
  console.log('Node server listening on http://localhost:3000');
});

/**
 * Create REST end point which the Angular app can request to download a PDF of the supplied HTML page
 */
app.post('/pdf/create', function (req, res) {
  const author = shellSafe(req.body.author);
  const html = req.body.html;
  const subject = shellSafe(req.body.subject);
  const title = shellSafe(req.body.title);

  // name isn't used as file download is via a blob
  const fileName = 'evaluation-report';

  // write the passed data to a temporary file which prince can access
  fs.writeFileSync(`tmp/${fileName}.html`, html);

  // assemble the prince shell command
  let cmd = `prince tmp/${fileName}.html
--output=tmp/${fileName}.pdf
--pdf-author=${author}
--pdf-profile=PDF/UA-1
--pdf-subject=${subject}
--pdf-title=${title}
--pdf-xmp=pdfUA-ID.xmp
--no-artificial-fonts
--disallow-modify
`;

  // output prince shell command on 1 line
  const regex = /[\r\n]+/g;
  cmd = cmd.replace(regex, ' ');

  // execute shell command
  exec(cmd, (e) => {
    if (e instanceof Error) {
      console.error(e);
      throw e;
    }

    fs.unlinkSync(`tmp/${fileName}.html`);

    // return the generated filepath
    // res.download didn't work
    // https://masteringjs.io/tutorials/express/post
    res.end(`http://localhost:3000/downloads/${fileName}.pdf`);
  });
});
