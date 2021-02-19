const puppeteer = require("puppeteer");

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.freedomforum.org/todaysfrontpages/");
  await page.waitForFunction(() => window.TFP_DATA);
  const tfp = await page.evaluate(() => window.TFP_DATA);
  console.log(JSON.stringify(tfp));
  await browser.close();
}
main();
