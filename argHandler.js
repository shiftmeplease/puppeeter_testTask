const urlRE =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;

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

function handleArguments() {
  const argArr = process.argv;
  if (argArr.length != 4) stop("Too few arguments");

  const [nodeBin, script, url, region] = argArr;

  if (!urlRE.test(url)) {
    stop(`Invalid url:${url}`);
  }
  const regionEntry = regionList.find((v) => v.name === region);
  if (!regionEntry) stop(`Invalid region:${region}`);

  const { regionId } = regionEntry;
  return { url, region, regionId };
}

function stop(message) {
  console.error(message);
  process.exit(1);
}

module.exports = handleArguments

