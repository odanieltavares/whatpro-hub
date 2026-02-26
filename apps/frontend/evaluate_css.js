const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/instances');
  // wait and open modal
  await page.waitForSelector('button:has-text("Adicionar Instância")');
  await page.click('button:has-text("Adicionar Instância")');
  await page.waitForSelector('[role="dialog"]');
  
  // get dialog content
  const dialog = await page.$('.bg-background[role="dialog"]');
  if (dialog) {
    const computed = await dialog.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        className: el.className
      };
    });
    console.log("Dialog computed:", computed);
  } else {
    console.log("Dialog element not found with .bg-background");
  }

  // test raw CSS variable evaluation
  const rootVars = await page.evaluate(() => {
    return {
      bg: window.getComputedStyle(document.body).getPropertyValue('--background'),
      popover: window.getComputedStyle(document.body).getPropertyValue('--popover'),
    }
  });
  console.log("Root vars:", rootVars);
  
  await browser.close();
})();
