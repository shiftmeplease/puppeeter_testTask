const puppeteer = require("puppeteer");
const fs = require("node:fs/promises");

const productList = [
  "https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202",
  "https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-2-5-950g--310778",
  "https://www.vprok.ru/product/makfa-makfa-izd-mak-spirali-450g--306739",
  "https://www.vprok.ru/product/greenfield-greenf-chay-gold-ceyl-bl-pak-100h2g--307403",
  "https://www.vprok.ru/product/chaykofskiy-chaykofskiy-sahar-pesok-krist-900g--308737",
  "https://www.vprok.ru/product/lavazza-kofe-lavazza-1kg-oro-zerno--450647",
  "https://www.vprok.ru/product/parmalat-parmal-moloko-pit-ulster-3-5-1l--306634",
  "https://www.vprok.ru/product/perekrestok-spmi-svinina-duhovaya-1kg--1131362",
  "https://www.vprok.ru/product/vinograd-kish-mish-1-kg--314623",
  "https://www.vprok.ru/product/eko-kultura-tomaty-cherri-konfetto-250g--946756",
  "https://www.vprok.ru/product/bio-perets-ramiro-1kg--476548",
  "https://www.vprok.ru/product/korkunov-kollektsiya-shokoladnyh-konfet-korkunov-iz-molochnogo-shokolada-s-fundukom-karamelizirovannym-gretskim-orehom-vafley-svetloy-orehovoy--1295690",
  "https://www.vprok.ru/product/picnic-picnic-batonchik-big-76g--311996",
  "https://www.vprok.ru/product/ritter-sport-rit-sport-shokol-tsel-les-oreh-mol-100g--305088",
  "https://www.vprok.ru/product/lays-chipsy-kartofelnye-lays-smetana-luk-140g--1197579",
];

const regionList = [
  {
    name: "Москва и область",
    regionId: 1,
  },
  {
    name: "Санкт-Петербург и область",
    regionId: 2,
  },
  {
    name: "Владимирская обл.",
    regionId: 8,
  },
  {
    name: "Калужская обл.",
    regionId: 12,
  },
  {
    name: "Рязанская обл.",
    regionId: 26,
  },
  {
    name: "Тверская обл.",
    regionId: 33,
  },
  {
    name: "Тульская обл.",
    regionId: 34,
  },
];


MultipleParser();

//TODO use path.join....
async function MultipleParser() {
  await fs.mkdir("./results");
  const dirPromises = regionList.map((v) => {
    return fs.mkdir(`./results/${v.name}`);
  });
  await Promise.all(dirPromises);

  for (let productUrl of productList) {
    for (let region of regionList) {
      await parse(productUrl, region);
      await sleep(5000); // ipban bypass
    }
  }
}

async function parse(url, region) {
  let pageContent = "";
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setCookie({
      name: "region",
      value: region.regionId.toString(),
      domain: ".vprok.ru",
      // expires: Math.round(+new Date() + 1000 * 60 * 60),
    });

    await page.goto(url);

    await page.setViewport({ width: 1080, height: 1024 });

    const nextRenderDataNode = await page.waitForSelector("#__NEXT_DATA__");
    let pageData = await nextRenderDataNode?.evaluate((el) => el.textContent);
    pageData = JSON.parse(pageData);
    pageContent = await page.content();
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
      region,
    });

    let productString = buildResultString();
    productString.append(price, "price");
    productString.append(oldPrice, "oldPrice");
    productString.append(rating, "rating");
    productString.append(numberOfReviews, "reviewCount");
    productString.append(activityStatus, "activityStatus");
    const writeData = fs.writeFile(
      `./results/${region.name}/${name}.txt`,
      productString.trimmedResult()
    );
    await sleep(2000);

    const screenshotData = await page.screenshot({ fullPage: true });
    const saveScreenshot = fs.writeFile(
      `./results/${region.name}/${name}.jpg`,
      screenshotData
    );
    const browserPromise = browser.close();
    Promise.all([saveScreenshot, writeData, browserPromise]);
  } catch (err) {
    console.log(err, url, region);
    await fs.writeFile("./text.html", pageContent);
    process.exit(0);
  }
  return true;
}

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
