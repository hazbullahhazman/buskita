const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_URL || 'http://127.0.0.1:4324';
(async () => {
 const browser = await chromium.launch({ channel:'chrome', headless:true, args:['--no-proxy-server'] });
 try {
  for (const size of [{width:390,height:844},{width:360,height:640}]) {
   const context = await browser.newContext({viewport:size, isMobile:true, hasTouch:true});
   const page = await context.newPage();
   await page.goto(base+'/passenger?stop=fke');
   await page.getByText('Demo connected',{exact:true}).waitFor();
   await page.reload();
   await page.locator('#bus-overview h2').filter({hasText:'FKE'}).waitFor();
   assert.equal(await page.locator('.arrival-list button').count(),3);
   const panel = page.locator('.journey-dock');
   const before = await panel.boundingBox();
   await page.getByRole('button',{name:'Collapse bus panel',exact:true}).tap();
   await page.waitForTimeout(350);
   const collapsed = await panel.boundingBox();
   assert(collapsed.y > before.y + 100);
   assert(collapsed.y + collapsed.height <= size.height - 63);
   await page.getByRole('button',{name:'Expand bus panel',exact:true}).tap();
   await page.getByRole('button',{name:'Plan a trip',exact:true}).tap();
   await page.waitForTimeout(600);
   assert(await page.locator('#pickup').isVisible());
   const planner = await page.locator('#trip-planner').boundingBox();
   const full = await panel.boundingBox();
   assert(planner.y >= full.y && planner.y < full.y + full.height - 80);
   await page.getByRole('button',{name:'Bus info',exact:true}).tap();
   await page.waitForTimeout(600);
   assert(await page.locator('.sheet-scroll').evaluate(el=>el.scrollTop < 10));
   // Real touch gesture through Chrome, starting on the drag handle.
   const handle = await page.locator('.sheet-grip').boundingBox();
   const cdp = await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:handle.x+100,y:handle.y+20}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:handle.x+100,y:handle.y+120}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(350);
   assert((await panel.getAttribute('class')).includes('sheet-collapsed'));
   const nav = page.locator('.app-rail');
   assert.equal(await nav.locator("nav button").count(), 2);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.getByRole('button',{name:'Expand bus panel',exact:true}).tap();
   await page.waitForTimeout(400);
   assert(!(await panel.getAttribute("class")).includes("sheet-collapsed"));
   await page.screenshot({path:`test-results/mobile-panel-${size.width}.png`});
   await context.close();
  }
  console.log('PASS: phone sizes, QR stop, all buses, direct refresh, collapse/expand, real touch drag, planner jump, no overflow, presentation paths.');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});

