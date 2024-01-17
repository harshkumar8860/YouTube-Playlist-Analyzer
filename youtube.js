// a. Name of Playlist, view
// b. Total No of videos : 792
// c. actual No of videos : 783
// d. Total length of playlist : 12 hours, 9 minutes, 12 seconds
// wrong numbers, just example
// At 1.25x : 9 hours, 21 minutes, 48 seconds

// At 1.50x : 8 hours, 18 minutes, 10 seconds

// At 1.75x : 6 hours, 24 minutes, 8 seconds

// At 2.00x : 6 hours, 13 minutes, 37 seconds

// const { table } = require("console");
// const { copyFileSync } = require("fs");
const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");
let page;
(async function () {
  try {
    let browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
    })
    console.log("browser opened");
    page = await browser.newPage();
    await page.goto('https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj');
    console.log("ncs playlist opened");
    await page.waitForSelector('.style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28');
    let element = await page.$('.style-scope.yt-dynamic-sizing-formatted-string.yt-sans-28');
    let value = await page.evaluate(el => el.textContent, element);
    console.log("Title", value);
    let noOfVideos = await page.$$('.metadata-stats.style-scope.ytd-playlist-byline-renderer .style-scope.yt-formatted-string');
    value = await page.evaluate(el => el.textContent, noOfVideos[0]);
    console.log("Videos", value);
    let videos = value.split(" ")[0].trim();
    let noOfViews = await page.$$('.byline-item.style-scope.ytd-playlist-byline-renderer');
    value = await page.evaluate(el => el.textContent, noOfViews[1]);
    console.log("Views", value);

    let loopcount = Math.floor(videos / 100);
    for (let i = 0; i < loopcount; i++) {
      // load start
      await page.click(".circle.style-scope.tp-yt-paper-spinner");
      // load finish
      await waitTillHTMLRendered(page);
      console.log("loaded the new videos");
    }
    let VideoNameElementList = await page.$$('a[id="video-title"]');
    console.log("VideoNameElementList", VideoNameElementList.length);
    let lastVideo = VideoNameElementList[VideoNameElementList.length - 1];
    await page.evaluate(function (elem) {
      elem.scrollIntoView();
    }, lastVideo);

    // await page.waitFor(3000);

    let timeList = await page.$$('span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    console.log("timeList", timeList.length);

    let videosArr = [];
    for (let i = 0; i < timeList.length; i++) {
      let timeNTitleObj = await page.evaluate(getTimeAndTitle, timeList[i], VideoNameElementList[i]);
      videosArr.push(timeNTitleObj);
    }
    let pdfDoc = new pdf();
    pdfDoc.pipe(fs.createWriteStream('Playlist.pdf'));

    // pdfDoc.text(JSON.stringify(videosArr));
    pdfDoc.text(JSON.stringify(videosArr, null, 2));

    pdfDoc.end();
    // console.table(videosArr);


  }
  catch (error) {
    console.log("error");
  }
})();

function getTimeAndTitle(element1, element2) {
  return {
    time: element1.innerText.trim(),
    title: element2.textContent.trim()
  };
}

const waitTillHTMLRendered = async (page, timeout = 20000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while (checkCounts++ <= maxChecks) {
    let html = await page.content();
    let currentHTMLSize = html.length;

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
      countStableSizeIterations++;
    else
      countStableSizeIterations = 0; //reset the counter

    if (countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }
};    