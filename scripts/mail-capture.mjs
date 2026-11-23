import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import http from "node:http";
const messages = [];
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS", "AUTH"],
  onData(stream, session, callback) {
    simpleParser(stream)
      .then((message) => {
        messages.unshift({
          id: messages.length + 1,
          subject: message.subject,
          from: message.from?.text,
          to: message.to?.text,
          text: message.text,
          html: message.html,
          date: new Date().toISOString(),
        });
        callback();
      })
      .catch(callback);
  },
});
smtp.listen(Number(process.env.SMTP_PORT || 1025), "127.0.0.1", () =>
  console.log("Local SMTP capture: 127.0.0.1:1025"),
);
const inbox = http.createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.url === "/api/messages") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(messages));
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(
    `<!doctype html><html><title>AquaCircle local inbox</title><style>body{font:16px system-ui;background:#f6f7f2;color:#123f3b;max-width:850px;margin:50px auto;padding:24px}article{background:white;border:1px solid #dcefe9;padding:24px;margin:20px 0}pre{white-space:pre-wrap}h1{font-size:32px}</style><h1>AquaCircle · Local inbox</h1><p>Development capture only. No messages leave this machine. Reload to see new messages.</p>${messages.map((m) => `<article><h2>${escape(m.subject || "")}</h2><pre>${escape(m.text || "")}</pre></article>`).join("")}</html>`,
  );
});
function escape(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
inbox.listen(8025, "127.0.0.1", () =>
  console.log("Local email inbox: http://localhost:8025"),
);
function shutdown() {
  smtp.close();
  inbox.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
