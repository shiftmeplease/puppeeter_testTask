const puppeteer = require("puppeteer");
const handleArguments = require("./argHandler");
const fs = require("node:fs/promises");

const { url, region, regionId } = handleArguments();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setCookie({
    name: "region",
    value: regionId.toString(),
    domain: ".vprok.ru",
    // expires: Math.round(+new Date() + 1000 * 60 * 60),
  });
  await page.goto(url);

  await page.setViewport({ width: 1080, height: 1024 });

  const nextRenderDataNode = await page.waitForSelector("#__NEXT_DATA__");
  let pageData = await nextRenderDataNode?.evaluate((el) => el.textContent);
  pageData = JSON.parse(pageData);

  let productData = pageData?.props?.pageProps?.initialStore?.productPage;
  if (!productData) throw new Error("IP ban");
  const { oldPrice, price, activityStatus, name } = productData.product;
  const { numberOfReviews, rating } = productData.reviews.data;
  console.log({
    oldPrice,
    price,
    activityStatus,
    name,
    numberOfReviews,
    rating,
    region
  });

  let productString = buildResultString();
  productString.append(price, "price");
  productString.append(oldPrice, "oldPrice");
  productString.append(rating, "rating");
  productString.append(numberOfReviews, "reviewCount");
  productString.append(activityStatus, "activityStatus");
  const writeData = fs.writeFile(
    "./product.txt",
    productString.trimmedResult()
  );

  const screenshotData = await page.screenshot({ fullPage: true });
  const saveScreenshot = fs.writeFile("./screenshot.jpg", screenshotData);
  const browserPromise = browser.close();
  await Promise.all([saveScreenshot, writeData, browserPromise]);
})();

function buildResultString() {
  return {
    result: "",
    append: function (value, name) {
      if (value) {
        this.result += `${name}=${value}\r\n`;
      }
    },
    trimmedResult: function () {
      return this.result.replace(/\r\n$/gm, "");
    },
  };
}
