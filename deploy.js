require("fs").appendFileSync(
  ".env.prod",
  `\nBASE_URL=https://${process.argv.slice(2)[0]}.herokuapp.com/#`
);
