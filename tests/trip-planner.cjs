const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.TEST_URL || 'http://127.0.0.1:4325';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server']});try{
const student=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const driver=await browser.newPage();
await student.goto(base+'/passenger?user=mei&stop=cp');await student.locator('#bus-overview').waitFor();await student.getByRole('button',{name:'Plan a trip',exact:true}).click();
await student.locator('#pickup').selectOption('place:meranti');await student.locator('#destination').selectOption('msi');
assert((await student.locator('.walking-note').first().innerText()).includes('Board at'));
assert((await student.locator('.walking-note').last().innerText()).includes('Get off at'));
await student.locator('#pickup').selectOption('cp');await student.locator('#destination').selectOption('stop:fke');
await student.getByRole('button',{name:'Pin your starting point on the map',exact:true}).click();await student.getByText('Tap the map to pin your starting point',{exact:false}).waitFor();
await student.locator('.leaflet-container').click({position:{x:170,y:220}});await student.locator('#pickup').waitFor();
await student.locator('#pickup').selectOption('cp');await student.getByRole('button',{name:'Or pin your destination on the map',exact:true}).click();await student.locator('.leaflet-container').click({position:{x:220,y:250}});await student.locator('#destination').waitFor();assert.equal(await student.locator('#destination').inputValue(),'pin');
await student.locator('#destination').selectOption('stop:fke');
await student.getByRole('button',{name:'Notify driver · BK01',exact:true}).click();await student.getByText('Your bus is on its way.',{exact:true}).waitFor();
await driver.goto(base+'/driver');await driver.locator('.request-row').filter({hasText:'Mei'}).waitFor();
await driver.locator('#arrival-stop').selectOption('cp');await driver.getByRole('button',{name:'Demo: arrive & update passengers',exact:true}).click();
await student.getByRole('button',{name:'Notify driver: stop at E01 Bus Stop',exact:true}).waitFor();await student.getByRole('button',{name:'Notify driver: stop at E01 Bus Stop',exact:true}).click();await driver.getByText('Stop requested',{exact:true}).waitFor();
await student.getByRole('button',{name:'Bus info',exact:true}).click();await student.getByRole('button',{name:'Show map',exact:true}).click();await student.waitForTimeout(500);await student.screenshot({path:'test-results/lingkaran-road-mobile.png'});
console.log('PASS: place-to-stop advice, direct stop selection, origin/destination pins, driver pickup notification, boarding and stop-request delivery.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

